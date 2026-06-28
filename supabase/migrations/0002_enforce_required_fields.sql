-- Reencuentro: todos los campos del formulario "Sube los datos de tu familiar"
-- son obligatorios en el UI. Este migration refleja esa regla en la base de
-- datos con NOT NULL + CHECK, para que datos inválidos no puedan entrar aunque
-- no pasen por el formulario (ej. llamadas directas al API).
--
-- Si esta migración falla con "column contains null values", primero corrige
-- o elimina las filas existentes con esos campos vacíos y vuelve a correrla.

alter table vzla_huellas_familiares_buscados
  alter column telefono set not null,
  alter column direccion set not null,
  alter column correo set not null,
  alter column nombre_familiar set not null,
  alter column telefono_familiar set not null;

-- numero_documento es obligatorio salvo cuando tipo_documento = 'sin_documento'.
alter table vzla_huellas_familiares_buscados
  drop constraint if exists numero_documento_requerido;
alter table vzla_huellas_familiares_buscados
  add constraint numero_documento_requerido check (
    tipo_documento = 'sin_documento' or numero_documento is not null
  );

-- Formato del número de documento según el tipo (previene datos basura):
-- Cédula V/E: solo dígitos, máx. 8. Pasaporte: alfanumérico, máx. 9.
alter table vzla_huellas_familiares_buscados
  drop constraint if exists numero_documento_formato;
alter table vzla_huellas_familiares_buscados
  add constraint numero_documento_formato check (
    case tipo_documento
      when 'V' then numero_documento ~ '^[0-9]{1,8}$'
      when 'E' then numero_documento ~ '^[0-9]{1,8}$'
      when 'pasaporte' then numero_documento ~ '^[A-Za-z0-9]{1,9}$'
      else true
    end
  );

-- Formato básico de correo electrónico.
alter table vzla_huellas_familiares_buscados
  drop constraint if exists correo_formato;
alter table vzla_huellas_familiares_buscados
  add constraint correo_formato check (correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- Formato básico de teléfono (dígitos, espacios, +, - únicamente, 7 a 20 caracteres).
alter table vzla_huellas_familiares_buscados
  drop constraint if exists telefono_formato;
alter table vzla_huellas_familiares_buscados
  add constraint telefono_formato check (telefono ~ '^[0-9+\-\s]{7,20}$');

alter table vzla_huellas_familiares_buscados
  drop constraint if exists telefono_familiar_formato;
alter table vzla_huellas_familiares_buscados
  add constraint telefono_familiar_formato check (telefono_familiar ~ '^[0-9+\-\s]{7,20}$');
