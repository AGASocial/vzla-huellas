import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

const MIN_QUERY_LENGTH = 3;
const RESULT_LIMIT = 10;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ resultados: [] });
  }

  const termino = q.replace(/[%_]/g, "\\$&");
  const patron = `%${termino}%`;

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("vzla_huellas_familiares_buscados")
    .select(
      "id, nombre_completo, tipo_documento, numero_documento, huella_url, matches:vzla_huellas_huellas_desconocidas!match_confirmado_id(id)"
    )
    .or(
      `nombre_completo.ilike.${patron},numero_documento.ilike.${patron},correo.ilike.${patron},telefono.ilike.${patron},telefono_familiar.ilike.${patron}`
    )
    .order("created_at", { ascending: false })
    .limit(RESULT_LIMIT);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const resultados = (data ?? []).map(({ matches, ...resto }) => ({
    ...resto,
    estado: matches && matches.length > 0 ? "encontrado" : "buscando",
  }));

  return NextResponse.json({ resultados });
}
