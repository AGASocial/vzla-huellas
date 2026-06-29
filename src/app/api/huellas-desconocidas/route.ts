import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerClient, createServiceRoleClient } from "@/lib/supabase-server";
import { getMatcher } from "@/lib/matcher";
import { normalizeToJpeg } from "@/lib/normalize-image";
import { parseMultipart, UploadDemasiadoGrandeError } from "@/lib/parse-multipart";
import { uploadToStorage } from "@/lib/storage-upload";
import { startTimer, logMetric } from "@/lib/timing";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createServerClient();
  const { data, error, count } = await supabase
    .from("vzla_huellas_huellas_desconocidas")
    .select("*", { count: "exact" })
    .is("match_confirmado_id", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    huellas: data,
    page,
    pageSize: PAGE_SIZE,
    total: count ?? 0,
    totalPages: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  });
}

export async function POST(request: Request) {
  const endTotal = startTimer();

  let fields: Record<string, string>;
  let file: { buffer: Buffer; filename: string; mimeType: string } | null;
  try {
    ({ fields, file } = await parseMultipart(request));
  } catch (error) {
    if (error instanceof UploadDemasiadoGrandeError) {
      return NextResponse.json({ error: error.message }, { status: 413 });
    }
    throw error;
  }

  const observaciones = String(fields.observaciones ?? "").trim();
  const direccion = String(fields.direccion ?? "").trim();
  const estado = String(fields.estado ?? "").trim();
  const latitudRaw = fields.latitud;
  const longitudRaw = fields.longitud;

  if (!file) {
    return NextResponse.json({ error: "Falta la imagen de la huella" }, { status: 400 });
  }

  if (estado && estado !== "fallecido" && estado !== "con_vida") {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const latitud = latitudRaw ? Number(latitudRaw) : null;
  const longitud = longitudRaw ? Number(longitudRaw) : null;
  if (
    (latitud !== null && (Number.isNaN(latitud) || latitud < -90 || latitud > 90)) ||
    (longitud !== null && (Number.isNaN(longitud) || longitud < -180 || longitud > 180))
  ) {
    return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  let huellaBuffer: Buffer;
  try {
    huellaBuffer = await normalizeToJpeg(file.buffer);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo procesar la imagen" },
      { status: 400 }
    );
  }
  const fileName = `${randomUUID()}.jpg`;

  const uploadResult = await uploadToStorage(
    "vzla_huellas_desconocidas",
    fileName,
    huellaBuffer,
    "image/jpeg"
  );
  if ("error" in uploadResult) {
    return NextResponse.json({ error: uploadResult.error }, { status: 500 });
  }
  const publicUrlData = uploadResult;

  const matcher = getMatcher();
  let huellaVector: string;
  const endExtract = startTimer();
  try {
    huellaVector = await matcher.extractFeatures(huellaBuffer);
  } catch (error) {
    logMetric("hash_huella", { route: "POST /api/huellas-desconocidas", fase: "extract", ok: false, duration_ms: endExtract() });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo analizar la huella. Intenta con otra foto.",
      },
      { status: 400 }
    );
  }
  logMetric("hash_huella", { route: "POST /api/huellas-desconocidas", fase: "extract", ok: true, duration_ms: endExtract() });

  const { data: inserted, error: insertError } = await supabase
    .from("vzla_huellas_huellas_desconocidas")
    .insert({
      huella_url: publicUrlData.publicUrl,
      huella_vector: huellaVector,
      observaciones: observaciones || null,
      direccion: direccion || null,
      estado: estado || null,
      latitud,
      longitud,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Igual que en POST /api/familiares: la comparación contra registros
  // existentes la hace la pantalla de candidatos al cargar, no este POST.
  logMetric("endpoint", { route: "POST /api/huellas-desconocidas", duration_ms: endTotal() });
  return NextResponse.json({ huellaDesconocida: inserted });
}
