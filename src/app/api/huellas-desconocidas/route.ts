import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerClient } from "@/lib/supabase-server";
import { getMatcher } from "@/lib/matcher";

export async function GET() {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("vzla_huellas_huellas_desconocidas")
    .select("*")
    .is("match_confirmado_id", null)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ huellas: data });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const huella = formData.get("huella") as File | null;

  if (!huella) {
    return NextResponse.json({ error: "Falta la imagen de la huella" }, { status: 400 });
  }

  const supabase = createServerClient();
  const huellaBuffer = Buffer.from(await huella.arrayBuffer());
  const fileName = `${randomUUID()}-${huella.name}`;

  const { error: uploadError } = await supabase.storage
    .from("vzla_huellas_desconocidas")
    .upload(fileName, huellaBuffer, { contentType: huella.type });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage
    .from("vzla_huellas_desconocidas")
    .getPublicUrl(fileName);

  const { data: inserted, error: insertError } = await supabase
    .from("vzla_huellas_huellas_desconocidas")
    .insert({ huella_url: publicUrlData.publicUrl })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: familiares, error: fetchError } = await supabase
    .from("vzla_huellas_familiares_buscados")
    .select("*");

  if (fetchError) {
    return NextResponse.json({ huellaDesconocida: inserted, candidatos: [] });
  }

  const matcher = getMatcher();
  const candidatos = [];
  for (const familiar of familiares ?? []) {
    try {
      const response = await fetch(familiar.huella_url);
      const otraBuffer = Buffer.from(await response.arrayBuffer());
      const score = await matcher.compare(huellaBuffer, otraBuffer);
      candidatos.push({ familiar, score });
    } catch {
      continue;
    }
  }
  candidatos.sort((a, b) => b.score - a.score);

  return NextResponse.json({ huellaDesconocida: inserted, candidatos });
}
