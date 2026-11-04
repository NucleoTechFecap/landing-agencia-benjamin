/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : http-policy.ts
 Descrição    : Regras de transporte: atributos do cookie de sessão e Content-Security-Policy.

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

export interface ContentSecurityPolicyOptions extends SiteOrigin {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  /** `next dev`: o React usa eval para reconstruir pilhas de erro do servidor. */
  development: boolean;
  /** Deploy de Preview da Vercel, que injeta a barra de ferramentas e os comentários. */
  vercelPreview: boolean;
}

/** Origens que a Vercel pede para a barra de ferramentas (documentação "Managing the Vercel Toolbar"). */
const VERCEL_TOOLBAR = {
  script: ["https://vercel.live"],
  style: ["https://vercel.live"],
  img: ["https://vercel.live", "https://vercel.com", "blob:"],
  font: ["https://vercel.live", "https://assets.vercel.com"],
  connect: ["https://vercel.live", "wss://ws-us3.pusher.com"],
  frame: ["https://vercel.live"],
};

/**
 * CSP sem nonce, a opção que a documentação do Next indica para quem usa Partial Prerendering: o
 * shell estático não tem como receber um nonce novo a cada requisição. `script-src` precisa de
 * `'unsafe-inline'` porque o Next envia o payload do React em scripts inline, que variam com os
 * trechos dinâmicos e por isso também não dá para listar por hash; acrescentar um hash ou nonce
 * desligaria o `'unsafe-inline'` e quebraria a hidratação. O que a política ainda garante está em
 * docs/seguranca/protecao-de-rotas.md.
 */
export function buildContentSecurityPolicy(options: ContentSecurityPolicyOptions): string {
  const toolbar = options.vercelPreview ? VERCEL_TOOLBAR : undefined;
  const supabase = options.NEXT_PUBLIC_SUPABASE_URL ? [new URL(options.NEXT_PUBLIC_SUPABASE_URL).origin] : [];
  const directives: [string, ...string[]][] = [
    ["default-src", "'self'"],
    [
      "script-src",
      "'self'",
      "'unsafe-inline'",
      ...(options.development ? ["'unsafe-eval'"] : []),
      ...(toolbar?.script ?? []),
    ],
    ["style-src", "'self'", "'unsafe-inline'", ...(toolbar?.style ?? [])],
    // O Supabase entra direto só no painel (miniaturas da biblioteca); o site passa por /_next/image.
    ["img-src", "'self'", "data:", ...supabase, ...(toolbar?.img ?? [])],
    ["font-src", "'self'", ...(toolbar?.font ?? [])],
    // O envio de mídia vai do navegador direto ao Storage (ADR-0005).
    ["connect-src", "'self'", ...supabase, ...(toolbar?.connect ?? [])],
    ["frame-src", ...(toolbar?.frame ?? ["'none'"])],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
    ["form-action", "'self'"],
    ["frame-ancestors", "'none'"],
    // Num endereço http o navegador trocaria os recursos por https, e o site não abriria.
    ...(isServedOverHttps(options) && !options.development ? [["upgrade-insecure-requests"] as [string]] : []),
  ];
  return directives.map((directive) => directive.join(" ")).join("; ");
}
