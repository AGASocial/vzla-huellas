-- Coordenadas GPS del celular al momento de escanear (lat/lng), capturadas
-- en /escanear junto con dirección y estado de la persona. `direccion` y
-- `estado` ya existían (se usaban solo al confirmar un match); ahora también
-- se pueden capturar desde el inicio, en el momento del escaneo en terreno.

alter table vzla_huellas_huellas_desconocidas
  add column if not exists latitud double precision,
  add column if not exists longitud double precision;
