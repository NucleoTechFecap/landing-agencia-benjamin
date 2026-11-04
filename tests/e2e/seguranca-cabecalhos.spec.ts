/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : seguranca-cabecalhos.spec.ts
 Descrição    : Cabeçalhos de segurança, CSP sem violações no navegador e atributos do cookie de sessão.

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
 04/11/2026 Vinícius Nishimura Reis  Logout termina em ?saiu=ok, depois da recarga (SEG-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type APIResponse, type BrowserContext, type Page } from "@playwright/test";

/** O bloco @cms precisa do app construído contra o Supabase local: rode `npm run test:e2e:cms`. */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

/** Mesma regra de `isServedOverHttps`: o build do E2E declara a origem http://localhost. */
const EXPECT_SECURE = !process.env.NEXT_PUBLIC_SITE_URL?.startsWith("http://");

/** PNG real de 1 × 1, para a miniatura da biblioteca decodificar de verdade. */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

const directivesOf = (response: APIResponse) =>
  new Map(
    (response.headers()["content-security-policy"] ?? "")
      .split(";")
      .map((directive) => directive.trim().split(/\s+/))
      .map(([name, ...values]) => [name, values] as const),
  );

/** Junta o que o navegador acusa: o evento da página e as mensagens do console. */
async function watchCsp(page: Page) {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (/content security policy/i.test(message.text())) violations.push(message.text());
  });
  await page.exposeFunction("__reportCspViolation", (text: string) => violations.push(text));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      const report = (window as unknown as { __reportCspViolation: (text: string) => void }).__reportCspViolation;
      report(`${event.effectiveDirective} ${event.blockedURI}`);
    });
  });
  return violations;
}

