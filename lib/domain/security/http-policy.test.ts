/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : http-policy.test.ts
 Descrição    : Testes do cookie de sessão por ambiente.

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
import { isServedOverHttps, sessionCookieOptions } from "./http-policy";

const HTTPS_SITE = "https://www.exemplo.com.br";

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
