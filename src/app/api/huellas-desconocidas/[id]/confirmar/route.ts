import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { familiar_id, direccion, estado } = body as {
    familiar_id: string;
    direccion: string;
    estado: "fallecido" | "con_vida";
  };

  if (!familiar_id || !direccion || !estado) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("vzla_huellas_huellas_desconocidas")
    .update({ match_confirmado_id: familiar_id, direccion, estado })
    .eq("id", id)
    .select(
      "*, familiar:vzla_huellas_familiares_buscados!match_confirmado_id(nombre_completo, nombre_familiar, telefono_familiar)"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ huellaDesconocida: data });
}
