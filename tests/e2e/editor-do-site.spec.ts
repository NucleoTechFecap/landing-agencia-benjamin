/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : editor-do-site.spec.ts
 Descrição    : Jornadas do editor do site: textos, página nova, SEO, aparência, menu, histórico e restauração.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  ACTION_TIMEOUT_MS,
  REQUIRES_SUPABASE,
  SERVICE_KEY,
  SUPABASE_URL,
  acceptConfirmation,
  createAccount,
  deleteAccounts,
  login,
  newSuffix,
  publishBudgetMs,
  serviceClient,
  type Account,
} from "./painel-helpers";

/** O Next mantém a rota anterior escondida (Activity): o localizador ignora a cópia invisível. */
const visible = (locator: Locator) => locator.filter({ visible: true });

/** Volta da Server Action: a aba só muda depois de gravar. */
const saved = (page: Page) => expect(page.getByText("Alterações salvas.")).toBeVisible({ timeout: ACTION_TIMEOUT_MS });

/** O site reflete a alteração dentro do prazo do ADR-0006, sem deploy: cada tentativa é uma visita nova. */
async function expectOnSite(page: Page, path: string, text: string, present = true) {
  await expect
    .poll(
      async () => {
        const response = await page.request.get(path, { headers: { "cache-control": "no-cache" } });
        return (await response.text()).includes(text);
      },
      { timeout: publishBudgetMs(), intervals: [200, 400, 800] },
    )
    .toBe(present);
}

