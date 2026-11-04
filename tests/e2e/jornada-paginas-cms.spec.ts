/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : jornada-paginas-cms.spec.ts
 Descrição    : Jornada do editor de páginas e blocos no painel.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 01/11/2026 Vinícius Nishimura Reis  Sufixo de teste com node:crypto (CodeQL).
 04/11/2026 Vinícius Nishimura Reis  Chega ao módulo pelo menu do painel (ADM-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Editor de páginas e blocos (ADM-05). Precisa do app construído contra o Supabase local e da
 * chave service_role para preparar a massa: rode `npm run test:e2e:cms`.
 */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

/** O Next mantém a rota anterior escondida (Activity): o localizador ignora a cópia invisível. */
const visible = (locator: Locator) => locator.filter({ visible: true });

test.describe("Painel · páginas e blocos @cms", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "Painel no celular é avaliado em ADM-16.");

  const suffix = randomBytes(3).toString("hex");
  const accounts = {
    editor: { email: `paginas-editor-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-ed1`, id: "" },
    viewer: { email: `paginas-viewer-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-vw1`, id: "" },
  };
  // Rota fixa: o resultado da leitura fica no cache do Next entre rodadas. Por isso a jornada
  // termina despublicando pelo painel, e o rascunho do visitante usa um slug só desta rodada.
  const slug = "privacidade";
  const draftSlug = `rascunho-e2e-${suffix}`;
  let admin: SupabaseClient;
  let pageUrl = "";

  const login = async (page: Page, account: { email: string; password: string }) => {
    await page.goto("/admin/login");
    // O login troca o formulário de fallback pelo definitivo ao terminar de carregar (B-08).
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Senha").fill(account.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  };

  test.beforeAll(async () => {
    admin = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } });
    await admin.from("pages").delete().eq("slug", slug);
    const { data: draft } = await admin
      .from("pages")
      .insert({ slug: draftSlug, title: "Rascunho E2E" })
      .select("id")
      .single();
    await admin.from("blocks").insert({ page_id: draft!.id, type: "rich-text", content: { paragraphs: ["Segredo."] } });
    for (const [role, account] of Object.entries(accounts)) {
      const { data, error } = await admin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
      });
      if (error) throw error;
      account.id = data.user.id;
      await admin
        .from("profiles")
        .update({ role, full_name: `E2E ${role}` })
        .eq("id", account.id);
    }
  });

  test.afterAll(async () => {
    await admin.from("pages").delete().in("slug", [slug, draftSlug]);
    for (const account of Object.values(accounts)) {
      if (account.id) await admin.auth.admin.deleteUser(account.id);
    }
  });

  test("visitante não abre o editor nem lê rascunho", async ({ page, request }) => {
    await page.goto("/admin/paginas");
    await expect(page).toHaveURL(/\/admin\/login/);
    expect((await request.get(`/api/v1/pages/${draftSlug}`)).status()).toBe(404);
  });

  test("editor cria rascunho, escreve blocos e publica; o que salvou reaparece", async ({ page, request }) => {
    await login(page, accounts.editor);
    await page
      .getByRole("navigation", { name: "Módulos do painel" })
      .getByRole("link", { name: "Páginas e textos" })
      .click();
    await expect(page.getByRole("heading", { name: "Páginas e textos" })).toBeVisible();

    await page.getByRole("link", { name: "Criar conteúdo da página Privacidade" }).click();
    await visible(page.getByRole("button", { name: "Criar rascunho" })).click();
    await expect(page.getByText("Rascunho criado.")).toBeVisible();
    await expect(page.getByText("Inclua ao menos um bloco de conteúdo.")).toBeVisible();
    pageUrl = page.url().split("?")[0];

    await page.getByRole("link", { name: "Texto", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Novo bloco: Texto" })).toBeVisible();
    await visible(page.getByLabel("Título")).fill("Texto de teste");
    await visible(page.getByLabel("Parágrafos")).fill("Primeira versão.");
    await visible(page.getByRole("button", { name: "Adicionar bloco" })).click();
    await expect(page.getByText("Alterações salvas.")).toBeVisible();
    await expect(page.getByText("Texto de teste")).toBeVisible();

    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(page.getByRole("status").getByText("Publicado. O site já mostra a versão nova.")).toBeVisible();
    const published = await (await request.get(`/api/v1/pages/${slug}`)).json();
    expect(published.data.blocks[0].content.paragraphs).toEqual(["Primeira versão."]);

    await page.getByRole("link", { name: "Editar o bloco Texto" }).click();
    await expect(page.getByRole("heading", { name: "Editar bloco: Texto" })).toBeVisible();
    await visible(page.getByLabel("Parágrafos")).fill("Segunda versão.");
    await visible(page.getByRole("button", { name: "Salvar bloco" })).click();
    await expect(page.getByText("Alterações salvas.")).toBeVisible();
    const edited = await (await request.get(`/api/v1/pages/${slug}`)).json();
    expect(edited.data.blocks[0].content.paragraphs).toEqual(["Segunda versão."]);
  });

  test("erro de validação aparece no campo e preserva o que foi digitado", async ({ page }) => {
    await login(page, accounts.editor);
    await page.goto(`${pageUrl}/blocos/novo?tipo=cta`);
    await visible(page.getByLabel("Título")).fill("Vamos conversar?");
    await visible(page.getByLabel("Texto do botão")).fill("Falar");
    await visible(page.getByLabel("Destino")).fill("javascript:alert(1)");
    await visible(page.getByRole("button", { name: "Adicionar bloco" })).click();
    await expect(page.getByText("Destino desconhecido ou sem https.")).toBeVisible();
    await expect(visible(page.getByLabel("Título"))).toHaveValue("Vamos conversar?");
  });

  test("Nosso time aceita mais de uma pessoa, na ordem da tela", async ({ page, request }) => {
    await login(page, accounts.editor);
    await page.goto(`${pageUrl}/blocos/novo?tipo=team`);
    await page.getByRole("button", { name: "Adicionar pessoa" }).click();
    const names = visible(page.getByLabel("Nome"));
    await names.nth(0).fill("Pessoa Um");
    await names.nth(1).fill("Pessoa Dois");
    await page.getByRole("button", { name: "Descer a pessoa 1" }).click();
    await visible(page.getByRole("button", { name: "Adicionar bloco" })).click();
    await expect(page.getByText("Alterações salvas.")).toBeVisible();
    const { data } = await (await request.get(`/api/v1/pages/${slug}`)).json();
    expect(data.blocks[1].content.members.map((member: { name: string }) => member.name)).toEqual([
      "Pessoa Dois",
      "Pessoa Um",
    ]);
  });

  test("leitor vê os blocos, mas não edita", async ({ page }) => {
    await login(page, accounts.viewer);
    await page.goto(pageUrl);
    await expect(page.getByRole("heading", { name: "Blocos" })).toBeVisible();
    await expect(page.getByText("Texto de teste")).toBeVisible();
    await expect(page.getByRole("link", { name: "Editar o bloco Texto" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Salvar alterações" })).toHaveCount(0);
    await page.goto(`${pageUrl}/blocos/novo?tipo=rich-text`);
    await expect(page).toHaveURL(/\/admin\/sem-permissao/);
  });

  test("despublicada, a página sai da leitura pública na hora", async ({ page, request }) => {
    await login(page, accounts.editor);
    await page.goto(pageUrl);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Despublicar" }).click();
    await expect(page.getByRole("status").getByText("Despublicado")).toBeVisible();
    expect((await request.get(`/api/v1/pages/${slug}`)).status()).toBe(404);
  });
});
