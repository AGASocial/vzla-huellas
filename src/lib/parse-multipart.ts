import Busboy from "busboy";
import { Readable } from "stream";

type ParsedMultipart = {
  fields: Record<string, string>;
  file: { buffer: Buffer; filename: string; mimeType: string } | null;
};

// Límite generoso para una foto de celular (incluso en alta resolución),
// pero que evita que alguien suba archivos de decenas de MB y dispare el
// costo de storage/bandwidth de Supabase sin ningún freno.
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

export class UploadDemasiadoGrandeError extends Error {
  constructor() {
    super(`El archivo supera el límite de ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`);
  }
}

/**
 * Parsea un request multipart/form-data leyendo el body crudo con busboy,
 * sin pasar por `Request.formData()`.
 *
 * Por qué: en producción (Vercel), `request.formData()` corrompió archivos
 * binarios - el archivo subido llegaba a Storage con los primeros bytes
 * reemplazados por el carácter de reemplazo UTF-8 (�), señal de que el
 * parser interno decodificó el body como texto en algún punto. Esto no
 * ocurría en `next dev`, solo en el build de producción. Parsear nosotros
 * mismos con busboy evita ese bug por completo.
 */
export async function parseMultipart(request: Request): Promise<ParsedMultipart> {
  // Rechazar por Content-Length ANTES de leer el body completo a memoria —
  // si solo confiáramos en el límite de busboy, ya habríamos bufferizado
  // el archivo entero (potencialmente decenas de MB) antes de descartarlo.
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_UPLOAD_BYTES) {
    throw new UploadDemasiadoGrandeError();
  }

  const contentType = request.headers.get("content-type") ?? "";
  const bodyBuffer = Buffer.from(await request.arrayBuffer());

  return new Promise((resolve, reject) => {
    const busboy = Busboy({
      headers: { "content-type": contentType },
      limits: { fileSize: MAX_UPLOAD_BYTES },
    });
    const fields: Record<string, string> = {};
    let file: ParsedMultipart["file"] = null;
    let truncado = false;

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (name, stream, info) => {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("limit", () => {
        truncado = true;
      });
      stream.on("end", () => {
        if (name === "huella" && !truncado) {
          file = {
            buffer: Buffer.concat(chunks),
            filename: info.filename,
            mimeType: info.mimeType,
          };
        }
      });
    });

    busboy.on("finish", () => {
      if (truncado) {
        reject(new UploadDemasiadoGrandeError());
        return;
      }
      resolve({ fields, file });
    });
    busboy.on("error", reject);

    Readable.from(bodyBuffer).pipe(busboy);
  });
}
