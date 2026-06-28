import type { SupabaseClient } from "@supabase/supabase-js";
import type { FingerprintMatcher } from "./types";

/**
 * Devuelve el vector ya guardado de un registro. Si el registro es anterior
 * a la introducción de `huella_vector` (NULL), lo calcula una vez a partir
 * de la imagen y lo persiste, para que las próximas comparaciones ya no
 * necesiten volver a descargar esa imagen.
 */
export async function getOrComputeVector(
  supabase: SupabaseClient,
  table: string,
  row: { id: string; huella_url: string; huella_vector: number[] | null },
  matcher: FingerprintMatcher
): Promise<number[] | null> {
  if (row.huella_vector) return row.huella_vector;

  try {
    const response = await fetch(row.huella_url);
    const buffer = Buffer.from(await response.arrayBuffer());
    const vector = await matcher.extractFeatures(buffer);
    await supabase.from(table).update({ huella_vector: vector }).eq("id", row.id);
    return vector;
  } catch {
    return null;
  }
}
