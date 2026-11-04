/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : jornada-previa-cms.spec.ts
 Descrição    : Prévia protegida: quem acessa, o que mostra e o que nunca chega ao público.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-14).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

/** Precisa do app construído contra o Supabase local: rode `npm run test:e2e:cms`. */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

test.describe("Painel · prévia protegida @cms", () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "Painel no celular é avaliado em ADM-16.");

  let admin: SupabaseClient;
  let suffix: string;
  const accounts = {
    editor: { email: "", password: "", id: "" },
    viewer: { email: "", password: "", id: "" },
    pending: { email: "", password: "", id: "" },
  };
  const ids = { service: "", category: "", case: "", page: "", manifesto: "" };
  const slugs = { service: "", case: "" };
  const secret = { service: "", case: "", paragraph: "", manifesto: "" };
  const asset = { id: "", path: "" };

  async function must<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as T;
  }

  test.beforeAll(async () => {
    admin = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } });
    suffix = randomUUID().slice(0, 8);
    Object.assign(secret, {
      service: `Serviço secreto ${suffix}`,
      case: `Case secreto ${suffix}`,
      paragraph: `Parágrafo ainda não publicado ${suffix}`,
      manifesto: `Manifesto em revisão ${suffix}`,
    });
    Object.assign(slugs, { service: `previa-servico-${suffix}`, case: `previa-case-${suffix}` });

    for (const [role, account] of Object.entries(accounts)) {
      account.email = `e2e-previa-${role}-${suffix}@teste.local`;
      account.password = `Senha-e2e-${suffix}-p1!`;
      const { data, error } = await admin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
      });
      if (error) throw error;
      account.id = data.user.id;
      await admin
        .from("profiles")
        .update({ role, full_name: `E2E prévia ${role}` })
        .eq("id", account.id);
    }

    const insert = (table: string, values: Record<string, unknown>) =>
      must<{ id: string }>(admin.from(table).insert(values).select("id").single());
    // Imagem real no Storage: a prévia precisa carregá-la sob a CSP (SEG-06).
    const bytes = readFileSync(join(process.cwd(), "public/brand/cases/meridiano.webp"));
    asset.path = `2026/11/${randomUUID()}-previa-${suffix}.webp`;
    const upload = await admin.storage.from("media").upload(asset.path, bytes, { contentType: "image/webp" });
    if (upload.error) throw upload.error;
    asset.id = (
      await insert("media_assets", {
        path: asset.path,
        mime_type: "image/webp",
        size_bytes: bytes.length,
        width: 1200,
        height: 750,
        alt_text: "Capa do rascunho",
        decorative: false,
      })
    ).id;
    const photo = admin.storage.from("media").getPublicUrl(asset.path).data.publicUrl;
    ids.service = (
      await insert("services", {
        slug: slugs.service,
        name: secret.service,
        summary: "Resumo do rascunho.",
        description: "Descrição do rascunho.",
      })
    ).id;
    ids.category = (await insert("case_categories", { slug: `previa-cat-${suffix}`, name: `Categoria ${suffix}` })).id;
    ids.case = (
      await insert("cases", {
        slug: slugs.case,
        title: secret.case,
        client_name: "Cliente Fictício",
        category_id: ids.category,
        summary: "Resumo do case.",
        challenge: "Desafio do rascunho.",
        cover_media_id: asset.id,
      })
    ).id;
    ids.page = (await insert("pages", { slug: `previa-pagina-${suffix}`, title: `Página ${suffix}` })).id;
    await insert("blocks", {
      page_id: ids.page,
      type: "rich-text",
      sort_order: 0,
      content: { title: "Texto da prévia", paragraphs: [secret.paragraph] },
    });
    await insert("blocks", {
      page_id: ids.page,
      type: "team",
      sort_order: 1,
      content: {
        title: "Time da prévia",
        members: [{ name: "Ana Fictícia", role: "Direção", photo: { src: photo, alt: "Ana sorrindo" } }],
      },
    });
    ids.manifesto = (await insert("pages", { slug: `previa-manifesto-${suffix}`, title: `Topo ${suffix}` })).id;
    await insert("blocks", {
      page_id: ids.manifesto,
      type: "manifesto",
      sort_order: 0,
      content: { title: secret.manifesto, paragraphs: ["Primeiro parágrafo."] },
    });
  });

  test.afterAll(async () => {
    await admin.from("pages").delete().in("id", [ids.page, ids.manifesto].filter(Boolean));
    if (ids.case) await admin.from("cases").delete().eq("id", ids.case);
    if (ids.category) await admin.from("case_categories").delete().eq("id", ids.category);
    if (ids.service) await admin.from("services").delete().eq("id", ids.service);
    if (asset.id) await admin.from("media_assets").delete().eq("id", asset.id);
    if (asset.path) await admin.storage.from("media").remove([asset.path]);
    for (const account of Object.values(accounts)) if (account.id) await admin.auth.admin.deleteUser(account.id);
  });

  async function login(page: Page, account: { email: string; password: string }, landing = /\/admin$/) {
    await page.goto("/admin/login");
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Senha").fill(account.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(landing);
  }

  const servicePreview = () => `/admin/previa/servico/${ids.service}`;

  /** Bloqueios da CSP vão só para o console: sem isto, uma imagem barrada passaria despercebida. */
  function watchCsp(page: Page) {
    const blocked: string[] = [];
    page.on("console", (message) => {
      if (message.text().includes("Content Security Policy")) blocked.push(message.text());
    });
    return blocked;
  }

  /**
   * Passa pelo otimizador, na mesma origem. O carregamento em si não dá para conferir aqui: o Next recusa
   * buscar a imagem no Storage local, por ser IP privado. O caminho direto ao Storage sob a CSP está em
   * jornada-midia-gestao.
   */
  const expectOptimized = (image: ReturnType<Page["getByRole"]>) =>
    expect(image).toHaveAttribute("src", /^\/_next\/image\?url=/);

  test("visitante é levado ao login e não recebe nada do rascunho", async ({ page, request }) => {
    const direct = await request.get(servicePreview(), { maxRedirects: 0 });
    expect(direct.status()).toBe(307);
    expect(direct.headers().location).toContain("/admin/login");
    expect(await direct.text()).not.toContain(secret.service);

    await page.goto(servicePreview());
    await expect(page).toHaveURL(/\/admin\/login/);
    expect(await page.content()).not.toContain(secret.service);
  });

  test("conta sem papel liberado não entra, então não chega à prévia", async ({ page }) => {
    await login(page, accounts.pending, /\/admin\/login/);
    await page.goto(servicePreview());
    await expect(page).toHaveURL(/\/admin\/login/);
    expect(await page.content()).not.toContain(secret.service);
  });

  test("editor abre pelo painel e vê o rascunho como no site, sem indexação nem cache", async ({ page, request }) => {
    await login(page, accounts.editor);
    await page.goto(`/admin/servicos/${ids.service}`);
    const link = page.getByRole("link", { name: "Ver prévia" }).filter({ visible: true });
    await expect(link).toHaveAttribute("href", servicePreview());

    const response = await page.goto(servicePreview());
    await expect(page.getByRole("heading", { level: 1, name: secret.service })).toBeVisible();
    await expect(page.getByText("Descrição do rascunho.")).toBeVisible();
    await expect(page.getByRole("status").first()).toContainText("ainda não está no site");
    await expect(page.getByRole("link", { name: "Voltar ao painel" })).toHaveAttribute(
      "href",
      `/admin/servicos/${ids.service}`,
    );

    const headers = response!.headers();
    expect(headers["x-robots-tag"]).toContain("noindex");
    expect(headers["cache-control"]).toContain("no-store");
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    // O breadcrumb do cabeçalho tem JSON-LD próprio; o schema do item, que vai para buscadores, não sai aqui.
    expect(await page.locator('script[type="application/ld+json"]').allTextContents()).not.toContainEqual(
      expect.stringContaining('"Service"'),
    );

    // Abrir a prévia não põe nada no cache público.
    expect((await request.get(`/servicos/${slugs.service}`)).status()).toBe(404);
    expect((await request.get(`/api/v1/services/${slugs.service}`)).status()).toBe(404);
  });

  test("mostra a alteração gravada na hora, enquanto o site segue sem o item", async ({ page, request }) => {
    await login(page, accounts.editor);
    const text = `Resumo alterado ${randomUUID().slice(0, 8)}`;
    await page.goto(servicePreview());
    await expect(page.getByRole("heading", { level: 1, name: secret.service })).toBeVisible();
    await must(admin.from("services").update({ summary: text }).eq("id", ids.service).select("id"));
    await page.reload();
    await expect(page.getByText(text)).toBeVisible();
    expect((await request.get(`/servicos/${slugs.service}`)).status()).toBe(404);
  });

  test("leitor vê a prévia, mas não ganha botão de gravar", async ({ page }) => {
    const blocked = watchCsp(page);
    await login(page, accounts.viewer);
    await page.goto(`/admin/previa/case/${ids.case}`);
    await expect(page.getByRole("heading", { level: 1, name: secret.case })).toBeVisible();
    await expectOptimized(page.getByRole("img", { name: "Capa do rascunho" }));
    expect(blocked).toEqual([]);
    await expect(page.getByText("Desafio do rascunho.")).toBeVisible();
    await expect(page.getByRole("button", { name: /Publicar|Salvar/ })).toHaveCount(0);
  });

  test("página: mostra os blocos editáveis em rascunho", async ({ page, request }) => {
    await login(page, accounts.editor);
    await page.goto(`/admin/paginas/${ids.page}`);
    await expect(page.getByRole("link", { name: "Ver prévia" }).filter({ visible: true })).toHaveAttribute(
      "href",
      `/admin/previa/pagina/${ids.page}`,
    );
    const blocked = watchCsp(page);
    await page.goto(`/admin/previa/pagina/${ids.page}`);
    await expect(page.getByText(secret.paragraph)).toBeVisible();
    await expectOptimized(page.getByRole("img", { name: "Ana sorrindo" }));
    expect(blocked).toEqual([]);
    await expect(page.getByText("Ana Fictícia")).toBeVisible();
    await expect(page.getByRole("status").first()).toContainText("seções fixas");
    expect(await (await request.get("/")).text()).not.toContain(secret.paragraph);
  });

  test("bloco de manifesto aparece no topo da prévia, sem chegar à Home", async ({ page, request }) => {
    await login(page, accounts.editor);
    await page.goto(`/admin/previa/pagina/${ids.manifesto}`);
    await expect(page.getByRole("heading", { level: 1, name: secret.manifesto })).toBeVisible();
    expect(await (await request.get("/")).text()).not.toContain(secret.manifesto);
  });

  test("tipo sem prévia e item inexistente mostram a página de não encontrado", async ({ page }) => {
    await login(page, accounts.editor);
    for (const path of [`/admin/previa/area/${ids.service}`, `/admin/previa/servico/${randomUUID()}`]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: "Essa pauta não saiu do briefing." })).toBeVisible();
    }
  });
});
