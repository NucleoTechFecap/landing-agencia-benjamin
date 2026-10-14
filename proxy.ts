/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Config
 Arquivo      : proxy.ts
 Descrição    : Renova a sessão do Supabase nos acessos ao painel administrativo.

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
 13/10/2026 Vinícius Nishimura Reis  Barreira de autenticação para rotas não públicas do painel (ADM-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { LOGIN_PATH, isPublicAdminPath } from "@/lib/domain/auth/redirect";

/**
 * Primeira barreira do painel (ADM-03) e renovação de sessão (ADM-02):
 * - renova os tokens do Supabase (cookies httpOnly) a cada acesso a /admin;
 * - sem sessão, redireciona para o login preservando o destino.
 * A autorização por papel acontece no servidor (requirePermission) e no banco (RLS).
 * Roda apenas em /admin: o site público não lê sessão e continua cacheável.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { pathname, search } = request.nextUrl;
  const isPublic = isPublicAdminPath(pathname);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Sem Supabase configurado não há como autenticar: nega por padrão.
  if (!url || !anonKey) return isPublic ? response : redirectToLogin(request, pathname + search);

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() valida o token no servidor de Auth e dispara a renovação quando necessário.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic) return redirectToLogin(request, pathname + search);
  return response;
}

function redirectToLogin(request: NextRequest, next: string) {
  const loginUrl = new URL(LOGIN_PATH, request.url);
  if (next !== "/admin") loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};
