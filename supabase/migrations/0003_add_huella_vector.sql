-- Guarda el vector de características de cada huella (calculado una sola
-- vez al subir la imagen) para que el matching no tenga que volver a
-- descargar ni reprocesar imágenes de Storage en cada comparación.
-- Esto evita que el costo de egress/cómputo crezca de forma cuadrática
-- con el número de registros.

alter table vzla_huellas_familiares_buscados
  add column if not exists huella_vector jsonb;

alter table vzla_huellas_huellas_desconocidas
  add column if not exists huella_vector jsonb;

-- Nota: los registros existentes (creados antes de esta migración) tendrán
-- huella_vector = NULL hasta que se vuelvan a procesar. El código de la app
-- ya filtra/ignora vectores nulos al comparar.
