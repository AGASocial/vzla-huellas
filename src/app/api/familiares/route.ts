import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerClient } from "@/lib/supabase-server";
import { getMatcher } from "@/lib/matcher";

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

  if (!nombre_completo || !tipo_documento || !nombre_familiar || !telefono_familiar) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const supabase = createServerClient();
  const huellaBuffer = Buffer.from(await huella.arrayBuffer());
  const fileName = `${randomUUID()}-${huella.name}`;

  const { error: uploadError } = await supabase.storage
    .from("vzla_huellas_familiares")
    .upload(fileName, huellaBuffer, { contentType: huella.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage
    .from("vzla_huellas_familiares")
    .getPublicUrl(fileName);

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

  const matcher = getMatcher();
  const candidatos = [];
  for (const huellaDesconocida of huellasDesconocidas ?? []) {
    try {
      const response = await fetch(huellaDesconocida.huella_url);
      const otraBuffer = Buffer.from(await response.arrayBuffer());
      const score = await matcher.compare(huellaBuffer, otraBuffer);
      candidatos.push({ huellaDesconocida, score });
    } catch {
      continue;
    }
  }
  candidatos.sort((a, b) => b.score - a.score);

  return NextResponse.json({ familiar: inserted, candidatos });
}
