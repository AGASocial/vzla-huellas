import type { SupabaseClient } from "@supabase/supabase-js";
import type { FingerprintMatcher } from "./types";

/**
 * Devuelve las features ya guardadas de un registro. Si el registro es
 * anterior a la introducción de `huella_vector` (NULL), o fue calculado con
 * un motor distinto al actual, lo recalcula a partir de la imagen y lo
 * persiste, para que las próximas comparaciones ya no necesiten volver a
 * descargar esa imagen.
 */
export async function getOrComputeVector(
  supabase: SupabaseClient,
  table: string,
  row: { id: string; huella_url: string; huella_vector: string | null },
  matcher: FingerprintMatcher
): Promise<string | null> {
  if (row.huella_vector) return row.huella_vector;

  try {
    const response = await fetch(row.huella_url);
    const buffer = Buffer.from(await response.arrayBuffer());
    const features = await matcher.extractFeatures(buffer);
    await supabase.from(table).update({ huella_vector: features }).eq("id", row.id);
    return features;
  } catch {
    return null;
  }
}
