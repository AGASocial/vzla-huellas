-- Campo libre para notas de quien escanea la huella desconocida en el
-- terreno (ej. lugar exacto, estado del cuerpo, señas particulares).

alter table vzla_huellas_huellas_desconocidas
  add column if not exists observaciones text;
