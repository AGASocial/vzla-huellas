import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerClient } from "@/lib/supabase-server";
import { getMatcher } from "@/lib/matcher";
import { getOrComputeVector } from "@/lib/matcher/get-or-compute-vector";

export async function POST(request: Request) {
  const formData = await request.formData();
  const huella = formData.get("huella") as File | null;

  if (!huella) {
    return NextResponse.json({ error: "Falta la imagen de la huella" }, { status: 400 });
  }

  const nombre_completo = String(formData.get("nombre_completo") ?? "");
  const tipo_documento = String(formData.get("tipo_documento") ?? "");
  const numero_documento = String(formData.get("numero_documento") ?? "");
  const telefono = String(formData.get("telefono") ?? "");
  const direccion = String(formData.get("direccion") ?? "");
  const correo = String(formData.get("correo") ?? "");
  const nombre_familiar = String(formData.get("nombre_familiar") ?? "");
  const telefono_familiar = String(formData.get("telefono_familiar") ?? "");

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
  const huellaBuffer = Buffer.from(await huella.arrayBuffer());
  const fileName = `${randomUUID()}-${huella.name}`;

  const { error: uploadError } = await supabase.storage
    .from("vzla_huellas_familiares")
    .upload(fileName, huellaBuffer, {
      contentType: huella.type,
      // El nombre del archivo es único (UUID) y nunca se sobreescribe:
      // se puede cachear como inmutable por un año sin riesgo.
      cacheControl: "31536000, immutable",
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage
    .from("vzla_huellas_familiares")
    .getPublicUrl(fileName);

  const matcher = getMatcher();
  const huellaVector = await matcher.extractFeatures(huellaBuffer);

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

  return NextResponse.json({ familiar: inserted, candidatos });
}
