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
 Modificado em: 12/11/2026
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
 12/11/2026 Codex                     404 para artigos não publicados (FUT-10).
 12/11/2026 Codex                     Amplia gestão editorial e segurança do painel.
──────────────────────────────────────────────────────────────────────────────
*/

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { publicEnv } from "@/lib/config/public-env";
import { LOGIN_PATH, isPublicAdminPath } from "@/lib/domain/auth/redirect";
import { isValidSlug, REDIRECT_CACHE_CONTROL } from "@/lib/domain/content/slug";
import { sessionCookieOptions } from "@/lib/domain/security/http-policy";
import { resolveDetailSlug, type DetailRoute } from "@/lib/server/content/published-slugs";
import { getContentSource } from "@/lib/server/content/sources";
import { createPublicClient } from "@/lib/server/supabase/server";
import { isPubliclyVisible } from "@/lib/domain/content/visibility";

/**
 * Primeira barreira do painel (ADM-03) e renovação de sessão (ADM-02):
 * - renova os tokens do Supabase (cookies httpOnly) a cada acesso a /admin;
 * - sem sessão, redireciona para o login preservando o destino.
 * A autorização por papel acontece no servidor (requirePermission) e no banco (RLS).
 * Roda apenas em /admin: o site público não lê sessão e continua cacheável.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/paginas/")) return guardCustomPageRoute(request, pathname);
  if (pathname.startsWith("/blog/")) return guardBlogRoute(request, pathname);
  if (!pathname.startsWith("/admin")) return guardDetailRoute(request, pathname);

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

async function guardCustomPageRoute(request: NextRequest, pathname: string) {
  const slug = pathname.split("/")[2];
  if (!isValidSlug(slug)) return NextResponse.rewrite(new URL("/_conteudo-inexistente", request.url), { status: 404 });
  try {
    const page = await getContentSource().page(slug);
    if (!page?.isCustom || !isPubliclyVisible(page)) {
      return NextResponse.rewrite(new URL("/_conteudo-inexistente", request.url), { status: 404 });
    }
  } catch {
    // Falhas de rede não transformam temporariamente uma página válida em 404.
    return NextResponse.next();
  }
  return NextResponse.next();
}

async function guardBlogRoute(request: NextRequest, pathname: string) {
  const slug = pathname.split("/")[2];
  const lower = slug.toLowerCase();
  if (!isValidSlug(lower) || getContentSource().name === "local") {
    return NextResponse.rewrite(new URL("/_conteudo-inexistente", request.url), { status: 404 });
  }
  const { data, error } = await createPublicClient()
    .from("blog_articles")
    .select("slug")
    .eq("slug", lower)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error) return NextResponse.next();
  if (!data) return NextResponse.rewrite(new URL("/_conteudo-inexistente", request.url), { status: 404 });
  if (slug !== lower) {
    const redirect = NextResponse.redirect(new URL(`/blog/${lower}${request.nextUrl.search}`, request.url), 301);
    redirect.headers.set("Cache-Control", REDIRECT_CACHE_CONTROL);
    return redirect;
  }
  return NextResponse.next();
}

/**
 * Detalhes de serviço/case: slug inexistente, rascunho ou arquivado responde 404 real
 * (RF-18); endereço antigo ou com maiúsculas responde 301 para o atual (DB-08), mantendo a
 * query string. Feito aqui porque, com Partial Prerendering, `notFound()` dentro da página
 * só consegue status 200 + noindex (o shell já começou a ser enviado).
 */
async function guardDetailRoute(request: NextRequest, pathname: string) {
  const [, route, slug] = pathname.split("/") as [string, DetailRoute, string];
  if (!slug) return NextResponse.next();
  const resolution = await resolveDetailSlug(route, slug);
  if (resolution.status === "missing") {
    return NextResponse.rewrite(new URL("/_conteudo-inexistente", request.url), { status: 404 });
  }
  if (resolution.status === "moved") {
    const moved = NextResponse.redirect(
      new URL(`/${route}/${resolution.slug}${request.nextUrl.search}`, request.url),
      301,
    );
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
  matcher: ["/admin/:path*", "/servicos/:slug", "/cases/:slug", "/blog/:slug", "/paginas/:slug"],
};