test.describe("Editor do site @cms", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, REQUIRES_SUPABASE);
  test.skip(({ isMobile }) => isMobile, "O painel no celular é coberto em painel-responsivo.");

  const suffix = newSuffix();
  const freeSlug = `pagina-e2e-${suffix}`;
  let admin: SupabaseClient;
  let adminAccount: Account;
  let editor: Account;
  let viewer: Account;

  test.beforeAll(async () => {
    admin = serviceClient();
    await admin.from("pages").delete().eq("slug", "feedback");
    [adminAccount, editor, viewer] = await Promise.all([
      createAccount(admin, "admin", suffix),
      createAccount(admin, "editor", suffix),
      createAccount(admin, "viewer", suffix),
    ]);
  });

  test.afterAll(async () => {
    await admin.from("pages").delete().in("slug", ["feedback", freeSlug]);
    await deleteAccounts(admin, [adminAccount, editor, viewer]);
  });

  test("editor troca um texto fixo, publica, vê no site e volta atrás pelo histórico", async ({ page }) => {
    const novo = `Título de teste ${suffix}`;
    await login(page, editor);
    await page.goto("/admin/paginas");
    await page.getByRole("link", { name: "Criar conteúdo da página Feedback" }).click();
    await visible(page.getByRole("button", { name: "Criar rascunho" })).click();
    await expect(page.getByText("Rascunho criado.")).toBeVisible({ timeout: ACTION_TIMEOUT_MS });

    await page.getByRole("link", { name: "Textos e imagens" }).click();
    await expect(page).toHaveURL(/aba=textos/);
    const titulo = visible(page.locator('[name="abertura.titulo"]'));
    const original = await titulo.inputValue();
    expect(original).not.toBe("");
    await titulo.fill(novo);
    await visible(page.getByRole("button", { name: "Salvar textos e imagens" })).click();
    await saved(page);

    // Rascunho: o site continua com o original.
    await expectOnSite(page, "/feedback", novo, false);

    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(page.getByRole("status").getByText("Publicado. O site já mostra a versão nova.")).toBeVisible({
      timeout: ACTION_TIMEOUT_MS,
    });
    await expectOnSite(page, "/feedback", novo);

    // O que está no banco é só a diferença: nenhum outro campo foi gravado.
    const { data } = await admin.from("pages").select("fields").eq("slug", "feedback").single();
    expect(Object.keys((data!.fields as { values: object }).values)).toHaveLength(1);

    // O histórico mostra quem alterou, compara e restaura.
    await page.getByRole("link", { name: "Ver histórico e restaurar" }).click();
    await expect(page.getByText("E2E editor").first()).toBeVisible();
    await expect(page.getByText("Publicado", { exact: false }).first()).toBeVisible();
    await page.getByRole("link", { name: /Ver e restaurar a versão 1/ }).click();
    await expect(page.getByRole("cell", { name: novo })).toBeVisible();
    await page.getByRole("button", { name: "Restaurar esta versão" }).click();
    await acceptConfirmation(page, "Restaurar");
    await expect(page.getByText("Versão restaurada.")).toBeVisible({ timeout: ACTION_TIMEOUT_MS });
    await expectOnSite(page, "/feedback", novo, false);

    const { data: versions } = await admin
      .from("content_versions")
      .select("action, restored_from, created_by")
      .eq("entity", "page")
      .eq("entity_id", page.url().split("/admin/paginas/")[1].split(/[?#]/)[0])
      .order("version");
    expect(versions?.at(-1)).toMatchObject({ action: "version_restored", restored_from: 1, created_by: editor.id });
  });

  test("cria uma página com endereço próprio, com SEO e Open Graph, e ela só existe depois de publicada", async ({
    page,
  }) => {
    await login(page, editor);
    await page.goto("/admin/paginas/nova");
    await visible(page.getByLabel("Título da página")).fill(`Página E2E ${suffix}`);
    await visible(page.getByLabel("Endereço")).fill(freeSlug);
    await visible(page.getByRole("button", { name: "Criar rascunho" })).click();
    await expect(page.getByText("Rascunho criado.")).toBeVisible({ timeout: ACTION_TIMEOUT_MS });
    const url = page.url().split("?")[0];

    expect((await page.request.get(`/${freeSlug}`)).status()).toBe(404);

    await page.getByRole("link", { name: "Abertura com título e botões", exact: true }).click();
    await expect(page).toHaveURL(/blocos\/novo\?tipo=hero/);
    await visible(page.locator('[name="bloco.titulo"]')).fill(`Abertura ${suffix}`);
    await visible(page.getByRole("button", { name: "Adicionar bloco" })).click();
    await saved(page);

    await page.getByRole("link", { name: "Perguntas frequentes", exact: true }).click();
    await expect(page).toHaveURL(/tipo=faq/);
    await visible(page.getByRole("button", { name: "Adicionar pergunta" })).click();
    await visible(page.locator('[name="bloco.itens.0.pergunta"]')).fill("Como funciona?");
    await visible(page.locator('[name="bloco.itens.0.resposta"]')).fill("Funciona assim.");
    await visible(page.getByRole("button", { name: "Adicionar bloco" })).click();
    await saved(page);

    await page.goto(`${url}?aba=seo`);
    await visible(page.getByLabel("Título para buscadores")).fill(`SEO ${suffix}`);
    await visible(page.getByLabel("Descrição para buscadores")).fill("Descrição própria para os buscadores.");
    await expect(page.getByLabel("Prévia do resultado de busca")).toContainText(`SEO ${suffix}`);
    await visible(page.getByLabel("Título ao compartilhar")).fill(`Cartão ${suffix}`);
    await visible(page.getByRole("button", { name: "Salvar SEO e compartilhamento" })).click();
    await saved(page);

    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(page.getByRole("status").getByText("Publicado.", { exact: false })).toBeVisible({
      timeout: ACTION_TIMEOUT_MS,
    });

    await expect
      .poll(async () => (await page.request.get(`/${freeSlug}`)).status(), { timeout: publishBudgetMs() })
      .toBe(200);
    await page.goto(`/${freeSlug}`);
    await expect(page.getByRole("heading", { level: 1, name: `Abertura ${suffix}` })).toBeVisible();
    await expect(page.getByText("Como funciona?")).toBeVisible();
    await expect(page).toHaveTitle(`SEO ${suffix}`);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", `Cartão ${suffix}`);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      "Descrição própria para os buscadores.",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);

    await expect
      .poll(async () => (await (await page.request.get("/sitemap.xml")).text()).includes(`/${freeSlug}<`), {
        timeout: publishBudgetMs(),
      })
      .toBe(true);

    // Maiúsculas vão ao endereço certo; despublicada, ela volta a 404 de verdade.
    const upper = await page.request.get(`/${freeSlug.toUpperCase()}`, { maxRedirects: 0 });
    expect(upper.status()).toBe(301);

    await page.goto(url);
    await page.getByRole("button", { name: "Despublicar" }).click();
    await acceptConfirmation(page, "Despublicar");
    await expect(page.getByRole("status").getByText("Despublicado", { exact: false })).toBeVisible({
      timeout: ACTION_TIMEOUT_MS,
    });
    await expect
      .poll(async () => (await page.request.get(`/${freeSlug}`)).status(), { timeout: publishBudgetMs() })
      .toBe(404);
  });

  test("serviço publicado ganha SEO e imagem de compartilhamento próprios, sem mudar o endereço", async ({ page }) => {
    const slug = `servico-seo-${suffix}`;
    const { data: service } = await admin
      .from("services")
      .insert({
        slug,
        name: `Serviço SEO ${suffix}`,
        summary: "Resumo do serviço de teste.",
        description: "Descrição do serviço de teste com tamanho suficiente.",
        status: "draft",
      })
      .select("id")
      .single();
    try {
      await login(page, editor);
      await page.goto(`/admin/servicos/${service!.id}?aba=seo`);
      await visible(page.getByLabel("Título para buscadores")).fill(`Título próprio ${suffix}`);
      await visible(page.getByRole("button", { name: "Salvar SEO e compartilhamento" })).click();
      await saved(page);
      const { data } = await admin.from("services").select("seo").eq("id", service!.id).single();
      expect(data!.seo).toEqual({ title: `Título próprio ${suffix}` });
      await page.getByRole("link", { name: "Ver histórico e restaurar" }).click();
      await expect(page.getByText("SEO e compartilhamento").first()).toBeVisible();
    } finally {
      await admin.from("services").delete().eq("id", service!.id);
      await admin.from("content_versions").delete().eq("entity_id", service!.id);
    }
  });

  test("não cria página num endereço que já é do site", async ({ page }) => {
    await login(page, editor);
    await page.goto("/admin/paginas/nova");
    await visible(page.getByLabel("Título da página")).fill("Sobre nós");
    await visible(page.getByLabel("Endereço")).fill("sobre");
    await visible(page.getByRole("button", { name: "Criar rascunho" })).click();
    await expect(page.getByText("Este endereço já é de uma página do site.")).toBeVisible({
      timeout: ACTION_TIMEOUT_MS,
    });
  });

  test("destino de botão com javascript: é recusado", async ({ page }) => {
    await login(page, editor);
    const { data } = await admin.from("pages").select("id, updated_at").eq("slug", "feedback").single();
    await page.goto(`/admin/paginas/${data!.id}/blocos/novo?tipo=buttons`);
    await visible(page.getByRole("button", { name: "Adicionar botão" })).click();
    await visible(page.locator('[name="bloco.itens.0.label"]')).fill("Clique");
    await visible(page.locator('[name="bloco.itens.0.href"]')).fill("javascript:alert(1)");
    await visible(page.getByRole("button", { name: "Adicionar bloco" })).click();
    await expect(page.getByText("Use uma página do site").first()).toBeVisible({ timeout: ACTION_TIMEOUT_MS });
  });

  test("editor não muda a aparência; leitor vê o histórico, sem restaurar", async ({ page }) => {
    await login(page, editor);
    await page.goto("/admin/aparencia");
    await expect(page.getByText("Somente leitura.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar e publicar a aparência" })).toHaveCount(0);

    await page.context().clearCookies();
    await login(page, viewer);
    await page.goto("/admin/historico");
    await expect(page.getByRole("heading", { name: "Histórico de alterações" })).toBeVisible();
    await page
      .getByRole("link", { name: /Ver e restaurar/ })
      .first()
      .click();
    await expect(page.getByRole("heading", { level: 1, name: /Versão/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Restaurar esta versão" })).toHaveCount(0);
  });
});

/** Aparência, menu e Home valem para o site inteiro: rodam à parte, sem disputar a mesma linha com outras jornadas. */
test.describe("O que vale para o site inteiro @home-global", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, REQUIRES_SUPABASE);
  test.skip(({ isMobile }) => isMobile, "O painel no celular é coberto em painel-responsivo.");

  const suffix = newSuffix();
  let admin: SupabaseClient;
  let adminAccount: Account;

  test.beforeAll(async () => {
    admin = serviceClient();
    // Rodada interrompida não pode deixar a cor do teste já gravada.
    await admin.from("site_settings").update({ theme: {} }).eq("id", true);
    await admin.from("content_versions").delete().eq("entity", "theme");
    await admin.from("pages").delete().in("slug", ["home", "site-geral"]);
    adminAccount = await createAccount(admin, "admin", suffix);
  });

  test.afterAll(async () => {
    await admin.from("site_settings").update({ theme: {} }).eq("id", true);
    await admin.from("content_versions").delete().eq("entity", "theme");
    await admin.from("pages").delete().in("slug", ["home", "site-geral"]);
    await deleteAccounts(admin, [adminAccount]);
  });

  test("administrador muda as cores, o site acompanha e a marca volta pelo histórico", async ({ page }) => {
    await login(page, adminAccount);
    await page.goto("/admin/aparencia");
    const cor = "#d94f04";
    await visible(page.getByLabel(/Laranja/))
      .first()
      .fill(cor);
    await expect(page.getByLabel("Prévia da aparência")).toBeVisible();
    await visible(page.getByRole("button", { name: "Salvar e publicar a aparência" })).click();
    await expect(page.getByText("Salvo e já no ar")).toBeVisible({ timeout: ACTION_TIMEOUT_MS });
    await expectOnSite(page, "/", `--color-benja-laranja:${cor}`);

    // A alteração aparece na linha do tempo geral, com o nome de quem fez.
    await page.goto("/admin/historico");
    await expect(page.getByRole("main").getByRole("link", { name: "Aparência do site" }).first()).toBeVisible();
    await expect(page.getByRole("main").getByText("E2E admin").first()).toBeVisible();

    await page.goto("/admin/historico/theme/site");
    await page.getByRole("link", { name: /Ver e restaurar a versão 1/ }).click();
    await expect(page.getByRole("cell", { name: cor })).toBeVisible();
    await page.getByRole("button", { name: "Restaurar esta versão" }).click();
    await acceptConfirmation(page, "Restaurar");
    await expect(page.getByText("Versão restaurada.")).toBeVisible({ timeout: ACTION_TIMEOUT_MS });
    await expectOnSite(page, "/", `--color-benja-laranja:${cor}`, false);
  });

  test("cor ilegível é recusada", async ({ page }) => {
    await login(page, adminAccount);
    await page.goto("/admin/aparencia");
    await visible(page.getByLabel(/Verde \(principal\)/))
      .first()
      .fill("#f1fcd0");
    await expect(page.getByText("Ilegível", { exact: false }).first()).toBeVisible();
    await visible(page.getByRole("button", { name: "Salvar e publicar a aparência" })).click();
    await expect(page.getByText("Estas cores deixariam o texto ilegível.")).toBeVisible({
      timeout: ACTION_TIMEOUT_MS,
    });
  });

  test("a prévia da Home mostra o rascunho, e o site continua com o que está publicado", async ({ page }) => {
    const manifesto = `Manifesto em revisão ${suffix}`;
    const etiqueta = `Etiqueta em revisão ${suffix}`;
    const { data: home } = await admin
      .from("pages")
      .insert({
        slug: "home",
        title: "Home",
        fields: { values: { "abertura.etiqueta": etiqueta }, hidden: ["cases"] },
      })
      .select("id")
      .single();
    await admin.from("blocks").insert({
      page_id: home!.id,
      type: "manifesto",
      sort_order: 0,
      content: { title: manifesto, paragraphs: ["Primeiro parágrafo."] },
    });

    await login(page, adminAccount);
    await page.goto(`/admin/previa/pagina/${home!.id}`);
    await expect(page.getByRole("heading", { level: 1, name: manifesto })).toBeVisible();
    await expect(page.getByText(etiqueta)).toBeVisible();
    await expect(page.locator("#cases-titulo")).toHaveCount(0);

    const site = await (await page.request.get("/")).text();
    expect(site).not.toContain(manifesto);
    expect(site).not.toContain(etiqueta);
    expect(site).toContain('id="cases-titulo"');
    await admin.from("pages").delete().eq("id", home!.id);
  });

  test("uma linha nova no menu aparece em todas as páginas e sai ao despublicar", async ({ page }) => {
    await login(page, adminAccount);
    await page.goto("/admin/paginas");
    await page.getByRole("link", { name: "Criar conteúdo da página Menu, rodapé e textos gerais" }).click();
    await visible(page.getByRole("button", { name: "Criar rascunho" })).click();
    await expect(page.getByText("Rascunho criado.")).toBeVisible({ timeout: ACTION_TIMEOUT_MS });
    const url = page.url().split("?")[0];

    await visible(page.getByRole("button", { name: "Adicionar link" }))
      .first()
      .click();
    // O menu principal tem seis linhas no padrão: a nova é a sétima.
    await visible(page.locator('[name="cabecalho.menu.6.label"]')).fill(`Menu ${suffix}`);
    await visible(page.locator('[name="cabecalho.menu.6.href"]')).fill("/sobre");
    await visible(page.getByRole("button", { name: "Salvar textos e imagens" })).click();
    await expect(page.getByText("Alterações salvas.")).toBeVisible({ timeout: ACTION_TIMEOUT_MS });
    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(page.getByRole("status").getByText("Publicado.", { exact: false })).toBeVisible({
      timeout: ACTION_TIMEOUT_MS,
    });
    await expectOnSite(page, "/", `Menu ${suffix}`);
    await expectOnSite(page, "/cases", `Menu ${suffix}`);

    await page.goto(url);
    await page.getByRole("button", { name: "Despublicar" }).click();
    await acceptConfirmation(page, "Despublicar");
    await expect(page.getByRole("status").getByText("Despublicado", { exact: false })).toBeVisible({
      timeout: ACTION_TIMEOUT_MS,
    });
    await expectOnSite(page, "/", `Menu ${suffix}`, false);
  });
});
