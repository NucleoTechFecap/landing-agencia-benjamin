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
 04/11/2026 Vinícius Nishimura Reis  301 de endereço antigo com cache curto (TECH-13, #369).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
 04/11/2026 Vinícius Nishimura Reis  Endereço que só começa com admin não é o painel.
──────────────────────────────────────────────────────────────────────────────
*/

import { readdirSync } from "node:fs";
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { config, proxy } from "./proxy";

const SUPABASE = "https://projeto.supabase.co";
const COOKIE = "sb-projeto-auth-token";

vi.mock("@/lib/server/content/published-slugs", () => ({ resolveDetailSlug: vi.fn(), resolvePageSlug: vi.fn() }));
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

describe("proxy: endereço antigo de serviço e case (DB-08)", () => {
  it("301 mantém a query, e o navegador revalida: o slug pode voltar a um valor já usado", async () => {
    const { resolveDetailSlug } = await import("@/lib/server/content/published-slugs");
    vi.mocked(resolveDetailSlug).mockResolvedValue({ status: "moved", slug: "nome-novo" });
    const response = await proxy(requestTo("/cases/nome-antigo?origem=x"));
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://www.exemplo.com.br/cases/nome-novo?origem=x");
    expect(response.headers.get("cache-control")).toBe("public, max-age=0, s-maxage=60");
  });
});

describe("proxy: endereço que só começa com admin (editor do site)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("/administracao publicada abre como qualquer página livre, sem ir ao login", async () => {
    const { resolvePageSlug } = await import("@/lib/server/content/published-slugs");
    vi.mocked(resolvePageSlug).mockResolvedValue({ status: "current" });
    const response = await proxy(requestTo("/administracao"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("/admins inexistente responde 404, sem consultar o serviço de login", async () => {
    const { resolvePageSlug } = await import("@/lib/server/content/published-slugs");
    vi.mocked(resolvePageSlug).mockResolvedValue({ status: "missing" });
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "chave-anonima-so-para-o-teste");
    const login = vi.fn();
    vi.stubGlobal("fetch", login);
    const response = await proxy(requestTo("/admins"));
    expect(response.status).toBe(404);
    expect(login).not.toHaveBeenCalled();
  });

  it.each(["/admin", "/admin/midia"])("%s continua atrás do login", async (path) => {
    const response = await proxy(requestTo(path));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/admin/login");
  });
});

describe("endereços de um segmento (editor do site)", () => {
  const pattern = config.matcher.find((entry) => entry.startsWith("/:pagina"))!;
  const caught = new RegExp(`^/${pattern.slice("/:pagina".length)}$`);

  it.each(["/pagina-nova", "/README.md", "/.env", "/backup.sql", "/next.config.ts"])(
    "%s passa pela checagem",
    (path) => {
      expect(caught.test(path)).toBe(true);
    },
  );

  it.each(["/sobre", "/contato", "/admin", "/api", "/robots.txt", "/sitemap.xml", "/llms.txt", "/llms-full.txt"])(
    "%s não passa",
    (path) => {
      expect(caught.test(path)).toBe(false);
    },
  );

  it("nenhum arquivo da raiz de public/ passa: seria respondido com 404", () => {
    const files = readdirSync("public", { withFileTypes: true }).filter((entry) => entry.isFile());
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) expect(caught.test(`/${file.name}`), file.name).toBe(false);
  });
});
