/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : explain-queries.mjs
 Descrição    : Roda supabase/perf/planos-de-consulta.sql no Supabase local, vazio e com volume sintético.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinicius Binda             Criação inicial (DBX-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

/*
 * `npm run perf:queries` (DBX-03): EXPLAIN ANALYZE das consultas do site, do proxy e do painel,
 * primeiro no banco como está (vazio ou só com o seed) e depois com volume sintético. Tudo roda
 * numa transação desfeita: o banco local termina igual. Recusa qualquer stack que não seja o local.
 */
const root = new URL("../", import.meta.url);
const sql = readFileSync(new URL("supabase/perf/planos-de-consulta.sql", root), "utf8");
const projectId = /^project_id\s*=\s*"([^"]+)"/m.exec(readFileSync(new URL("supabase/config.toml", root), "utf8"))[1];

let status;
try {
  status = JSON.parse(
    execFileSync("npx", ["supabase", "status", "-o", "json"], {
      encoding: "utf8",
      shell: process.platform === "win32",
    }),
  );
} catch {
  console.error("Supabase local fora do ar. Rode `npx supabase start`.");
  process.exit(1);
}
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(status.API_URL ?? "")) {
  console.error(`Recusado: ${status.API_URL} não é o Supabase local.`);
  process.exit(1);
}

for (const [volume, title] of [
  ["0", "Banco atual (vazio ou só o seed)"],
  ["1", "Volume sintético (10.000 cases, 61.000 mídias)"],
]) {
  console.log(`\n▶ ${title}\n`);
  const result = spawnSync(
    "docker",
    [
      "exec",
      "-i",
      `supabase_db_${projectId}`,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-q",
      "-v",
      `volume=${volume}`,
      "-f",
      "-",
    ],
    { input: sql, encoding: "utf8" },
  );
  process.stdout.write(result.stdout);
  if (result.status !== 0) {
    console.error(result.stderr);
    process.exit(1);
  }
}
