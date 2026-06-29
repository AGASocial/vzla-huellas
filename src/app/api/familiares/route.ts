import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerClient } from "@/lib/supabase-server";
import { getMatcher } from "@/lib/matcher";
import { getOrComputeVector } from "@/lib/matcher/get-or-compute-vector";
import { normalizeToJpeg } from "@/lib/normalize-image";
import { parseMultipart } from "@/lib/parse-multipart";
import { uploadToStorage } from "@/lib/storage-upload";
import { startTimer, logMetric } from "@/lib/timing";

export async function POST(request: Request) {
  const endTotal = startTimer();
  const { fields, file } = await parseMultipart(request);

  if (!file) {
    return NextResponse.json({ error: "Falta la imagen de la huella" }, { status: 400 });
  }

  const nombre_completo = String(fields.nombre_completo ?? "");
  const tipo_documento = String(fields.tipo_documento ?? "");
  const numero_documento = String(fields.numero_documento ?? "");
  const telefono = String(fields.telefono ?? "");
  const direccion = String(fields.direccion ?? "");
  const correo = String(fields.correo ?? "");
  const nombre_familiar = String(fields.nombre_familiar ?? "");
  const telefono_familiar = String(fields.telefono_familiar ?? "");

  if (
    !nombre_completo ||
    !tipo_documento ||
    (tipo_documento !== "sin_documento" && !numero_documento) ||
    !direccion ||
    !correo ||
    !nombre_familiar ||
    !telefono_familiar
  ) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const numeroDocumentoPatterns: Record<string, RegExp> = {
    V: /^[0-9]{1,8}$/,
    E: /^[0-9]{1,8}$/,
    pasaporte: /^[A-Za-z0-9]{1,9}$/,
  };
  const numeroDocumentoPattern = numeroDocumentoPatterns[tipo_documento];
  if (numeroDocumentoPattern && !numeroDocumentoPattern.test(numero_documento)) {
    return NextResponse.json(
      { error: "El número de documento no tiene un formato válido" },
      { status: 400 }
    );
  }

  const telefonoPattern = /^[0-9+\-\s]{7,20}$/;
  if (telefono && !telefonoPattern.test(telefono)) {
    return NextResponse.json({ error: "El teléfono no tiene un formato válido" }, { status: 400 });
  }
  if (!telefonoPattern.test(telefono_familiar)) {
    return NextResponse.json(
      { error: "El teléfono del familiar no tiene un formato válido" },
      { status: 400 }
    );
  }

  const correoPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!correoPattern.test(correo)) {
    return NextResponse.json({ error: "El correo no tiene un formato válido" }, { status: 400 });
  }

  const supabase = createServerClient();

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
    "vzla_huellas_familiares",
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
    logMetric("hash_huella", { route: "POST /api/familiares", fase: "extract", ok: false, duration_ms: endExtract() });
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
  logMetric("hash_huella", { route: "POST /api/familiares", fase: "extract", ok: true, duration_ms: endExtract() });

  const { data: inserted, error: insertError } = await supabase
    .from("vzla_huellas_familiares_buscados")
    .insert({
      nombre_completo,
      tipo_documento,
      numero_documento: numero_documento || null,
      telefono: telefono || null,
      direccion: direccion || null,
      correo: correo || null,
      nombre_familiar,
      telefono_familiar,
      huella_url: publicUrlData.publicUrl,
      huella_vector: huellaVector,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: huellasDesconocidas, error: fetchError } = await supabase
    .from("vzla_huellas_huellas_desconocidas")
    .select("*")
    .is("match_confirmado_id", null);

  if (fetchError) {
    return NextResponse.json({ familiar: inserted, candidatos: [] });
  }

  const endCompare = startTimer();
  const candidatos = [];
  for (const huellaDesconocida of huellasDesconocidas ?? []) {
    const otroVector = await getOrComputeVector(
      supabase,
      "vzla_huellas_huellas_desconocidas",
      huellaDesconocida,
      matcher
    );
    if (!otroVector) continue;
    const score = await matcher.compareFeatures(huellaVector, otroVector);
    candidatos.push({ huellaDesconocida, score });
  }
  candidatos.sort((a, b) => b.score - a.score);
  logMetric("hash_huella", {
    route: "POST /api/familiares",
    fase: "compare",
    comparaciones: huellasDesconocidas?.length ?? 0,
    duration_ms: endCompare(),
  });

  logMetric("endpoint", { route: "POST /api/familiares", duration_ms: endTotal() });
  return NextResponse.json({ familiar: inserted, candidatos });
}