/** Percorre a página como um visitante: imagens preguiçosas e animações por rolagem carregam. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, window.innerHeight * 0.6);
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
  });
  await page.waitForLoadState("networkidle");
}

test.describe("Cabeçalhos de segurança (SEG-06)", () => {
  test.skip(({ isMobile }) => isMobile, "Os cabeçalhos não dependem do tamanho da tela.");

  for (const [path, status] of [
    ["/", 200],
    ["/admin/login", 200],
    ["/admin", 307],
    ["/servicos/nao-existe", 404],
  ] as const) {
    test(`${path} responde ${status} com todos os cabeçalhos`, async ({ request }) => {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status()).toBe(status);
      const headers = response.headers();
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["permissions-policy"]).toContain("camera=()");
      expect(headers["strict-transport-security"]).toContain("max-age=63072000");
      expect(headers["x-powered-by"]).toBeUndefined();

      const policy = directivesOf(response);
      expect(policy.get("default-src")).toEqual(["'self'"]);
      expect(policy.get("object-src")).toEqual(["'none'"]);
      expect(policy.get("base-uri")).toEqual(["'self'"]);
      expect(policy.get("form-action")).toEqual(["'self'"]);
      expect(policy.get("frame-ancestors")).toEqual(["'none'"]);
      // Limitação registrada: 'unsafe-inline' fica, porque Partial Prerendering não aceita nonce.
      expect(policy.get("script-src")).toEqual(["'self'", "'unsafe-inline'"]);
    });
  }

  test("o painel nunca é indexado", async ({ request }) => {
    const response = await request.get("/admin/login");
    expect(response.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  });
});

test.describe("CSP no navegador (SEG-06)", () => {
  for (const route of [
    "/",
    "/sobre",
    "/areas",
    "/servicos",
    "/servicos/copywriting",
    "/cases",
    "/cases/meridiano",
    "/contato",
    "/feedback",
    "/privacidade",
    "/rota-que-nao-existe",
    "/admin/login",
    "/admin/recuperar-senha",
  ]) {
    test(`${route} carrega sem violação`, async ({ page }) => {
      const violations = await watchCsp(page);
      await page.goto(route, { waitUntil: "networkidle" });
      await scrollThrough(page);
      expect(violations).toEqual([]);
    });
  }

  test("o script inline do motion, o GSAP e o JSON-LD continuam funcionando", async ({ page }) => {
    const violations = await watchCsp(page);
    await page.goto("/", { waitUntil: "networkidle" });
    expect(await page.evaluate(() => "__benjaMotion" in window)).toBe(true);
    await expect(page.locator("html")).toHaveClass(/\bmotion\b/);
    await expect(page.locator("[data-wave] canvas").first()).toBeAttached();
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.length).toBeGreaterThan(0);
    for (const block of jsonLd) expect(() => JSON.parse(block)).not.toThrow();
    expect(violations).toEqual([]);
  });

  test("a política está valendo: o que vem de fora é barrado, e os testes acima enxergariam", async ({ page }) => {
    const violations = await watchCsp(page);
    await page.goto("/", { waitUntil: "networkidle" });
    expect(violations).toEqual([]);

    const outside = "https://csp-controle.invalid";
    await page.evaluate((origin) => {
      const image = document.createElement("img");
      image.src = `${origin}/imagem.png`;
      document.body.append(image);
      const script = document.createElement("script");
      script.src = `${origin}/script.js`;
      document.body.append(script);
      void fetch(`${origin}/dados`).catch(() => undefined);
      const frame = document.createElement("iframe");
      frame.src = `${origin}/quadro`;
      document.body.append(frame);
      const base = document.createElement("base");
      base.href = `${origin}/`;
      document.head.append(base);
      const form = document.createElement("form");
      form.action = `${origin}/formulario`;
      document.body.append(form);
      form.submit();
    }, outside);

    for (const directive of ["img-src", "script-src", "connect-src", "frame-src", "base-uri", "form-action"]) {
      await expect.poll(() => violations.join("\n"), { message: directive }).toContain(directive);
    }
  });
});

test.describe("Sessão do painel: cookies e CSP @cms", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "Painel no celular é avaliado em ADM-16.");

  const suffix = randomUUID().slice(0, 8);
  const account = { email: `e2e-seg-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-sg1`, id: "" };
  const invited = { email: `e2e-seg-convite-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-cv1`, id: "" };
  const imageAlt = `Imagem seg ${suffix}`;
  let admin: SupabaseClient;

  test.beforeAll(async () => {
    admin = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } });
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
    });
    if (error) throw error;
    account.id = data.user.id;
    await admin.from("profiles").update({ role: "editor", full_name: "E2E segurança" }).eq("id", account.id);
  });

  test.afterAll(async () => {
    const rows = (await admin.from("media_assets").select("path").like("path", `%-seg-${suffix}%`)).data ?? [];
    await admin.from("media_assets").delete().like("path", `%-seg-${suffix}%`);
    if (rows.length) await admin.storage.from("media").remove(rows.map((row) => row.path as string));
    for (const { id } of [account, invited]) if (id) await admin.auth.admin.deleteUser(id);
  });

  async function login(page: Page) {
    await page.goto("/admin/login");
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Senha").fill(account.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  }

  const sessionCookies = async (context: BrowserContext) =>
    (await context.cookies()).filter((cookie) => cookie.name.startsWith("sb-"));

  async function expectProtectedCookies(context: BrowserContext) {
    const cookies = await sessionCookies(context);
    expect(cookies.length).toBeGreaterThan(0);
    for (const cookie of cookies) {
      expect(cookie, cookie.name).toMatchObject({
        httpOnly: true,
        sameSite: "Lax",
        secure: EXPECT_SECURE,
        path: "/",
      });
    }
  }

  /** Link que o e-mail traria (supabase/templates): sem depender do limite de envio do Auth local. */
  function callbackPath(tokenHash: string, type: "recovery" | "invite") {
    const url = new URL("/admin/auth/callback", "http://base.local");
    url.search = new URLSearchParams({ token_hash: tokenHash, type, next: "/admin/nova-senha" }).toString();
    return url.pathname + url.search;
  }

  async function setNewPassword(page: Page, password: string) {
    await expect(page).toHaveURL(/\/admin\/nova-senha$/);
    await page.getByLabel("Nova senha", { exact: true }).fill(password);
    await page.getByLabel("Confirme a nova senha").fill(password);
    await page.getByRole("button", { name: "Salvar senha" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  }

  test("a CSP libera o Supabase do ambiente para imagem e conexão, e nada mais", async ({ request }) => {
    const origin = new URL(SUPABASE_URL!).origin;
    const policy = directivesOf(await request.get("/"));
    expect(policy.get("img-src")).toContain(origin);
    expect(policy.get("connect-src")).toContain(origin);
    expect(policy.get("script-src")).not.toContain(origin);
    expect(policy.get("default-src")).not.toContain(origin);
  });

  test("site público lendo do Supabase carrega sem violação", async ({ page }) => {
    const violations = await watchCsp(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await scrollThrough(page);
    expect(violations).toEqual([]);
  });

  test("login: sessão fora do alcance do JavaScript e painel sem violação", async ({ page, context }) => {
    const violations = await watchCsp(page);
    await login(page);
    await expectProtectedCookies(context);
    expect(await page.evaluate(() => document.cookie)).not.toContain("sb-");
    for (const route of ["/admin/cases", "/admin/servicos", "/admin/paginas", "/admin/midia"]) {
      await page.goto(route, { waitUntil: "networkidle" });
      await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
    }
    expect(violations).toEqual([]);
  });

  test("envio direto ao Storage e miniatura vinda do Supabase passam pela CSP", async ({ page }) => {
    const violations = await watchCsp(page);
    await login(page);
    await page.goto("/admin/midia");
    await expect(page.locator("#file")).toBeEnabled();
    await page
      .locator("#file")
      .setInputFiles({ name: `e2e-seg-${suffix}.png`, mimeType: "image/png", buffer: TINY_PNG });
    await page.locator("#alt").fill(imageAlt);
    await page.getByRole("button", { name: "Enviar", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("enviado", { ignoreCase: true, timeout: 30_000 });

    const thumbnail = page.getByRole("img", { name: imageAlt });
    await expect(thumbnail).toBeVisible();
    await expect(thumbnail).toHaveAttribute("src", new RegExp(`^${new URL(SUPABASE_URL!).origin}/storage/`));
    await expect.poll(() => thumbnail.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  test("sessão aberta antes da mudança continua valendo e ganha os atributos na renovação", async ({
    page,
    context,
  }) => {
    await login(page);
    // Como os navegadores guardaram até aqui: mesmo conteúdo e nome, sem HttpOnly.
    const original = await sessionCookies(context);
    await context.clearCookies();
    await context.addCookies(original.map((cookie) => ({ ...cookie, httpOnly: false })));
    await page.goto("/admin/midia");
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
    expect(await page.evaluate(() => document.cookie)).toContain("sb-");

    // Token vencido: o proxy renova e regrava o cookie com os atributos novos.
    const [{ name }] = original;
    const baseName = name.replace(/\.\d+$/, "");
    const encoded = original
      .filter((cookie) => cookie.name.replace(/\.\d+$/, "") === baseName)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map((cookie) => cookie.value)
      .join("");
    const session = JSON.parse(Buffer.from(encoded.replace(/^base64-/, ""), "base64url").toString("utf8"));
    const expired = `base64-${Buffer.from(
      JSON.stringify({ ...session, expires_at: Math.floor(Date.now() / 1000) - 60 }),
    ).toString("base64url")}`;
    const chunks = expired.match(/.{1,3180}/g)!;
    await context.clearCookies();
    await context.addCookies(
      chunks.map((value, index) => ({
        ...original[0],
        name: chunks.length > 1 ? `${baseName}.${index}` : baseName,
        value,
        httpOnly: false,
      })),
    );

    await page.goto("/admin/midia");
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
    await expectProtectedCookies(context);
    expect(await page.evaluate(() => document.cookie)).not.toContain("sb-");
  });

  test("recuperação: o link do e-mail abre a sessão por http://localhost e a senha nova vale", async ({
    page,
    context,
  }) => {
    const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email: account.email });
    if (error) throw error;
    await page.goto(callbackPath(data.properties.hashed_token, "recovery"));
    await expect(page).toHaveURL(/\/admin\/nova-senha$/);
    await expectProtectedCookies(context);
    account.password = `Senha-e2e-${suffix}-sg2`;
    await setNewPassword(page, account.password);

    await page.getByRole("button", { name: "Sair" }).click();
    // `signOut` manda para `?saiu=1`, e a tela de login recarrega em `?saiu=ok` para limpar a memória (SEG-04).
    await expect(page).toHaveURL(/\/admin\/login\?saiu=ok$/);
    await login(page);
  });

  test("pedido de recuperação pelo formulário: o verificador do PKCE também é protegido", async ({ page, context }) => {
    await page.goto("/admin/recuperar-senha");
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail cadastrado").fill(account.email);
    await page.getByRole("button", { name: "Enviar link" }).click();
    await expect(page.getByText("Se o e-mail estiver cadastrado")).toBeVisible();
    await expectProtectedCookies(context);
  });

  test("convite: o link abre a sessão, a pessoa define a senha e entra", async ({ page, context }) => {
    const { data, error } = await admin.auth.admin.generateLink({ type: "invite", email: invited.email });
    if (error) throw error;
    invited.id = data.user.id;
    await admin.from("profiles").update({ role: "editor", full_name: "E2E convite" }).eq("id", invited.id);
    await page.goto(callbackPath(data.properties.hashed_token, "invite"));
    await expect(page).toHaveURL(/\/admin\/nova-senha$/);
    await expectProtectedCookies(context);
    await setNewPassword(page, invited.password);
    await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
  });

  test("link inválido no callback volta para o login, sem sessão", async ({ page, context }) => {
    await page.goto(callbackPath("token-que-nao-existe", "recovery"));
    await expect(page).toHaveURL(/\/admin\/login\?erro=link$/);
    expect((await sessionCookies(context)).filter((cookie) => cookie.name.endsWith("-auth-token"))).toEqual([]);
  });

  test("logout apaga os cookies e o painel volta a pedir login", async ({ page, context }) => {
    await login(page);
    await page.getByRole("button", { name: "Sair" }).click();
    // `signOut` manda para `?saiu=1`, e a tela de login recarrega em `?saiu=ok` para limpar a memória (SEG-04).
    await expect(page).toHaveURL(/\/admin\/login\?saiu=ok$/);
    expect(await sessionCookies(context)).toEqual([]);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
