#!/usr/bin/env node
/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : provision-admin.mjs
 Descrição    : Convida contas do painel por e-mail e define o papel inicial (sem compartilhar senhas).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (INT-08).
──────────────────────────────────────────────────────────────────────────────
*/

/**
 * Provisiona contas do painel por CONVITE (INT-08): ninguém define ou recebe a senha de
 * outra pessoa — o convidado cria a própria senha pelo link do e-mail.
 *
 * Uso (rodar com as variáveis do ambiente alvo, nunca as de produção na máquina pessoal
 * sem necessidade):
 *   node --env-file=.env.hml scripts/provision-admin.mjs --email pessoa@exemplo.com \
 *        --name "Nome Completo" --role admin --confirm hml
 *   ... --dry-run   (só valida e mostra o que faria)
 */
import { pathToFileURL } from "node:url";

export const ALLOWED_ROLES = ["super_admin", "admin", "editor", "viewer", "pending"];
export const ENVIRONMENTS = { development: "dev", preview: "preview", homologation: "hml", production: "prd" };

/** Lê e valida os argumentos. Lança erro com mensagem amigável. */
export function parseArgs(argv, env) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (key === "dry-run") args.dryRun = true;
    else if (next && !next.startsWith("--")) {
      args[key] = next;
      index += 1;
    }
  }

  const email = String(args.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe --email válido.");
  const name = String(args.name ?? "").trim();
  if (name.length < 2) throw new Error("Informe --name com o nome completo.");
  const role = String(args.role ?? "pending");
  if (!ALLOWED_ROLES.includes(role)) throw new Error(`--role deve ser um de: ${ALLOWED_ROLES.join(", ")}.`);

  const environment = env.NEXT_PUBLIC_SITE_ENV ?? "development";
  const shortName = ENVIRONMENTS[environment];
  if (!shortName) throw new Error(`NEXT_PUBLIC_SITE_ENV desconhecido: ${environment}.`);
  if (!args.dryRun && args.confirm !== shortName) {
    throw new Error(`Confirme o ambiente com --confirm ${shortName} (ambiente atual: ${environment}).`);
  }
  for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SITE_URL"]) {
    if (!env[key]) throw new Error(`Variável ${key} ausente.`);
  }

  return {
    email,
    name,
    role,
    dryRun: Boolean(args.dryRun),
    environment,
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "")}/admin/auth/callback?next=/admin/nova-senha`,
  };
}

async function run() {
  const options = parseArgs(process.argv.slice(2), process.env);
  console.log(`Ambiente: ${options.environment} · ${options.email} · papel: ${options.role}`);
  if (options.dryRun) {
    console.log(`[dry-run] Enviaria convite com retorno para ${options.redirectTo}`);
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(options.email, {
    data: { full_name: options.name },
    redirectTo: options.redirectTo,
  });
  if (error) throw new Error(`Falha ao convidar: ${error.message}`);
  const userId = data.user.id;

  // O trigger handle_new_user cria o perfil como "pending"; aqui aplicamos o papel inicial.
  const { error: roleError } = await supabase.from("profiles").update({ role: options.role, full_name: options.name }).eq("id", userId);
  if (roleError) throw new Error(`Convite enviado, mas falhou ao definir o papel: ${roleError.message}`);

  // Operação de sistema (sem sessão): registrada diretamente na trilha de auditoria.
  const { error: auditError } = await supabase.from("audit_log").insert({
    actor_id: null,
    actor_role: null,
    event: "user.invited",
    resource_type: "user",
    resource_id: userId,
    metadata: { toRole: options.role, reason: "provision-admin" },
  });
  if (auditError) console.warn(`Atenção: auditoria não registrada (${auditError.message}).`);

  console.log(`Convite enviado. A pessoa define a própria senha pelo e-mail. Usuário: ${userId}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
