-- Cierra el agujero de subida directa a Storage: hasta ahora cualquiera
-- con la anon key (pública, visible en el navegador) podía subir archivos
-- directo a los buckets de huellas, saltándose por completo el límite de
-- tamaño (10MB) y las validaciones de imagen que hace la app.
--
-- Quitamos la política pública de INSERT. La app sigue subiendo archivos
-- normal porque src/lib/storage-upload.ts ahora usa SUPABASE_SERVICE_ROLE_KEY,
-- que ignora RLS por completo — no necesita ninguna política de INSERT.
-- La lectura pública (para mostrar las fotos) no se toca.

drop policy if exists "vzla_huellas_familiares_bucket_public_insert" on storage.objects;
drop policy if exists "vzla_huellas_desconocidas_bucket_public_insert" on storage.objects;
