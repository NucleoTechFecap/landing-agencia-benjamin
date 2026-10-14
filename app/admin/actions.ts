/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Server Actions de login, logout, recuperação e definição de senha.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
──────────────────────────────────────────────────────────────────────────────
*/

"use server";

import { redirect } from "next/navigation";
import { siteUrl } from "@/lib/config/public-env";
import { LOGIN_PATH, passwordProblems, safeAdminRedirect, type AuthFormState } from "@/lib/domain/auth/redirect";
import { getSessionUser } from "@/lib/server/auth/session";
import { logger } from "@/lib/server/logger";
import { createSessionClient } from "@/lib/server/supabase/server";

const UNAVAILABLE = "Autenticação indisponível neste ambiente. Contate o NúcleoTech.";

/** Login com e-mail e senha. Mensagem genérica para não revelar quais e-mails existem. */
export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Informe e-mail e senha.", email };

  let supabase;
  try {
    supabase = await createSessionClient();
  } catch {
    return { error: UNAVAILABLE, email };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    logger.warn("auth.login.failed", { reason: error.code ?? "invalid_credentials" });
    return { error: "E-mail ou senha inválidos.", email };
  }

  const user = await getSessionUser();
  if (!user || user.role === "pending") {
    await supabase.auth.signOut();
    logger.warn("auth.login.denied", { userId: user?.id, reason: "pending_role" });
    return { error: "Sua conta ainda não tem acesso liberado ao painel. Fale com a coordenação.", email };
  }

  logger.info("auth.login.succeeded", { userId: user.id, role: user.role });
  redirect(safeAdminRedirect(formData.get("next")));
}

/** Encerra a sessão no Supabase e remove os cookies. */
export async function signOut(): Promise<void> {
  try {
    const supabase = await createSessionClient();
    const user = await getSessionUser();
    await supabase.auth.signOut();
    logger.info("auth.logout", { userId: user?.id });
  } catch (error) {
    logger.error("auth.logout.failed", { error });
  }
  redirect(`${LOGIN_PATH}?saiu=1`);
}

/** Envia link de redefinição. Sempre responde igual, exista ou não a conta. */
export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { error: "Informe um e-mail válido.", email };
  try {
    const supabase = await createSessionClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/admin/auth/callback?next=/admin/nova-senha`,
    });
    if (error) logger.warn("auth.password_reset.provider_error", { reason: error.code });
  } catch {
    return { error: UNAVAILABLE, email };
  }
  return { message: "Se o e-mail estiver cadastrado, você receberá um link para criar uma nova senha." };
}

/** Define nova senha (convite ou recuperação). Exige sessão criada pelo link do e-mail. */
export async function updatePassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const user = await getSessionUser();
  if (!user) return { error: "Link expirado. Solicite um novo e-mail de redefinição." };

  const problems = passwordProblems(password);
  if (problems.length) return { error: problems.join(" ") };
  if (password !== confirmation) return { error: "As senhas não conferem." };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    logger.warn("auth.password_update.failed", { userId: user.id, reason: error.code });
    return { error: "Não foi possível atualizar a senha. Tente uma senha diferente." };
  }
  logger.info("auth.password_update.succeeded", { userId: user.id });
  redirect("/admin");
}
