import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getMatcher } from "@/lib/matcher";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: familiar, error: familiarError } = await supabase
    .from("vzla_huellas_familiares_buscados")
    .select("*")
    .eq("id", id)
    .single();

  if (familiarError || !familiar) {
    return NextResponse.json({ error: "Familiar no encontrado" }, { status: 404 });
  }

  const { data: huellasDesconocidas, error: huellasError } = await supabase
    .from("vzla_huellas_huellas_desconocidas")
    .select("*")
    .is("match_confirmado_id", null);

  if (huellasError) {
    return NextResponse.json({ error: huellasError.message }, { status: 500 });
  }

  const matcher = getMatcher();
  const familiarResponse = await fetch(familiar.huella_url);
  const familiarBuffer = Buffer.from(await familiarResponse.arrayBuffer());

  const candidatos = [];
  for (const huellaDesconocida of huellasDesconocidas ?? []) {
    try {
      const response = await fetch(huellaDesconocida.huella_url);
      const otraBuffer = Buffer.from(await response.arrayBuffer());
      const score = await matcher.compare(familiarBuffer, otraBuffer);
      candidatos.push({ huellaDesconocida, score });
    } catch {
      continue;
    }
  }
  candidatos.sort((a, b) => b.score - a.score);

  return NextResponse.json({ familiar, candidatos });
}
