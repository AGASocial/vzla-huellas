// Genera src/lib/version.ts con la versión actual:
// "<version del package.json>-<cantidad de commits>+<hash corto del commit>".
// Se corre automáticamente antes de "dev" y "build" (ver package.json), así
// que la versión mostrada en el pie de página siempre refleja el commit
// actual sin que nadie tenga que actualizarla a mano.
//
// El hash corto es lo importante para debugging: con él se puede ubicar
// exactamente qué código estaba desplegado cuando alguien reporta un bug
// ("¿qué versión ves en el pie de página?" -> `git show <hash>`).
// Vercel expone VERCEL_GIT_COMMIT_SHA en el build aunque el clon sea
// superficial; en local usamos `git rev-parse` como respaldo.

import { execSync } from "child_process";
import { writeFileSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8"));

function run(command) {
  try {
    return execSync(command, { cwd: join(__dirname, ".."), encoding: "utf-8" }).trim();
  } catch {
    return null;
  }
}

const commitCount = run("git rev-list --count HEAD") ?? "0";

const fullSha = process.env.VERCEL_GIT_COMMIT_SHA || run("git rev-parse HEAD") || "";
const commitHash = fullSha ? fullSha.slice(0, 7) : "sinhash";

const version = `${packageJson.version}-${commitCount}+${commitHash}`;

writeFileSync(
  join(__dirname, "../src/lib/version.ts"),
  `// Generado automáticamente por scripts/generate-version.mjs — no editar a mano.\nexport const APP_VERSION = "${version}";\nexport const APP_COMMIT_SHA = "${fullSha}";\n`
);

console.log(`Versión generada: ${version}`);
