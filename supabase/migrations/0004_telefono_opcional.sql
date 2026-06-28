-- "Número de teléfono" (de la persona desaparecida, no el del familiar)
-- vuelve a ser opcional en el formulario.

alter table vzla_huellas_familiares_buscados
  alter column telefono drop not null;

alter table vzla_huellas_familiares_buscados
  drop constraint if exists telefono_formato;
alter table vzla_huellas_familiares_buscados
  add constraint telefono_formato check (telefono is null or telefono ~ '^[0-9+\-\s]{7,20}$');
