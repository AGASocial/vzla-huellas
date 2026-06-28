import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { parseMultipart } from "@/lib/parse-multipart";
import { normalizeToJpeg } from "@/lib/normalize-image";
import { createServerClient } from "@/lib/supabase-server";

function hex(buffer: Buffer, len = 24) {
  return buffer.subarray(0, len).toString("hex");
}

// Endpoint temporal de diagnóstico: revisa la integridad del buffer en cada
// paso del pipeline real (parseo -> normalización -> subida -> descarga) para
// aislar exactamente dónde se corrompen los bytes.
export async function POST(request: Request) {
  const { file } = await parseMultipart(request);
  if (!file) {
    return NextResponse.json({ error: "sin archivo" }, { status: 400 });
  }

  const step1_parsedHex = hex(file.buffer);

  const normalized = await normalizeToJpeg(file.buffer);
  const step2_normalizedHex = hex(normalized);

  const supabase = createServerClient();
  const fileName = `debug-${randomUUID()}.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("vzla_huellas_desconocidas")
    .upload(fileName, normalized, { contentType: "image/jpeg" });

  if (uploadError) {
    return NextResponse.json({ step1_parsedHex, step2_normalizedHex, uploadError: uploadError.message });
  }

  // Descarga vía la API de Supabase (no la URL pública/CDN), para descartar
  // que el problema sea de caché o de cómo se sirve el archivo después.
  const { data: downloaded, error: downloadError } = await supabase.storage
    .from("vzla_huellas_desconocidas")
    .download(fileName);

  let step3_downloadedHex: string | null = null;
  if (downloaded) {
    const downloadedBuffer = Buffer.from(await downloaded.arrayBuffer());
    step3_downloadedHex = hex(downloadedBuffer);
  }

  return NextResponse.json({
    step1_parsedHex,
    step2_normalizedHex,
    fileName,
    step3_downloadedHex,
    downloadError: downloadError?.message ?? null,
  });
}
