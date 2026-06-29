/**
 * Sube un archivo a Supabase Storage con un POST manual, sin pasar por
 * `supabase-js`.
 *
 * Por qué: en producción (Vercel), `supabase.storage.from(...).upload()`
 * corrompía archivos binarios - confirmado con pruebas paso a paso (ver
 * historial de /api/debug-raw): el buffer llegaba intacto hasta justo antes
 * de esa llamada, y salía corrupto después. Una subida manual con `fetch` al
 * mismo endpoint, con el mismo buffer, no se corrompe. La causa exacta
 * dentro de storage-js no se identificó, pero este workaround está probado
 * en producción.
 *
 * Usa SUPABASE_SERVICE_ROLE_KEY (no la anon key) a propósito: el bucket ya
 * no tiene una política de INSERT pública, así que solo el service role
 * (que ignora RLS) puede escribir ahí. Esto evita que cualquiera con la
 * anon key (pública, visible en el navegador) suba archivos directo a
 * Storage saltándose el límite de tamaño y las validaciones de esta app.
 */
export async function uploadToStorage(
  bucket: string,
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<{ publicUrl: string } | { error: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${fileName}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": contentType,
      // El archivo es siempre un nombre nuevo (UUID), nunca se sobreescribe.
      "Cache-Control": "31536000, immutable",
    },
    body: new Uint8Array(buffer),
  });

  if (!response.ok) {
    return { error: `Storage upload falló: ${response.status} ${await response.text()}` };
  }

  return { publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}` };
}
