/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : http-policy.ts
 Descrição    : Regras de transporte: atributos do cookie de sessão.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (SEG-06).
──────────────────────────────────────────────────────────────────────────────
*/

/** As variáveis públicas que dizem como o site é servido. */
export interface SiteOrigin {
  NEXT_PUBLIC_SITE_URL?: string;
  NEXT_PUBLIC_SITE_ENV?: string;
}

/**
 * O site é servido por https? Na dúvida, sim: só uma origem declarada `http://` fora de homologação
 * e produção conta como http (desenvolvimento e E2E, em que `next start` roda com
 * NODE_ENV=production em http://localhost). Por isso a resposta não vem de NODE_ENV.
 */
export function isServedOverHttps({ NEXT_PUBLIC_SITE_URL: url, NEXT_PUBLIC_SITE_ENV: env }: SiteOrigin): boolean {
  if (env === "production" || env === "homologation") return true;
  return !url?.startsWith("http://");
}

/**
 * Atributos dos cookies do Supabase, usados por todo cliente com sessão. O padrão de `@supabase/ssr`
 * é `httpOnly: false` e sem `secure`, porque ele prevê um cliente no navegador; aqui a sessão só é
 * lida no servidor. `maxAge` fica de fora de propósito: a biblioteca ignora o valor passado aqui
 * (ver docs/seguranca/autenticacao.md).
 */
export function sessionCookieOptions(site: SiteOrigin) {
  return { httpOnly: true, sameSite: "lax", secure: isServedOverHttps(site) } as const;
}
