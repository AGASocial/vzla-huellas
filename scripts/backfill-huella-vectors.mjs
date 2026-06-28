// Calcula huella_vector para registros existentes que no lo tienen (NULL),
// sin que nadie tenga que volver a subir su imagen. Útil después de migrar
// de motor de matching o de limpiar la columna manualmente.
//
// Uso:
//   AFIS_SERVICE_URL=http://localhost:8080 node scripts/backfill-huella-vectors.mjs
//
// Lee NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY de .env.local.

import { readFileSync } from "fs";

function loadEnvLocal() {
  const content = readFileSync(new URL("../.env.local", import.meta.url), "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2];
  }
  return env;
}

const env = loadEnvLocal();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const AFIS_SERVICE_URL = process.env.AFIS_SERVICE_URL || env.AFIS_SERVICE_URL;
const AFIS_SERVICE_TOKEN = process.env.AFIS_SERVICE_TOKEN || env.AFIS_SERVICE_TOKEN;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}
if (!AFIS_SERVICE_URL) {
  console.error("Falta AFIS_SERVICE_URL (env var o en .env.local)");
  process.exit(1);
}

const TABLES = ["vzla_huellas_familiares_buscados", "vzla_huellas_huellas_desconocidas"];

async function extractFeatures(imageBuffer) {
  const response = await fetch(`${AFIS_SERVICE_URL}/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      ...(AFIS_SERVICE_TOKEN ? { Authorization: `Bearer ${AFIS_SERVICE_TOKEN}` } : {}),
    },
    body: imageBuffer,
  });
  if (!response.ok) {
    throw new Error(`/extract falló: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  return data.template;
}

async function backfillTable(table) {
  const listResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=id,huella_url&huella_vector=is.null`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  const rows = await listResponse.json();
  console.log(`${table}: ${rows.length} registro(s) sin huella_vector`);

  for (const row of rows) {
    try {
      const imageResponse = await fetch(row.huella_url);
      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const template = await extractFeatures(imageBuffer);

      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${row.id}`, {
        method: "PATCH",
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ huella_vector: template }),
      });

      if (!updateResponse.ok) {
        console.error(`  ✗ ${row.id}: ${updateResponse.status} ${await updateResponse.text()}`);
      } else {
        console.log(`  ✓ ${row.id}`);
      }
    } catch (error) {
      console.error(`  ✗ ${row.id}: ${error.message}`);
    }
  }
}

for (const table of TABLES) {
  await backfillTable(table);
}
console.log("Listo.");
