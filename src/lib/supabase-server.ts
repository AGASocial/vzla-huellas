import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        // Next.js parchea el fetch global para agregar su Data Cache. Esa
        // capa de cache corrompió los uploads binarios a Supabase Storage
        // en producción (Vercel) — el archivo subido perdía sus primeros
        // bytes, reemplazados por el carácter de reemplazo UTF-8. No
        // pasaba en `next dev`. Forzar cache: "no-store" desactiva esa
        // capa para las llamadas que hace supabase-js.
        fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
      },
    }
  );
}
