/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Config
 Arquivo      : proxy.test.ts
 Descrição    : Renovação da sessão no proxy: atributos do cookie e sessões abertas antes da mudança.

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

import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { proxy } from "./proxy";

const SUPABASE = "https://projeto.supabase.co";
const COOKIE = "sb-projeto-auth-token";

vi.mock("@/lib/server/content/published-slugs", () => ({ resolveDetailSlug: vi.fn() }));
vi.mock("@/lib/config/public-env", () => ({
  publicEnv: { NEXT_PUBLIC_SITE_URL: "https://www.exemplo.com.br", NEXT_PUBLIC_SITE_ENV: "production" },
}));

const user = { id: "u1", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {} };
const inSeconds = (seconds: number) => Math.floor(Date.now() / 1000) + seconds;

const session = (expiresAt: number, accessToken = "cabecalho.corpo.assinatura") => ({
  access_token: accessToken,
  refresh_token: "token-de-renovacao",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: expiresAt,
  user,
});

/** O mesmo formato que o @supabase/ssr grava desde antes do SEG-06: é o que os navegadores já têm. */
const openSession = (expiresAt: number) =>
  `${COOKIE}=base64-${Buffer.from(JSON.stringify(session(expiresAt))).toString("base64url")}`;

const requestTo = (path: string, cookie?: string) =>
  new NextRequest(new URL(path, "https://www.exemplo.com.br"), { headers: cookie ? { cookie } : {} });

describe("proxy: sessão do painel (SEG-06)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "chave-anonima-so-para-o-teste");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).includes("/auth/v1/token")
          ? Response.json(session(inSeconds(3600), "novo.token.assinatura"))
          : Response.json(user),
      ),
    );
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sessão vencida: renova e devolve o cookie com HttpOnly, SameSite=Lax e Secure", async () => {
    const response = await proxy(requestTo("/admin/midia", openSession(inSeconds(-60))));
    const cookies = response.headers.getSetCookie();
    expect(response.status).toBe(200);
    expect(cookies.length).toBeGreaterThan(0);
    for (const cookie of cookies) {
      expect(cookie).toMatch(/; HttpOnly/i);
      expect(cookie).toMatch(/; SameSite=lax/i);
      expect(cookie).toMatch(/; Secure/i);
      expect(cookie).toMatch(/; Path=\//i);
    }
  });

  it("sessão aberta antes da mudança e ainda válida: entra, sem reescrever o cookie", async () => {
    const response = await proxy(requestTo("/admin/midia", openSession(inSeconds(3000))));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("sem sessão: vai para o login, sem cookie nenhum", async () => {
    const response = await proxy(requestTo("/admin/midia"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/login?next=%2Fadmin%2Fmidia");
    expect(response.headers.getSetCookie()).toEqual([]);
  });
});
