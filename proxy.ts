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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
 13/10/2026 Vinícius Nishimura Reis  Barreira de autenticação para rotas não públicas do painel (ADM-03).
 13/10/2026 Vinícius Nishimura Reis  404 real para serviços e cases inexistentes (estrutura da landing).
 29/10/2026 Vinicius Binda             301 de endereço antigo ou com maiúsculas para o atual (DB-08).
 04/11/2026 Vinícius Nishimura Reis  Cookies de sessão com HttpOnly, SameSite e Secure (SEG-06).
 04/11/2026 Vinícius Nishimura Reis  301 de endereço antigo com cache curto (TECH-13, #369).
 04/11/2026 Vinícius Nishimura Reis  404 real e endereço único nas páginas livres (editor do site).
 04/11/2026 Vinícius Nishimura Reis  Endereço que só começa com admin não é o painel.
──────────────────────────────────────────────────────────────────────────────
*/

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { publicEnv } from "@/lib/config/public-env";
import { LOGIN_PATH, isPublicAdminPath } from "@/lib/domain/auth/redirect";
import { REDIRECT_CACHE_CONTROL } from "@/lib/domain/content/slug";
import { sessionCookieOptions } from "@/lib/domain/security/http-policy";
import { resolveDetailSlug, resolvePageSlug, type DetailRoute } from "@/lib/server/content/published-slugs";

/**
 * Primeira barreira do painel (ADM-03) e renovação de sessão (ADM-02):
 * - renova os tokens do Supabase (cookies httpOnly) a cada acesso a /admin;
 * - sem sessão, redireciona para o login preservando o destino.
 * A autorização por papel acontece no servidor (requirePermission) e no banco (RLS).
 * Roda apenas em /admin: o site público não lê sessão e continua cacheável.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  // Comparar o segmento inteiro: /administracao é uma página livre, não o painel.
  if (pathname !== "/admin" && !pathname.startsWith("/admin/")) return guardDetailRoute(request, pathname);

  let response = NextResponse.next({ request });
  const isPublic = isPublicAdminPath(pathname);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Sem Supabase configurado não há como autenticar: nega por padrão.
  if (!url || !anonKey) return isPublic ? response : redirectToLogin(request, pathname + search);

  const supabase = createServerClient(url, anonKey, {
    cookieOptions: sessionCookieOptions(publicEnv),
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

/**
 * Detalhes de serviço/case: slug inexistente, rascunho ou arquivado responde 404 real
 * (RF-18); endereço antigo ou com maiúsculas responde 301 para o atual (DB-08), mantendo a
 * query string. Feito aqui porque, com Partial Prerendering, `notFound()` dentro da página
 * só consegue status 200 + noindex (o shell já começou a ser enviado).
 */
async function guardDetailRoute(request: NextRequest, pathname: string) {
  const [, first, slug] = pathname.split("/") as [string, DetailRoute | string, string | undefined];
  // Um segmento só é uma página livre; dois, o detalhe de serviço ou case.
  const resolution = slug ? await resolveDetailSlug(first as DetailRoute, slug) : await resolvePageSlug(first);
  if (resolution.status === "missing") {
    // Dois segmentos de propósito: um só cairia em app/(site)/[slug], que não consegue responder 404.
    return NextResponse.rewrite(new URL("/_conteudo/inexistente", request.url), { status: 404 });
  }
  if (resolution.status === "moved") {
    const target = slug ? `/${first}/${resolution.slug}` : `/${resolution.slug}`;
    const moved = NextResponse.redirect(new URL(`${target}${request.nextUrl.search}`, request.url), 301);
    moved.headers.set("Cache-Control", REDIRECT_CACHE_CONTROL);
    return moved;
  }
  return NextResponse.next();
}

function redirectToLogin(request: NextRequest, next: string) {
  const loginUrl = new URL(LOGIN_PATH, request.url);
  if (next !== "/admin") loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/servicos/:slug",
    "/cases/:slug",
    // Página livre: um segmento só, fora das rotas fixas e dos arquivos da raiz. Com ponto também: sem isso,
    // /README.md ou /.env cairiam em app/(site)/[slug], que não consegue responder 404 de verdade.
    "/:pagina((?!_next$|admin$|api$|sobre$|areas$|servicos$|cases$|contato$|feedback$|privacidade$|opengraph-image|twitter-image|favicon\\.ico$|icon\\.png$|apple-icon\\.png$|robots\\.txt$|sitemap\\.xml$|llms\\.txt$|llms-full\\.txt$|manifest\\.webmanifest$)[^/]+)",
  ],
};
