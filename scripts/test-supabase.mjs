/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : test-supabase.mjs
 Descrição    : Roda os testes de integração com as chaves do Supabase local.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { execFileSync, spawnSync } from "node:child_process";

/*
 * `npm run test:supabase`: lê URL e chaves do Supabase local (`npx supabase status`) e roda
 * os testes de tests/integration/supabase com elas. Só para o stack local — nunca aponte
 * estas variáveis para homologação ou produção (os testes gravam e apagam dados).
 */
let status;
try {
  status = JSON.parse(execFileSync("npx", ["supabase", "status", "-o", "json"], { encoding: "utf8" }));
} catch {
  console.error("Supabase local fora do ar. Rode `npx supabase start` e depois `npx supabase db reset`.");
  process.exit(1);
}

const url = status.API_URL;
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url ?? "")) {
  console.error(`Recusado: ${url} não é o Supabase local.`);
  process.exit(1);
}

const result = spawnSync("npx", ["vitest", "run", "tests/integration/supabase", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: {
    ...process.env,
    SUPABASE_TEST_URL: url,
    SUPABASE_TEST_ANON_KEY: status.ANON_KEY,
    SUPABASE_TEST_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  },
});
process.exit(result.status ?? 1);
