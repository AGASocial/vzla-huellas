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
  const huellaVector = await getOrComputeVector(
    supabase,
    "vzla_huellas_huellas_desconocidas",
    huellaDesconocida,
    matcher
  );

  const endCompare = startTimer();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let candidatos: { familiar: any; score: number }[] = [];
  if (huellaVector) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conVector: { familiar: any; vector: string }[] = [];
    for (const familiar of familiares ?? []) {
      const otroVector = await getOrComputeVector(
        supabase,
        "vzla_huellas_familiares_buscados",
        familiar,
        matcher
      );
      if (otroVector) conVector.push({ familiar, vector: otroVector });
    }

    const scores = await getOrComputeMatches(
      supabase,
      matcher,
      "huella",
      id,
      huellaVector,
      conVector.map(({ familiar, vector }) => ({ id: familiar.id, vector }))
    );

    candidatos = conVector.map(({ familiar }) => ({
      familiar,
      score: scores.get(familiar.id) ?? 0,
    }));
  }
  candidatos = candidatos.filter(({ score }) => score > 1);
  candidatos.sort((a, b) => b.score - a.score);
  logMetric("hash_huella", {
    route: "GET /api/huellas-desconocidas/[id]/candidatos",
    fase: "compare",
    comparaciones: familiares?.length ?? 0,
    duration_ms: endCompare(),
  });

  const { latitud, longitud, ...huellaDesconocidaSinCoords } = huellaDesconocida;

  logMetric("endpoint", { route: "GET /api/huellas-desconocidas/[id]/candidatos", duration_ms: endTotal() });
  return NextResponse.json({
    huellaDesconocida: huellaDesconocidaSinCoords,
    candidatos: candidatos.slice(0, 20),
  });
}
