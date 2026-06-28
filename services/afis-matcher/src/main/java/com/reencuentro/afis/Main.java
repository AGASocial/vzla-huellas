package com.reencuentro.afis;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.machinezoo.sourceafis.FingerprintImage;
import com.machinezoo.sourceafis.FingerprintMatcher;
import com.machinezoo.sourceafis.FingerprintTemplate;
import io.javalin.Javalin;
import io.javalin.http.Context;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Map;

/**
 * Microservicio HTTP que envuelve SourceAFIS (matching real de huellas por
 * minucias) para que el resto del stack (Next.js en Vercel) pueda usarlo sin
 * necesitar una JVM propia.
 *
 * Endpoints:
 *   POST /extract  body=bytes de la imagen          -> { "template": "<base64>" }
 *   POST /compare  body={ "probe": "...", "candidate": "..." } (base64) -> { "score": number }
 *
 * El "score" de SourceAFIS no es un porcentaje 0-100: es un valor abierto
 * donde >= 40 sugiere la misma huella (ver SourceAFIS_THRESHOLD).
 */
public class Main {
    private static final ObjectMapper json = new ObjectMapper();
    public static final double SOURCEAFIS_THRESHOLD = 40.0;

    public static void main(String[] args) {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        String authToken = System.getenv("AFIS_TOKEN");

        Javalin app = Javalin.create(config -> config.http.maxRequestSize = 20_000_000L);

        app.before(ctx -> {
            if (ctx.path().equals("/health")) return;
            if (authToken != null && !authToken.isBlank()) {
                String header = ctx.header("Authorization");
                if (header == null || !header.equals("Bearer " + authToken)) {
                    ctx.status(401).result("unauthorized");
                }
            }
        });

        app.get("/health", ctx -> ctx.result("ok"));

        app.post("/extract", Main::handleExtract);
        app.post("/compare", Main::handleCompare);

        app.exception(Exception.class, (e, ctx) -> {
            e.printStackTrace();
            ctx.status(400).json(Map.of("error", e.getMessage() == null ? "error desconocido" : e.getMessage()));
        });

        app.start(port);
        System.out.println("afis-matcher escuchando en puerto " + port);
    }

    /**
     * Fotos de celular llegan a 12+ MP. SourceAFIS no necesita esa
     * resolución (escáneres de huella reales son mucho más chicos) y su
     * costo de cómputo crece muy rápido con el tamaño de imagen: a
     * resolución completa, extraer features tarda ~70s; reducido a este
     * tamaño, baja a ~1-2s sin perder huellas que el ojo humano distinga.
     */
    private static final int MAX_DIMENSION = 800;

    private static byte[] downscaleIfNeeded(byte[] imageBytes) throws Exception {
        BufferedImage original = ImageIO.read(new ByteArrayInputStream(imageBytes));
        if (original == null) return imageBytes;

        int width = original.getWidth();
        int height = original.getHeight();
        int maxSide = Math.max(width, height);
        if (maxSide <= MAX_DIMENSION) return imageBytes;

        double scale = MAX_DIMENSION / (double) maxSide;
        int newWidth = (int) Math.round(width * scale);
        int newHeight = (int) Math.round(height * scale);

        BufferedImage resized = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resized.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(original, 0, 0, newWidth, newHeight, null);
        g.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(resized, "jpg", out);
        return out.toByteArray();
    }

    private static void handleExtract(Context ctx) throws Exception {
        byte[] imageBytes = downscaleIfNeeded(ctx.bodyAsBytes());
        FingerprintImage image = new FingerprintImage(imageBytes);
        FingerprintTemplate template = new FingerprintTemplate(image);
        String encoded = Base64.getEncoder().encodeToString(template.toByteArray());
        ctx.json(Map.of("template", encoded));
    }

    private static void handleCompare(Context ctx) throws Exception {
        Map<?, ?> body = json.readValue(ctx.body(), Map.class);
        byte[] probeBytes = Base64.getDecoder().decode((String) body.get("probe"));
        byte[] candidateBytes = Base64.getDecoder().decode((String) body.get("candidate"));

        FingerprintTemplate probe = new FingerprintTemplate(probeBytes);
        FingerprintTemplate candidate = new FingerprintTemplate(candidateBytes);
        double score = new FingerprintMatcher(probe).match(candidate);

        ctx.json(Map.of("score", score, "threshold", SOURCEAFIS_THRESHOLD, "match", score >= SOURCEAFIS_THRESHOLD));
    }
}
