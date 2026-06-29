import type { SupabaseClient } from "@supabase/supabase-js";
import type { FingerprintMatcher } from "./types";

type Lado = "familiar" | "huella";

const COLUMNA: Record<Lado, "familiar_id" | "huella_desconocida_id"> = {
  familiar: "familiar_id",
  huella: "huella_desconocida_id",
};

function ladoContrario(lado: Lado): Lado {
  return lado === "familiar" ? "huella" : "familiar";
}

/**
 * Compara `probeVector` contra cada candidato en `candidatos`, reusando
 * scores ya guardados en vzla_huellas_matches (comparar dos templates fijos
 * siempre da el mismo resultado, así que una vez calculado no hace falta
 * repetirlo). Solo se compara el "delta": los candidatos que todavía no
 * tienen una fila cacheada para este par con la versión actual del matcher.
 *
 * `fixedSide`/`fixedId` identifican el lado que se mantiene constante (ej.
 * un familiar fijo comparado contra muchas huellas, o una huella fija
 * comparada contra muchos familiares) — los `candidatos` son siempre el
 * lado contrario.
 *
 * Devuelve un Map candidatoId -> score, leído de caché o recién calculado
 * (y persistido para la próxima vez).
 */
export async function getOrComputeMatches(
  supabase: SupabaseClient,
  matcher: FingerprintMatcher,
  fixedSide: Lado,
  fixedId: string,
  probeVector: string,
  candidatos: { id: string; vector: string }[]
): Promise<Map<string, number>> {
  const matcherVersion = matcher.matcherVersion();
  const scores = new Map<string, number>();

  if (candidatos.length === 0) return scores;

  const columnaFija = COLUMNA[fixedSide];
  const columnaVariable = COLUMNA[ladoContrario(fixedSide)];

  const { data: cached } = await supabase
    .from("vzla_huellas_matches")
    .select(`${columnaVariable}, score`)
    .eq(columnaFija, fixedId)
    .eq("matcher_version", matcherVersion)
    .in(columnaVariable, candidatos.map((c) => c.id));

  for (const row of (cached ?? []) as Record<string, unknown>[]) {
    scores.set(row[columnaVariable] as string, Number(row.score));
  }

  const delta = candidatos.filter((c) => !scores.has(c.id));

  const filasNuevas = [];
  for (const candidato of delta) {
    const score = await matcher.compareFeatures(probeVector, candidato.vector);
    scores.set(candidato.id, score);
    filasNuevas.push({
      [columnaFija]: fixedId,
      [columnaVariable]: candidato.id,
      score,
      matcher_version: matcherVersion,
    });
  }

  if (filasNuevas.length > 0) {
    await supabase.from("vzla_huellas_matches").upsert(filasNuevas);
  }

  return scores;
}
