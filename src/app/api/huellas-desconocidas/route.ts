import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServerClient } from "@/lib/supabase-server";
import { getMatcher } from "@/lib/matcher";
import { getOrComputeVector } from "@/lib/matcher/get-or-compute-vector";

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
    .from("vzla_huellas_desconocidas")
    .getPublicUrl(fileName);

  const matcher = getMatcher();
  const huellaVector = await matcher.extractFeatures(huellaBuffer);

  const { data: inserted, error: insertError } = await supabase
    .from("vzla_huellas_huellas_desconocidas")
    .insert({ huella_url: publicUrlData.publicUrl, huella_vector: huellaVector })
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

  const candidatos = [];
  for (const familiar of familiares ?? []) {
    const otroVector = await getOrComputeVector(
      supabase,
      "vzla_huellas_familiares_buscados",
      familiar,
      matcher
    );
    if (!otroVector) continue;
    const score = await matcher.compareFeatures(huellaVector, otroVector);
    candidatos.push({ familiar, score });
  }
  candidatos.sort((a, b) => b.score - a.score);

  return NextResponse.json({ huellaDesconocida: inserted, candidatos });
}
