/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : server.test.ts
 Descrição    : Atributos que o cliente de sessão grava nos cookies, passando pelo @supabase/ssr real.

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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionClient } from "./server";

const mocks = vi.hoisted(() => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "https://projeto.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "chave-anonima-so-para-o-teste",
    NEXT_PUBLIC_SITE_URL: "https://www.exemplo.com.br",
    NEXT_PUBLIC_SITE_ENV: "production",
  },
  written: [] as { name: string; value: string; options: Record<string, unknown> }[],
  stored: [] as { name: string; value: string }[],
}));

vi.mock("@/lib/config/public-env", () => ({ publicEnv: mocks.env, isSupabaseConfigured: true }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    getAll: () => mocks.stored,
    set: (name: string, value: string, options: Record<string, unknown>) => {
      mocks.written.push({ name, value, options });
      mocks.stored = [...mocks.stored.filter((cookie) => cookie.name !== name), { name, value }];
    },
  }),
}));

const session = {
  access_token: "cabecalho.corpo.assinatura",
  refresh_token: "token-de-renovacao",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: "u1", aud: "authenticated", role: "authenticated", app_metadata: {}, user_metadata: {}, created_at: "" },
};

describe("createSessionClient: cookies da sessão (SEG-06)", () => {
  beforeEach(() => {
    mocks.written.length = 0;
    mocks.stored = [];
    mocks.env.NEXT_PUBLIC_SITE_URL = "https://www.exemplo.com.br";
    mocks.env.NEXT_PUBLIC_SITE_ENV = "production";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json(session)),
    );
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const signIn = async () => {
    const client = await createSessionClient();
    const { error } = await client.auth.signInWithPassword({ email: "pessoa@exemplo.com.br", password: "x" });
    expect(error).toBeNull();
    expect(mocks.written.length).toBeGreaterThan(0);
    return client;
  };

  it("login em produção: HttpOnly, SameSite=Lax e Secure", async () => {
    await signIn();
    for (const { options } of mocks.written) {
      expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", secure: true, path: "/" });
    }
  });

  it("o next start do E2E em http://localhost não recebe Secure, mesmo com NODE_ENV=production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3100";
    mocks.env.NEXT_PUBLIC_SITE_ENV = "development";
    await signIn();
    for (const { options } of mocks.written) {
      expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", secure: false });
    }
  });

  it("a duração é a padrão da biblioteca, de 400 dias (docs/seguranca/autenticacao.md)", async () => {
    await signIn();
    for (const { options } of mocks.written) expect(options.maxAge).toBe(400 * 24 * 60 * 60);
  });

  it("logout apaga o cookie com os mesmos atributos", async () => {
    const client = await signIn();
    mocks.written.length = 0;
    await client.auth.signOut();
    expect(mocks.written.length).toBeGreaterThan(0);
    for (const { value, options } of mocks.written) {
      expect(value).toBe("");
      expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", secure: true, maxAge: 0 });
    }
  });

  it("verificador do PKCE (recuperação de senha) também fica fora do alcance do navegador", async () => {
    const client = await createSessionClient();
    await client.auth.resetPasswordForEmail("pessoa@exemplo.com.br");
    const verifier = mocks.written.filter(({ name }) => name.includes("code-verifier"));
    expect(verifier.length).toBeGreaterThan(0);
    for (const { options } of verifier) expect(options).toMatchObject({ httpOnly: true, sameSite: "lax" });
  });
});
