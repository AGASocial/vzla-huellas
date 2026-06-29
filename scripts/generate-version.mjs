// Genera src/lib/version.ts con la versión actual:
// "<version del package.json>-<buildNumber>+<hash corto del commit>".
//
// El hash corto es lo importante para debugging: con él se puede ubicar
// exactamente qué código estaba desplegado cuando alguien reporta un bug
// ("¿qué versión ves en el pie de página?" -> `git show <hash>`).
//
// `buildNumber` (en package.json) es un contador MANUAL — increméntalo a
// mano en cada commit que quieras poder distinguir en el footer. No se
// calcula con `git rev-list --count` porque Vercel clona el repo con
// historial superficial (shallow clone): ese conteo queda pegado en la
// profundidad del clon en vez de crecer con cada commit real, y arreglarlo
// (`git fetch --unshallow`) suma tiempo de build solo por un número
// cosmético. Vercel sí expone VERCEL_GIT_COMMIT_SHA directamente, sin
// necesitar git ni clon completo, así que el hash no tiene ese problema.

import { writeFileSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8"));

function run(command) {
  try {
    return execSync(command, { cwd: join(__dirname, ".."), encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

const buildNumber = packageJson.buildNumber ?? 0;

const fullSha = process.env.VERCEL_GIT_COMMIT_SHA || run("git rev-parse HEAD") || "";
const commitHash = fullSha ? fullSha.slice(0, 7) : "sinhash";

const version = `${packageJson.version}-${buildNumber}+${commitHash}`;

writeFileSync(
  join(__dirname, "../src/lib/version.ts"),
  `// Generado automáticamente por scripts/generate-version.mjs - no editar a mano.\nexport const APP_VERSION = "${version}";\nexport const APP_COMMIT_SHA = "${fullSha}";\n`
);

console.log(`Versión generada: ${version}`);
