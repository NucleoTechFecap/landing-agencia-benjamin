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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-12).
 04/11/2026 Vinícius Nishimura Reis  Formulário público grava no Supabase local nas jornadas @cms (FORM-09).
 04/11/2026 Vinícius Nishimura Reis  Segunda passada, em série, para jornadas que mexem no conteúdo de todos (HOME-07).
 04/11/2026 Vinícius Nishimura Reis  Segredos descartáveis das rotas internas e destinatários fictícios (QA-06, QA-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { execFileSync, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

/*
 * `npm run test:e2e:cms`: jornadas do editor no CMS (tag @cms) contra o Supabase local.
 * Faz o build com as variáveis do stack local (NEXT_PUBLIC_* entram no build) e roda o
 * Playwright só no desktop, em duas passadas (a segunda é só de @home-global). Depois, para voltar às jornadas com o conteúdo versionado, rode
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
  // O formulário público grava com service_role: sem ela, o envio iria para a memória do processo.
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  // Rotas internas (QA-06, QA-05): segredos descartáveis, gerados a cada execução e fora do que o navegador recebe.
  CONTENT_REVALIDATE_SECRET: process.env.CONTENT_REVALIDATE_SECRET ?? randomBytes(24).toString("hex"),
  CRON_SECRET: process.env.CRON_SECRET ?? randomBytes(24).toString("hex"),
  // Só o `LogNotifier`, com destinatários fictícios: nenhum e-mail sai deste ambiente.
  NOTIFY_PROVIDER: "log",
  LEAD_NOTIFICATION_TO: "leads@benjamin.test",
  CONTACT_NOTIFICATION_TO: "contato@benjamin.test",
  FEEDBACK_NOTIFICATION_TO: "feedback@benjamin.test",
};
delete env.CONTENT_SOURCE;
delete env.RESEND_API_KEY;

const run = (command, args) => spawnSync(command, args, { stdio: "inherit", env }).status ?? 1;
const playwright = (...args) =>
  run("npx", ["playwright", "test", "--project=desktop", "--pass-with-no-tests", ...args, ...process.argv.slice(2)]);
if (run("npm", ["run", "build"]) !== 0) process.exit(1);
const parallel = playwright("--grep", "@cms");
// @home-global tira da Home os CTAs e destaques de todos: roda depois das demais e com um worker só.
const exclusive = playwright("--grep", "@home-global", "--workers=1");
process.exit(parallel || exclusive);
