/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : test-migrations.mjs
 Descrição    : Testa no Supabase local a instalação limpa, o upgrade, o seed e a reversão das migrations.

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
 28/10/2026 Vinicius Binda             Criação inicial (DBX-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { execFileSync, spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";

/*
 * `npm run test:migrations` (DBX-02): roda contra o Supabase local e APAGA o banco local várias
 * vezes. Recusa qualquer stack que não seja o local. Etapas:
 *   1. instalação limpa (db reset = migrations + seed) e testes pgTAP;
 *   2. seed: recusado num banco marcado como produção e reexecutável sem duplicar;
 *   3. upgrade: banco na versão anterior, com dados, recebe as migrations novas sem perdê-los;
 *   4. reversão: os .down.sql em ordem inversa param se houver conteúdo, limpam o schema com
 *      confirmação, rodam de novo sem erro e as migrations reaplicam por cima;
 *   5. db reset final, para deixar o banco local como o comando documentado o cria.
 */
const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");
const versionOf = (file) => file.split("_")[0];

const migrations = readdirSync(new URL("supabase/migrations/", root))
  .filter((file) => file.endsWith(".sql"))
  .sort();
const rollbacks = readdirSync(new URL("supabase/rollbacks/", root))
  .filter((file) => file.endsWith(".down.sql"))
  .sort()
  .reverse();
const projectId = /^project_id\s*=\s*"([^"]+)"/m.exec(read("supabase/config.toml"))[1];
const container = `supabase_db_${projectId}`;

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

function step(title) {
  console.log(`\n▶ ${title}`);
}

function supabase(...args) {
  const result = spawnSync("npx", ["supabase", ...args], { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) fail(`npx supabase ${args.join(" ")} falhou.`);
}

/** psql dentro do container do banco local. `before` roda na mesma sessão, antes do arquivo. */
function psql(sql, { before = [] } = {}) {
  const args = ["exec", "-i", container, "psql", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1", "-qAt"];
  for (const command of before) args.push("-c", command);
  const result = spawnSync("docker", [...args, "-f", "-"], { input: sql, encoding: "utf8" });
  return { ok: result.status === 0, out: result.stdout.trim(), err: result.stderr.trim() };
}

function query(sql) {
  const result = psql(sql);
  if (!result.ok) fail(`Consulta falhou: ${result.err}`);
  return result.out;
}

function expectEqual(actual, expected, what) {
  if (actual !== expected) fail(`${what}: esperado "${expected}", obtido "${actual}".`);
  console.log(`  ✓ ${what}`);
}

const CONTENT_COUNT = `select string_agg(t || '=' || n, ' ' order by t) from (
  select 'areas' t, count(*) n from public.areas union all
  select 'services', count(*) from public.services union all
  select 'cases', count(*) from public.cases union all
  select 'ctas', count(*) from public.ctas union all
  select 'media_assets', count(*) from public.media_assets union all
  select 'site_settings', count(*) from public.site_settings) c;`;

const PROJECT_OBJECTS = `select
  (select count(*) from pg_tables where schemaname = 'public') +
  (select count(*) from pg_type t join pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'public' and t.typtype in ('e', 'd')) +
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public') +
  (select count(*) from pg_policies where schemaname = 'storage' and policyname like 'media:%') +
  (select count(*) from pg_trigger where tgname = 'on_auth_user_created');`;

// ─── 0. Só o stack local ──────────────────────────────────────────────────────

let status;
try {
  status = JSON.parse(
    execFileSync("npx", ["supabase", "status", "-o", "json"], {
      encoding: "utf8",
      shell: process.platform === "win32",
    }),
  );
} catch {
  fail("Supabase local fora do ar. Rode `npx supabase start`.");
}
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(status.API_URL ?? "")) {
  fail(`Recusado: ${status.API_URL} não é o Supabase local.`);
}

const missing = migrations.filter((file) => !rollbacks.includes(file.replace(/\.sql$/, ".down.sql")));
if (missing.length) fail(`Migrations sem rollback em supabase/rollbacks/: ${missing.join(", ")}`);
console.log(`${migrations.length} migrations, todas com rollback.`);

// ─── 1. Instalação limpa ──────────────────────────────────────────────────────

step("1. Instalação limpa: db reset (migrations + seed) e testes pgTAP");
supabase("db", "reset");
const seeded = query(CONTENT_COUNT);
console.log(`  seed: ${seeded}`);
if (seeded.includes("=0")) fail("O seed deixou alguma tabela de conteúdo vazia.");
supabase("test", "db");

// ─── 2. Seed ──────────────────────────────────────────────────────────────────

step("2. Seed: trava de produção e reexecução");
const seed = read("supabase/seed.sql");
const refused = psql(seed, { before: ["set app.ambiente = 'producao'"] });
if (refused.ok || !refused.err.includes("Seed de desenvolvimento recusado")) {
  fail(`O seed rodou num banco marcado como produção.\n${refused.err}`);
}
console.log("  ✓ banco com app.ambiente = 'producao' recusa o seed");
if (!psql(seed).ok) fail("O seed não roda de novo sem erro.");
expectEqual(query(CONTENT_COUNT), seeded, "seed reexecutado sem duplicar linhas");

// ─── 3. Upgrade ───────────────────────────────────────────────────────────────

const previous = versionOf(migrations.at(-2));
step(`3. Upgrade: banco na versão ${previous} com dados recebe as migrations seguintes`);
supabase("db", "reset", "--version", previous);
if (!psql(seed).ok) fail(`O seed não roda na versão ${previous}.`);
const before = query(CONTENT_COUNT);
supabase("migration", "up", "--local");
expectEqual(query(CONTENT_COUNT), before, "dados preservados no upgrade");
supabase("test", "db");

// ─── 4. Reversão ──────────────────────────────────────────────────────────────

step("4. Reversão: .down.sql em ordem inversa e reaplicação das migrations");
const cmsRollback = rollbacks.find((file) => file.includes("cms_content"));
const blocked = psql(read(`supabase/rollbacks/${cmsRollback}`));
if (blocked.ok || !blocked.err.includes("confirmar_rollback")) fail(`${cmsRollback} apagou conteúdo sem confirmação.`);
console.log(`  ✓ ${cmsRollback} para quando há conteúdo`);

// Cada .down.sql roda duas vezes seguidas: se a primeira cair no meio, repetir não pode dar erro.
for (const file of rollbacks) {
  for (const round of ["1ª", "2ª"]) {
    const result = psql(read(`supabase/rollbacks/${file}`), { before: ["set benjamin.confirmar_rollback = 'sim'"] });
    if (!result.ok) fail(`${file} (${round} execução) falhou:\n${result.err}`);
  }
}
console.log(`  ✓ ${rollbacks.length} rollbacks aplicados em ordem inversa, cada um duas vezes`);
expectEqual(query(PROJECT_OBJECTS), "0", "schema sem objetos do projeto após reverter tudo");

supabase("migration", "repair", "--status", "reverted", ...migrations.map(versionOf), "--local");
supabase("migration", "up", "--local");
if (!psql(seed).ok) fail("O seed não roda depois de reaplicar as migrations.");
expectEqual(query(CONTENT_COUNT), seeded, "migrations e seed reaplicados por cima da reversão");
supabase("test", "db");

// ─── 5. Estado final ──────────────────────────────────────────────────────────

step("5. db reset final");
supabase("db", "reset");
console.log("\n✓ Instalação limpa, seed, upgrade e reversão verificados.");
