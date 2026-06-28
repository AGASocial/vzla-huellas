# Reencuentro

Herramienta humanitaria para ayudar a reencontrar familias en Venezuela
mediante registro y comparación visual de huellas digitales.

> **Importante:** sin el microservicio `services/afis-matcher` configurado
> (ver abajo), la comparación cae en similitud de imagen simple — que NO
> distingue huellas de forma confiable (probado: dedos distintos dan
> >88% de "similitud"). Configura `AFIS_SERVICE_URL` para matching real por
> minucias. Aun con eso, todo match debe confirmarse con autoridades, Cruz
> Roja u organismos forenses competentes antes de actuar.

## Setup

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En el **SQL Editor**, ejecuta en orden cada archivo de
   `supabase/migrations/`:
   - `0001_init.sql` crea las tablas `vzla_huellas_familiares_buscados` y
     `vzla_huellas_huellas_desconocidas`, habilita RLS con acceso abierto (sin
     login, según diseño del MVP), y crea los buckets de Storage
     `vzla_huellas_familiares` y `vzla_huellas_desconocidas` (públicos). Si la
     creación de buckets falla por permisos, créalos manualmente en el
     dashboard de Storage marcados como públicos.
   - `0002_enforce_required_fields.sql` agrega `NOT NULL` y `CHECK` para que
     los campos obligatorios del formulario (teléfono, dirección, correo,
     nombre/teléfono del familiar, formato de número de documento) no puedan
     quedar vacíos o con datos inválidos directamente en la base de datos.
   - `0003_add_huella_vector.sql` agrega la columna `huella_vector` (ver
     sección de costos abajo — clave para que el matching escale).
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
  `getMatcher()` usa `SourceAfisHttpMatcher` (matching real por minucias, vía
  el microservicio en `services/afis-matcher`) si `AFIS_SERVICE_URL` está
  configurada; si no, cae en `SimpleImageMatcher` (similitud de imagen, NO
  confiable — ver advertencia arriba).
- `services/afis-matcher` — microservicio Java standalone con
  [SourceAFIS](https://sourceafis.machinezoo.com/), el motor real de
  matching por minucias. Ver su propio `README.md` para correrlo en local o
  desplegarlo (Fly.io o Render). Una vez desplegado, copia su URL pública a
  `AFIS_SERVICE_URL` y el token a `AFIS_SERVICE_TOKEN` en las variables de
  entorno del proyecto Next.js (local y en Vercel).

  **Si ya tenías registros con `huella_vector` calculado por
  `SimpleImageMatcher`** y ahora activas `AFIS_SERVICE_URL`, ese vector viejo
  es incompatible con el nuevo formato. Corre esto una vez en el SQL Editor
  para forzar el recálculo perezoso (`getOrComputeVector` ya lo hace
  automáticamente la próxima vez que cada registro participe en una
  comparación):

  ```sql
  update vzla_huellas_familiares_buscados set huella_vector = null;
  update vzla_huellas_huellas_desconocidas set huella_vector = null;
  ```

## Costos y escalabilidad

El vector de características de cada huella se calcula **una sola vez**, al
subir la imagen, y se guarda en la columna `huella_vector` (`jsonb`). Las
comparaciones contra el lado opuesto (familiares ⟷ huellas desconocidas) se
hacen sobre esos vectores ya guardados, sin volver a descargar ni reprocesar
imágenes desde Storage.

Esto importa porque sin esta optimización, cada registro nuevo dispararía
una descarga + reprocesamiento de **todas** las imágenes del lado opuesto —
el costo de egress y cómputo crecería con el cuadrado del número de
registros. Con el vector precalculado, el costo crece linealmente: más
usuarios = más storage (barato y predecible), pero el matching en sí no
vuelve a tocar Storage. `src/lib/matcher/get-or-compute-vector.ts` además
auto-repara registros antiguos sin vector la primera vez que se comparan.

## Deploy

Conecta el repo a Vercel y agrega las mismas variables de entorno de
`.env.local` en el dashboard del proyecto (Settings → Environment Variables).
