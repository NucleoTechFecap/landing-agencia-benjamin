/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : e2e-cms.mjs
 Descrição    : Monta o build contra o Supabase local e roda as jornadas E2E do CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-12).
──────────────────────────────────────────────────────────────────────────────
*/

import { execFileSync, spawnSync } from "node:child_process";

/*
 * `npm run test:e2e:cms`: jornadas do editor no CMS (tag @cms) contra o Supabase local.
 * Faz o build com as variáveis do stack local (NEXT_PUBLIC_* entram no build) e roda o
 * Playwright só no desktop. Depois, para voltar às jornadas com o conteúdo versionado, rode
 * `npm run build` de novo sem as variáveis do Supabase.
 */
let status;
try {
  status = JSON.parse(execFileSync("npx", ["supabase", "status", "-o", "json"], { encoding: "utf8" }));
} catch {
  console.error("Supabase local fora do ar. Rode `npx supabase start` e `npx supabase db reset`.");
  process.exit(1);
}
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(status.API_URL ?? "")) {
  console.error(`Recusado: ${status.API_URL} não é o Supabase local.`);
  process.exit(1);
}

const port = process.env.E2E_PORT ?? "3100";
const env = {
  ...process.env,
  NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  E2E_SUPABASE_URL: status.API_URL,
  E2E_SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
};
delete env.CONTENT_SOURCE;

const run = (command, args) => spawnSync(command, args, { stdio: "inherit", env }).status ?? 1;
if (run("npm", ["run", "build"]) !== 0) process.exit(1);
process.exit(run("npx", ["playwright", "test", "--grep", "@cms", "--project=desktop", ...process.argv.slice(2)]));
