import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getMatcher } from "@/lib/matcher";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: huellaDesconocida, error: huellaError } = await supabase
    .from("vzla_huellas_huellas_desconocidas")
    .select("*")
    .eq("id", id)
    .single();

  if (huellaError || !huellaDesconocida) {
    return NextResponse.json({ error: "Huella no encontrada" }, { status: 404 });
  }

  const { data: familiares, error: familiaresError } = await supabase
    .from("vzla_huellas_familiares_buscados")
    .select("*");

  if (familiaresError) {
    return NextResponse.json({ error: familiaresError.message }, { status: 500 });
  }

  const matcher = getMatcher();
  const huellaResponse = await fetch(huellaDesconocida.huella_url);
  const huellaBuffer = Buffer.from(await huellaResponse.arrayBuffer());

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

  return NextResponse.json({ huellaDesconocida, candidatos });
}
