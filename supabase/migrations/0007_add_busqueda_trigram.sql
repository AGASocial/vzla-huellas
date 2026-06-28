-- Búsqueda en la nueva pantalla "Ver base de datos": permite buscar un
-- registro de familiar por documento, correo, teléfono o teléfono del
-- familiar que lo registró, con `ilike '%term%'`. Sin índice esto sería un
-- table scan en cada tecla escrita; con 4000 personas buscando a la vez,
-- el índice trigram es lo que mantiene la query rápida.

create extension if not exists pg_trgm;

create index if not exists vzla_huellas_familiares_numero_documento_trgm_idx
  on vzla_huellas_familiares_buscados using gin (numero_documento gin_trgm_ops);

create index if not exists vzla_huellas_familiares_correo_trgm_idx
  on vzla_huellas_familiares_buscados using gin (correo gin_trgm_ops);

create index if not exists vzla_huellas_familiares_telefono_trgm_idx
  on vzla_huellas_familiares_buscados using gin (telefono gin_trgm_ops);

create index if not exists vzla_huellas_familiares_telefono_familiar_trgm_idx
  on vzla_huellas_familiares_buscados using gin (telefono_familiar gin_trgm_ops);
