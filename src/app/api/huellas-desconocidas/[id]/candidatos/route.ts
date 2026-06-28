import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getMatcher } from "@/lib/matcher";
import { getOrComputeVector } from "@/lib/matcher/get-or-compute-vector";

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
  const huellaVector = await getOrComputeVector(
    supabase,
    "vzla_huellas_huellas_desconocidas",
    huellaDesconocida,
    matcher
  );

  const candidatos = [];
  if (huellaVector) {
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
  }
  candidatos.sort((a, b) => b.score - a.score);

  const { latitud, longitud, ...huellaDesconocidaSinCoords } = huellaDesconocida;

  return NextResponse.json({
    huellaDesconocida: huellaDesconocidaSinCoords,
    candidatos: candidatos.slice(0, 20),
  });
}
