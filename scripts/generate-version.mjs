// Genera src/lib/version.ts con la versión actual: "<version del package.json>-<cantidad de commits>".
// Se corre automáticamente antes de "dev" y "build" (ver package.json), así
// que la versión mostrada en el pie de página siempre refleja el commit
// actual sin que nadie tenga que actualizarla a mano.

import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  await import("fs").then((fs) => fs.readFileSync(join(__dirname, "../package.json"), "utf-8"))
);

let commitCount = "0";
try {
  commitCount = execSync("git rev-list --count HEAD", { cwd: join(__dirname, ".."), encoding: "utf-8" }).trim();
} catch {
  // Sin git disponible (ej. build sin historial completo): deja en "0".
}

const version = `${packageJson.version}-${commitCount}`;

writeFileSync(
  join(__dirname, "../src/lib/version.ts"),
  `// Generado automáticamente por scripts/generate-version.mjs — no editar a mano.\nexport const APP_VERSION = "${version}";\n`
);

console.log(`Versión generada: ${version}`);
