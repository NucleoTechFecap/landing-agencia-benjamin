/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : guards.ts
 Descrição    : Guardas de autorização para páginas, Server Actions e Route Handlers do painel.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-03).
 13/10/2026 Vinícius Nishimura Reis  Registro de acesso negado na auditoria (TECH-10).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { redirect, unstable_rethrow } from "next/navigation";
import { LOGIN_PATH } from "@/lib/domain/auth/redirect";
import { can, type Action, type Resource } from "@/lib/domain/auth/rbac";
import { recordAuditEvent } from "../audit";
import { AppError, newRequestId, toPublicError, type PublicError } from "../errors";
import { logger } from "../logger";
import { getSessionUser, type SessionUser } from "./session";

export const PENDING_ACCESS_PATH = "/admin/acesso-pendente";
export const FORBIDDEN_PATH = "/admin/sem-permissao";

/** Exige sessão válida. Para Server Actions e Route Handlers (lança 401). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AppError("UNAUTHENTICATED");
  return user;
}

/**
 * Exige permissão RBAC (TECH-03) — chamada no início de TODA Server Action e Route
 * Handler do painel, antes de ler ou gravar qualquer dado (ADM-03). Lança 401/403.
 */
export async function requirePermission(resource: Resource, action: Action): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, resource, action)) {
    logger.warn("auth.permission.denied", { userId: user.id, role: user.role, resource, action });
    await recordAuditEvent({ event: "access.denied", outcome: "denied", metadata: { resource, action } });
    throw new AppError("FORBIDDEN");
  }
  return user;
}

/**
 * Versão para páginas do painel: redireciona em vez de lançar erro.
 * Sem sessão → login (com retorno); conta pendente → aviso; sem permissão → 403 amigável.
 */
export async function requirePageAccess(resource: Resource, action: Action, currentPath: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`${LOGIN_PATH}?next=${encodeURIComponent(currentPath)}`);
  if (user.role === "pending") redirect(PENDING_ACCESS_PATH);
  if (!can(user.role, resource, action)) {
    logger.warn("auth.page.denied", { userId: user.id, role: user.role, resource, action, path: currentPath });
    redirect(FORBIDDEN_PATH);
  }
  return user;
}

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: PublicError };

/**
 * Envolve uma Server Action do painel: verifica a permissão, executa e converte erros no
 * envelope padronizado. Erros internos do Next (redirect/notFound) são relançados.
 */
export async function guardedAction<T>(
  resource: Resource,
  action: Action,
  run: (user: SessionUser) => Promise<T>,
): Promise<ActionResult<T>> {
  const requestId = newRequestId();
  try {
    const user = await requirePermission(resource, action);
    return { ok: true, data: await run(user) };
  } catch (error) {
    unstable_rethrow(error);
    return { ok: false, error: toPublicError(error, requestId, "admin.action.unexpected_error") };
  }
}
