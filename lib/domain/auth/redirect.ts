/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : redirect.ts
 Descrição    : Redirecionamento seguro pós-login, política de senha e estado dos formulários.

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
 13/10/2026 Vinícius Nishimura Reis  Rotas públicas do painel (ADM-03).
──────────────────────────────────────────────────────────────────────────────
*/

/** Destino padrão após login. */
export const ADMIN_HOME = "/admin";
export const LOGIN_PATH = "/admin/login";

/** Rotas do painel acessíveis sem sessão (todas as demais exigem login — ADM-03). */
export const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/recuperar-senha", "/admin/auth/callback"];

export function isPublicAdminPath(pathname: string): boolean {
  return PUBLIC_ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Valida o parâmetro `next` do login para evitar *open redirect*: só caminhos internos
 * do painel são aceitos; qualquer outro valor volta para o início do painel.
 */
export function safeAdminRedirect(next: unknown): string {
  if (typeof next !== "string" || next.length > 200) return ADMIN_HOME;
  if (!next.startsWith("/admin") || next.startsWith("//") || next.includes("\\")) return ADMIN_HOME;
  if (next.startsWith(LOGIN_PATH)) return ADMIN_HOME;
  try {
    const url = new URL(next, "https://local.invalid");
    return url.origin === "https://local.invalid" && url.pathname.startsWith("/admin") ? `${url.pathname}${url.search}` : ADMIN_HOME;
  } catch {
    return ADMIN_HOME;
  }
}

/** Política mínima de senha (ADM-01 §4): 12+ caracteres, letras e números. */
export function passwordProblems(password: string): string[] {
  const problems: string[] = [];
  if (password.length < 12) problems.push("Use pelo menos 12 caracteres.");
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) problems.push("Combine letras e números.");
  if (password.length > 128) problems.push("Use no máximo 128 caracteres.");
  return problems;
}

/** Estado dos formulários de autenticação do painel (login, recuperação, nova senha). */
export interface AuthFormState {
  error?: string;
  message?: string;
  /** Devolvido para não obrigar a redigitar após erro (nunca a senha). */
  email?: string;
}
