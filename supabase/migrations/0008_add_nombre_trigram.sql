-- Permite buscar en "Ver base de datos" también por el nombre de la
-- persona desaparecida, no solo por documento/correo/teléfono.

create index if not exists vzla_huellas_familiares_nombre_completo_trgm_idx
  on vzla_huellas_familiares_buscados using gin (nombre_completo gin_trgm_ops);
