/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : seed-users.mjs
 Descrição    : Cria contas de teste, uma por papel, no Supabase local. Recusa qualquer outro banco.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinicius Binda             Criação inicial (ARC-11).
──────────────────────────────────────────────────────────────────────────────
*/

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";

/*
 * `npm run seed:users` (ARC-11): uma conta de teste por papel, para entrar no painel depois de um
 * `supabase db reset` sem passar pelo convite por e-mail. Lê o endereço e a chave do próprio
 * `supabase status`, então não precisa de variável nenhuma, e só aceita o Supabase local. As senhas
 * são geradas a cada execução e aparecem só no terminal: nada fica no seed nem no repositório.
 * Rodar de novo troca as senhas e reaplica os papéis. Em produção, o caminho é o convite
 * (scripts/provision-admin.mjs).
 */
export const TEST_ACCOUNTS = [
  { email: "admin@teste.local", name: "Admin de Teste", role: "admin" },
  { email: "editor@teste.local", name: "Editor de Teste", role: "editor" },
  { email: "viewer@teste.local", name: "Leitor de Teste", role: "viewer" },
  { email: "pending@teste.local", name: "Pendente de Teste", role: "pending" },
];

export const isLocalApiUrl = (url) => /^http:\/\/(127\.0\.0\.1|localhost):\d+\/?$/.test(url ?? "");

export const generatePassword = () => randomBytes(18).toString("base64url");

function localStack() {
  let status;
  try {
    status = JSON.parse(
      execFileSync("npx", ["supabase", "status", "-o", "json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        shell: process.platform === "win32",
      }),
    );
  } catch {
    throw new Error("Supabase local fora do ar. Rode `npx supabase start` e `npx supabase db reset`.");
  }
  if (!isLocalApiUrl(status.API_URL)) throw new Error(`Recusado: ${status.API_URL} não é o Supabase local.`);
  return { url: status.API_URL, serviceRoleKey: status.SERVICE_ROLE_KEY };
}

async function run() {
  const { url, serviceRoleKey } = localStack();
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: existing, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw new Error(`Falha ao listar contas: ${listError.message}`);

  console.log(`Contas de teste em ${url} (as senhas valem até a próxima execução ou db reset):\n`);
  for (const account of TEST_ACCOUNTS) {
    const password = generatePassword();
    const attributes = { password, email_confirm: true, user_metadata: { full_name: account.name } };
    const current = existing.users.find((user) => user.email === account.email);
    const { data, error } = current
      ? await supabase.auth.admin.updateUserById(current.id, attributes)
      : await supabase.auth.admin.createUser({ email: account.email, ...attributes });
    if (error) throw new Error(`Falha em ${account.email}: ${error.message}`);

    // O trigger handle_new_user cria o perfil como "pending"; aqui entra o papel da conta.
    const { error: roleError } = await supabase
      .from("profiles")
      .update({ role: account.role, full_name: account.name, active: true })
      .eq("id", data.user.id);
    if (roleError) throw new Error(`Falha ao definir o papel de ${account.email}: ${roleError.message}`);

    console.log(`  ${account.role.padEnd(8)} ${account.email.padEnd(22)} ${password}`);
  }
  console.log("\nEntre em http://localhost:3000/admin/login (não em 127.0.0.1).");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
