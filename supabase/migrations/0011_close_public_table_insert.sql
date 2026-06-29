-- Mismo problema que el de Storage (migración 0010), pero en las tablas:
-- cualquiera con la anon key podía insertar filas directo en
-- vzla_huellas_familiares_buscados y vzla_huellas_huellas_desconocidas vía
-- la API REST de Supabase, saltándose por completo la app (validaciones de
-- formato más allá de los CHECK constraints, el límite de tamaño de
-- imagen, el procesamiento de huella, etc.).
--
-- RLS no puede distinguir "esto vino de mi backend" de "esto vino de un
-- script random" sin un sistema de auth — ambos son el mismo rol `anon`.
-- La única forma real de restringir el insert a "solo mi app" es que solo
-- la app tenga la credencial que lo permite. Por eso POST /api/familiares
-- y POST /api/huellas-desconocidas ahora insertan con
-- SUPABASE_SERVICE_ROLE_KEY (que ignora RLS), y quitamos la política
-- pública de INSERT de ambas tablas.
--
-- El SELECT sigue abierto a propósito (la app no tiene auth, ese acceso es
-- intencional) y no se toca.

drop policy if exists "vzla_huellas_familiares_insert_all" on vzla_huellas_familiares_buscados;
drop policy if exists "vzla_huellas_huellas_insert_all" on vzla_huellas_huellas_desconocidas;
