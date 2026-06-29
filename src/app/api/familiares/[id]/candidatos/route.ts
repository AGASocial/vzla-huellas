import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getMatcher } from "@/lib/matcher";
import { getOrComputeVector } from "@/lib/matcher/get-or-compute-vector";
import { getOrComputeMatches } from "@/lib/matcher/get-or-compute-matches";
import { startTimer, logMetric } from "@/lib/timing";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const endTotal = startTimer();
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
  const familiarVector = await getOrComputeVector(
    supabase,
    "vzla_huellas_familiares_buscados",
    familiar,
    matcher
  );

  const endCompare = startTimer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let candidatos: { huellaDesconocida: any; score: number }[] = [];
  if (familiarVector) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conVector: { huella: any; vector: string }[] = [];
    for (const huellaDesconocida of huellasDesconocidas ?? []) {
      const otroVector = await getOrComputeVector(
        supabase,
        "vzla_huellas_huellas_desconocidas",
        huellaDesconocida,
        matcher
      );
      if (otroVector) conVector.push({ huella: huellaDesconocida, vector: otroVector });
    }

    const scores = await getOrComputeMatches(
      supabase,
      matcher,
      "familiar",
      id,
      familiarVector,
      conVector.map(({ huella, vector }) => ({ id: huella.id, vector }))
    );

    candidatos = conVector.map(({ huella }) => ({
      huellaDesconocida: huella,
      score: scores.get(huella.id) ?? 0,
    }));
  }
  candidatos = candidatos.filter(({ score }) => score > 1);
  candidatos.sort((a, b) => b.score - a.score);
  logMetric("hash_huella", {
    route: "GET /api/familiares/[id]/candidatos",
    fase: "compare",
    comparaciones: huellasDesconocidas?.length ?? 0,
    duration_ms: endCompare(),
  });

  logMetric("endpoint", { route: "GET /api/familiares/[id]/candidatos", duration_ms: endTotal() });
  return NextResponse.json({ familiar, candidatos: candidatos.slice(0, 20) });
}
