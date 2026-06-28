# Reencuentro

Herramienta humanitaria para ayudar a reencontrar familias en Venezuela
mediante registro y comparación visual de huellas digitales.

> **Importante:** la comparación de huellas usa similitud de imagen (no es un
> sistema biométrico forense). Sirve como primer filtro orientativo para que
> un humano valide. Ver banner de aviso en la app.

## Setup

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En el **SQL Editor**, ejecuta el contenido de `supabase/schema.sql`.
   Esto crea las tablas `vzla_huellas_familiares_buscados` y
   `vzla_huellas_huellas_desconocidas`, habilita RLS con acceso abierto (sin
   login, según diseño del MVP), y crea los buckets de Storage
   `vzla_huellas_familiares` y `vzla_huellas_desconocidas` (públicos). Si la
   creación de buckets falla por permisos, créalos manualmente en el
   dashboard de Storage marcados como públicos.
3. Copia las credenciales del proyecto (Settings → API) a `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
   ```

4. Instala dependencias y corre en local:

   ```bash
   npm install
   npm run dev
   ```

## Estructura

- `/` — pantalla principal con los 3 botones (registrar familiar, escanear
  huella, ver galería de huellas sin identificar).
- `/familiares/nuevo` — formulario de registro de persona desaparecida.
- `/escanear` — captura de huella desconocida (cámara o subir imagen).
- `/candidatos` — galería pública de huellas sin identificar.
- `src/lib/matcher` — motor de comparación de huellas, intercambiable.
  Actualmente usa similitud de imagen simple (`SimpleImageMatcher`). Para
  enchufar un motor biométrico real (ej. SourceAFIS), implementa la interfaz
  `FingerprintMatcher` y cámbiala en `src/lib/matcher/index.ts`.

## Deploy

Conecta el repo a Vercel y agrega las mismas variables de entorno de
`.env.local` en el dashboard del proyecto (Settings → Environment Variables).
