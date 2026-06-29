-- Caché de comparaciones familiar <-> huella desconocida. Comparar dos
-- templates ya extraídos siempre da el mismo score (es determinístico), así
-- que no tiene sentido recalcularlo cada vez que alguien abre la pantalla
-- de candidatos. Guardamos cada par ya comparado aquí; en cada visita solo
-- se compara el "delta" (huellas nuevas que todavía no tienen fila para
-- ese familiar), no la lista completa.
--
-- `matcher_version` permite invalidar resultados viejos si cambia el motor
-- de matching (ej. de SimpleImageMatcher a SourceAFIS), sin tener que
-- adivinar qué filas son obsoletas: simplemente se ignoran/borran las que
-- no coincidan con la versión actual.

create table if not exists vzla_huellas_matches (
  familiar_id uuid not null references vzla_huellas_familiares_buscados (id) on delete cascade,
  huella_desconocida_id uuid not null references vzla_huellas_huellas_desconocidas (id) on delete cascade,
  score numeric not null,
  matcher_version text not null,
  created_at timestamptz not null default now(),
  primary key (familiar_id, huella_desconocida_id)
);

create index if not exists vzla_huellas_matches_huella_idx
  on vzla_huellas_matches (huella_desconocida_id);

alter table vzla_huellas_matches enable row level security;

create policy "vzla_huellas_matches_select_all" on vzla_huellas_matches for select using (true);
create policy "vzla_huellas_matches_insert_all" on vzla_huellas_matches for insert with check (true);
create policy "vzla_huellas_matches_delete_all" on vzla_huellas_matches for delete using (true);
