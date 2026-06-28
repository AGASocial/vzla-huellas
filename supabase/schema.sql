-- Reencuentro: esquema inicial
-- Ejecutar en el SQL Editor de Supabase

create extension if not exists "pgcrypto";

create table if not exists vzla_huellas_familiares_buscados (
  id uuid primary key default gen_random_uuid(),
  nombre_completo text not null,
  tipo_documento text not null check (tipo_documento in ('V', 'E', 'pasaporte', 'sin_documento')),
  numero_documento text,
  telefono text,
  direccion text,
  correo text,
  nombre_familiar text,
  telefono_familiar text,
  huella_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists vzla_huellas_huellas_desconocidas (
  id uuid primary key default gen_random_uuid(),
  huella_url text not null,
  direccion text,
  estado text check (estado in ('fallecido', 'con_vida')),
  match_confirmado_id uuid references vzla_huellas_familiares_buscados (id),
  created_at timestamptz not null default now()
);

alter table vzla_huellas_familiares_buscados enable row level security;
alter table vzla_huellas_huellas_desconocidas enable row level security;

-- Acceso abierto (MVP sin autenticación), según decisión de diseño.
create policy "vzla_huellas_familiares_select_all" on vzla_huellas_familiares_buscados for select using (true);
create policy "vzla_huellas_familiares_insert_all" on vzla_huellas_familiares_buscados for insert with check (true);

create policy "vzla_huellas_huellas_select_all" on vzla_huellas_huellas_desconocidas for select using (true);
create policy "vzla_huellas_huellas_insert_all" on vzla_huellas_huellas_desconocidas for insert with check (true);
create policy "vzla_huellas_huellas_update_all" on vzla_huellas_huellas_desconocidas for update using (true);

-- Buckets de Storage (crear manualmente en el dashboard si este bloque falla):
-- vzla_huellas_familiares (público)
-- vzla_huellas_desconocidas (público)
insert into storage.buckets (id, name, public)
values ('vzla_huellas_familiares', 'vzla_huellas_familiares', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('vzla_huellas_desconocidas', 'vzla_huellas_desconocidas', true)
on conflict (id) do nothing;

create policy "vzla_huellas_familiares_bucket_public_read" on storage.objects
  for select using (bucket_id = 'vzla_huellas_familiares');
create policy "vzla_huellas_familiares_bucket_public_insert" on storage.objects
  for insert with check (bucket_id = 'vzla_huellas_familiares');

create policy "vzla_huellas_desconocidas_bucket_public_read" on storage.objects
  for select using (bucket_id = 'vzla_huellas_desconocidas');
create policy "vzla_huellas_desconocidas_bucket_public_insert" on storage.objects
  for insert with check (bucket_id = 'vzla_huellas_desconocidas');

-- Migración: si la tabla ya existía con estas columnas como NOT NULL,
-- vuelve a ejecutar este bloque para relajarlas (campos requeridos:
-- nombre_completo, tipo_documento, nombre_familiar, telefono_familiar, huella).
alter table vzla_huellas_familiares_buscados alter column direccion drop not null;
alter table vzla_huellas_familiares_buscados alter column telefono drop not null;
alter table vzla_huellas_familiares_buscados alter column nombre_familiar drop not null;
alter table vzla_huellas_familiares_buscados alter column telefono_familiar drop not null;
