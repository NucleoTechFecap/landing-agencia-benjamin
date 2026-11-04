/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : http-policy.test.ts
 Descrição    : Testes do cookie de sessão e da Content-Security-Policy por ambiente.

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

import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, isServedOverHttps, sessionCookieOptions } from "./http-policy";

const HTTPS_SITE = "https://www.exemplo.com.br";
const SUPABASE = "https://projeto.supabase.co";

describe("isServedOverHttps (SEG-06)", () => {
  it.each([
    ["produção", HTTPS_SITE, "production", true],
    ["homologação", HTTPS_SITE, "homologation", true],
    ["produção com origem errada em http continua Secure", "http://www.exemplo.com.br", "production", true],
    ["homologação com origem errada em http continua Secure", "http://www.exemplo.com.br", "homologation", true],
    ["Preview sem a variável: não dá para saber, então https", undefined, "preview", true],
    ["desenvolvimento e E2E em localhost", "http://localhost:3100", "development", false],
    ["sem ambiente declarado, em localhost", "http://localhost:3100", undefined, false],
    ["teste pela rede local, em http", "http://192.168.0.10:3000", "development", false],
    ["sem nada declarado: na dúvida, https", undefined, undefined, true],
  ])("%s", (_case, url, env, expected) => {
    expect(isServedOverHttps({ NEXT_PUBLIC_SITE_URL: url, NEXT_PUBLIC_SITE_ENV: env })).toBe(expected);
  });
});

describe("sessionCookieOptions (SEG-06)", () => {
  it("nunca deixa a sessão legível no navegador nem enviada de outro site", () => {
    expect(sessionCookieOptions({ NEXT_PUBLIC_SITE_URL: "http://localhost:3100" })).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    });
    expect(sessionCookieOptions({ NEXT_PUBLIC_SITE_URL: HTTPS_SITE, NEXT_PUBLIC_SITE_ENV: "production" })).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
    });
  });
});

describe("buildContentSecurityPolicy (SEG-06)", () => {
  const production = {
    NEXT_PUBLIC_SITE_URL: HTTPS_SITE,
    NEXT_PUBLIC_SITE_ENV: "production",
    NEXT_PUBLIC_SUPABASE_URL: SUPABASE,
    development: false,
    vercelPreview: false,
  };
  const directives = (policy: string) =>
    new Map(
      policy.split("; ").map((directive) => {
        const [name, ...values] = directive.split(" ");
        return [name, values] as const;
      }),
    );

  it("fecha o que não precisa de exceção", () => {
    const policy = directives(buildContentSecurityPolicy(production));
    expect(policy.get("default-src")).toEqual(["'self'"]);
    expect(policy.get("object-src")).toEqual(["'none'"]);
    expect(policy.get("base-uri")).toEqual(["'self'"]);
    expect(policy.get("form-action")).toEqual(["'self'"]);
    expect(policy.get("frame-ancestors")).toEqual(["'none'"]);
    expect(policy.get("frame-src")).toEqual(["'none'"]);
    expect(policy.get("font-src")).toEqual(["'self'"]);
    expect(policy.has("upgrade-insecure-requests")).toBe(true);
  });

  it("produção: scripts só do próprio site, sem eval e sem origem externa", () => {
    const script = directives(buildContentSecurityPolicy(production)).get("script-src");
    expect(script).toEqual(["'self'", "'unsafe-inline'"]);
  });

  it("libera o Supabase só para imagem e conexão, pela origem", () => {
    const policy = directives(
      buildContentSecurityPolicy({ ...production, NEXT_PUBLIC_SUPABASE_URL: `${SUPABASE}/caminho/` }),
    );
    expect(policy.get("img-src")).toEqual(["'self'", "data:", SUPABASE]);
    expect(policy.get("connect-src")).toEqual(["'self'", SUPABASE]);
    expect(policy.get("script-src")).not.toContain(SUPABASE);
  });

  it("sem Supabase configurado, nenhuma origem externa", () => {
    const text = buildContentSecurityPolicy({ ...production, NEXT_PUBLIC_SUPABASE_URL: undefined });
    expect(text).not.toContain("http");
  });

  it("nada da barra da Vercel fora do Preview; no Preview, o que a Vercel pede", () => {
    expect(buildContentSecurityPolicy(production)).not.toMatch(/vercel|pusher/);
    const policy = directives(buildContentSecurityPolicy({ ...production, vercelPreview: true }));
    expect(policy.get("script-src")).toContain("https://vercel.live");
    expect(policy.get("connect-src")).toEqual(
      expect.arrayContaining(["https://vercel.live", "wss://ws-us3.pusher.com"]),
    );
    expect(policy.get("img-src")).toEqual(
      expect.arrayContaining(["https://vercel.live", "https://vercel.com", "blob:"]),
    );
    expect(policy.get("style-src")).toContain("https://vercel.live");
    expect(policy.get("font-src")).toEqual(
      expect.arrayContaining(["https://vercel.live", "https://assets.vercel.com"]),
    );
    expect(policy.get("frame-src")).toEqual(["https://vercel.live"]);
  });

  it("só o next dev recebe unsafe-eval", () => {
    const script = directives(buildContentSecurityPolicy({ ...production, development: true })).get("script-src");
    expect(script).toContain("'unsafe-eval'");
  });

  it("em http não pede upgrade: o site precisa abrir em localhost", () => {
    const policy = directives(
      buildContentSecurityPolicy({
        ...production,
        NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
        NEXT_PUBLIC_SITE_ENV: "development",
      }),
    );
    expect(policy.has("upgrade-insecure-requests")).toBe(false);
  });

  it("next dev sem origem declarada também não pede upgrade", () => {
    const policy = directives(
      buildContentSecurityPolicy({
        ...production,
        NEXT_PUBLIC_SITE_URL: undefined,
        NEXT_PUBLIC_SITE_ENV: "development",
        development: true,
      }),
    );
    expect(policy.has("upgrade-insecure-requests")).toBe(false);
  });
});
