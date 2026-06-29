import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { fetch as undiciFetch } from "undici";

export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  );
}
