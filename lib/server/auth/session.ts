/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : session.ts
 Descrição    : Leitura da sessão validada e do papel do usuário no servidor.

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

import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/config/public-env";
import { isRole, type Role } from "@/lib/domain/auth/rbac";
import { logger } from "../logger";
import { createSessionClient } from "../supabase/server";

/** Usuário autenticado exposto à aplicação (sem tokens nem metadados sensíveis). */
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Lê a sessão validando o token no servidor de Auth (`getUser`, não `getSession`) e o
 * papel na tabela `profiles`. O papel NUNCA vem do cliente (TECH-03, N11).
 * Memoizado por requisição com `cache` do React.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createSessionClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    logger.error("auth.profile.read_failed", { userId: user.id, error: profileError });
    return null;
  }
  // Conta desativada ou sem perfil é tratada como sem acesso.
  const role: Role = profile?.active !== false && isRole(profile?.role) ? profile.role : "pending";
  return {
    id: user.id,
    email: user.email ?? "",
    name: profile?.full_name || user.email?.split("@")[0] || "Usuário",
    role,
  };
});
