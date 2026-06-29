import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { fetch as undiciFetch } from "undici";

const clientOptions = {
  global: {
    // Next.js parchea `globalThis.fetch` para agregar su Data Cache, y
    // esa capa corrompió los uploads binarios a Supabase Storage en
    // producción (Vercel) - el archivo perdía sus primeros bytes,
    // reemplazados por el carácter de reemplazo UTF-8. Pasar
    // `cache: "no-store"` al fetch parcheado NO lo arregló, así que
    // usamos `undici` importado directamente: es una referencia a la
    // función fetch real, sin pasar por el parche de Next.js.
    fetch: undiciFetch as unknown as typeof fetch,
  },
};

/** Cliente con anon key — sujeto a RLS. Úsalo para todo lo que las
 * políticas ya permiten abiertamente (lecturas, búsquedas). */
export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    clientOptions
  );
}

/**
 * Cliente con service_role — ignora RLS por completo. Úsalo SOLO donde RLS
 * no puede expresar la restricción que necesitas (ej. "solo mi backend
 * puede insertar aquí", sin tener sistema de auth para que RLS distinga
 * quién pregunta). No uses esto por comodidad en lecturas u operaciones que
 * ya están abiertas — eso le quita su función de red de seguridad a RLS.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    clientOptions
  );
}
