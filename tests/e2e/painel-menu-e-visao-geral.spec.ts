/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : painel-menu-e-visao-geral.spec.ts
 Descrição    : Menu do painel e visão geral dos conteúdos, por papel, no desktop e no celular (ADM-04, ADM-18).

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-04, ADM-18).
──────────────────────────────────────────────────────────────────────────────
*/

import type { SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  REQUIRES_SUPABASE,
  SERVICE_KEY,
  SUPABASE_URL,
  createAccount,
  deleteAccounts,
  login,
  newSuffix,
  openMenu,
  panelMenu,
  serviceClient,
  submitLogin,
  type Account,
  type PanelRole,
} from "./painel-helpers";

const PHONE = { width: 360, height: 740 };
const PAST = "2026-10-01T12:00:00.000Z";

/** O Next mantém a rota anterior escondida (Activity): o localizador ignora a cópia invisível. */
const visible = (locator: Locator) => locator.filter({ visible: true });

test.describe("Painel · menu e visão geral dos conteúdos @cms", () => {
  // Em série: a jornada do editor muda um item que as outras jornadas leem.
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, REQUIRES_SUPABASE);
  test.skip(({ isMobile }) => isMobile, "As larguras são definidas pelo próprio teste.");

  const suffix = newSuffix();
  const titles = {
    draftPending: `Área pendente ${suffix}`,
    draftReady: `Categoria pronta ${suffix}`,
    archived: `Área arquivada ${suffix}`,
    liveBroken: `Case no ar ${suffix}`,
    liveOk: `Serviço em dia ${suffix}`,
    provisional: `Página provisória ${suffix}`,
  };
  const ids = {
    draftPending: "",
    draftReady: "",
    archived: "",
    liveBroken: "",
    liveOk: "",
    provisional: "",
    area: "",
    cover: "",
  };
  const accounts: Partial<Record<PanelRole, Account>> = {};
  let client: SupabaseClient;

  const insert = async (table: string, values: Record<string, unknown>) => {
    const { data, error } = await client.from(table).insert(values).select("id").single();
    if (error) throw new Error(`${table}: ${error.message}`);
    return data.id as string;
  };

  test.beforeAll(async () => {
    client = serviceClient();
    for (const role of ["admin", "editor", "viewer", "pending"] as const) {
      accounts[role] = await createAccount(client, role, suffix);
    }
    const published = { status: "published", published_at: PAST };
    ids.draftPending = await insert("areas", { slug: `pendente-${suffix}`, name: titles.draftPending });
    ids.archived = await insert("areas", {
      status: "archived",
      archived_at: PAST,
      slug: `arquivada-${suffix}`,
      name: titles.archived,
    });
    ids.area = await insert("areas", {
      ...published,
      slug: `apoio-${suffix}`,
      name: `Área de apoio ${suffix}`,
      summary: "Resumo da área de apoio do teste.",
      description: "Descrição da área de apoio do teste de visão geral.",
    });
    ids.liveOk = await insert("services", {
      ...published,
      slug: `em-dia-${suffix}`,
      name: titles.liveOk,
      summary: "Resumo do serviço em dia.",
      description: "Descrição do serviço em dia do teste de visão geral.",
    });
    await client.from("service_areas").insert({ service_id: ids.liveOk, area_id: ids.area });
    ids.draftReady = await insert("case_categories", { slug: `pronta-${suffix}`, name: titles.draftReady });
    ids.cover = await insert("media_assets", {
      path: `e2e/visao-geral-${suffix}.webp`,
      mime_type: "image/webp",
      width: 1200,
      height: 750,
      alt_text: "Capa fictícia do teste",
    });
    // Publicado por service_role com a categoria em rascunho: o estado que a fila precisa apontar.
    ids.liveBroken = await insert("cases", {
      ...published,
      slug: `no-ar-${suffix}`,
      title: titles.liveBroken,
      client_name: "Cliente fictício",
      summary: "Resumo do case publicado com a categoria ainda em rascunho.",
      category_id: ids.draftReady,
      cover_media_id: ids.cover,
    });
    ids.provisional = await insert("pages", {
      ...published,
      provisional: true,
      slug: `provisoria-${suffix}`,
      title: titles.provisional,
    });
    await insert("blocks", {
      page_id: ids.provisional,
      type: "rich-text",
      sort_order: 0,
      content: { paragraphs: ["Texto de teste."] },
    });
  });

  test.afterAll(async () => {
    if (!client) return;
    await client.from("cases").delete().eq("id", ids.liveBroken);
    await client.from("pages").delete().eq("id", ids.provisional);
    await client.from("services").delete().eq("id", ids.liveOk);
    await client.from("case_categories").delete().eq("id", ids.draftReady);
    await client.from("areas").delete().in("id", [ids.draftPending, ids.archived, ids.area].filter(Boolean));
    if (ids.cover) await client.from("media_assets").delete().eq("id", ids.cover);
    await deleteAccounts(client, Object.values(accounts));
  });

  const reviewQueue = (page: Page) => page.getByRole("region", { name: /Precisa de revisão/ });

  test("visitante é levado ao login e não recebe nada da visão geral", async ({ page, request }) => {
    const response = await request.get("/admin/conteudos", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
    expect(await response.text()).not.toContain(titles.draftPending);
    await page.goto("/admin/conteudos");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fconteudos$/);
    await expect(page.getByText(titles.draftPending)).toHaveCount(0);
    await expect(panelMenu(page)).toHaveCount(0);
  });

  test("conta pendente não entra; quem perde o acesso com a sessão aberta cai no aviso, sem menu nem conteúdo", async ({
    page,
  }) => {
    const pending = accounts.pending!;
    await submitLogin(page, pending);
    await expect(page.getByText("ainda não tem acesso liberado")).toBeVisible();
    await page.goto("/admin/conteudos");
    await expect(page).toHaveURL(/\/admin\/login/);

    await client.from("profiles").update({ role: "viewer" }).eq("id", pending.id);
    await login(page, pending);
    await client.from("profiles").update({ role: "pending" }).eq("id", pending.id);
    await page.goto("/admin/conteudos");
    await expect(page).toHaveURL(/\/admin\/acesso-pendente$/);
    await expect(page.getByText(titles.draftPending)).toHaveCount(0);
    await expect(panelMenu(page)).toHaveCount(0);
  });

  test("administrador navega pelo menu, com a página atual marcada e o que falta marcado como em construção", async ({
    page,
  }) => {
    await login(page, accounts.admin!);
    const menu = panelMenu(page);
    await expect(menu).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir menu" })).toBeHidden();
    await expect(menu.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");

    // Em construção: texto honesto, sem link, no menu e no início.
    const leads = menu.getByRole("listitem").filter({ hasText: "Leads e feedbacks" });
    await expect(leads).toContainText("Em construção");
    await expect(leads.getByRole("link")).toHaveCount(0);
    await expect(page.getByRole("main").getByText("Em construção · FORM-09")).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Leads e feedbacks" })).toHaveCount(0);

    // O início usa o mesmo registro do menu: o card inteiro leva ao módulo.
    await page.getByRole("main").getByRole("link", { name: "Serviços" }).click();
    await expect(page).toHaveURL(/\/admin\/servicos$/);
    await expect(menu.getByRole("link", { name: "Serviços" })).toHaveAttribute("aria-current", "page");
    await expect(menu.getByRole("link", { name: "Início" })).not.toHaveAttribute("aria-current", "page");

    await page.goto("/admin/cases/novo");
    await expect(menu.getByRole("link", { name: "Cases", exact: true })).toHaveAttribute("aria-current", "page");
  });

  test("administrador identifica o que está publicado e o que precisa de revisão", async ({ page }) => {
    await login(page, accounts.admin!);
    await panelMenu(page).getByRole("link", { name: "Visão geral dos conteúdos" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Visão geral dos conteúdos" })).toBeVisible();
    const queue = reviewQueue(page);

    // Rascunho com pendência, publicado quebrado e provisório entram, cada um com o motivo.
    const broken = queue.getByRole("listitem").filter({ hasText: titles.liveBroken }).first();
    await expect(broken).toContainText("Publicado");
    await expect(broken).toContainText("No ar com pendências:");
    await expect(broken.getByRole("link", { name: `Editar ${titles.liveBroken}` })).toHaveAttribute(
      "href",
      `/admin/cases/${ids.liveBroken}`,
    );
    const pending = queue.getByRole("listitem").filter({ hasText: titles.draftPending }).first();
    await expect(pending).toContainText("Rascunho");
    await expect(pending).toContainText("Para publicar, falta:");
    await expect(queue.getByText(/^Textos provisórios, sem outra pendência \(\d+\)$/)).toBeVisible();
    await queue.getByText(/^Textos provisórios, sem outra pendência/).click();
    await expect(queue.getByText("Aguardam aprovação da Benjamin.")).toBeVisible();
    const provisional = queue.getByRole("listitem").filter({ hasText: titles.provisional }).first();
    await expect(provisional).toContainText("Provisório");
    await expect(provisional.getByRole("link", { name: `Editar ${titles.provisional}` })).toHaveAttribute(
      "href",
      `/admin/paginas/${ids.provisional}`,
    );

    // Em dia, rascunho completo e arquivado ficam fora da fila.
    for (const title of [titles.liveOk, titles.draftReady, titles.archived]) {
      await expect(queue.getByText(title)).toHaveCount(0);
    }

    // Os grupos mostram tudo, com estado e link para abrir.
    const services = page.getByRole("region", { name: "Serviços", exact: true });
    const liveRow = services.getByRole("row").filter({ hasText: titles.liveOk });
    await expect(liveRow).toContainText("Publicado");
    await expect(liveRow).toContainText("Em dia");
    await expect(liveRow.getByRole("link", { name: titles.liveOk })).toHaveAttribute(
      "href",
      `/admin/servicos/${ids.liveOk}`,
    );
    const categories = page.getByRole("region", { name: "Categorias de cases", exact: true });
    await expect(categories.getByRole("row").filter({ hasText: titles.draftReady })).toContainText(
      "Pronto para publicar",
    );
    const areas = page.getByRole("region", { name: "Áreas de atuação", exact: true });
    await areas.getByText(/^Arquivados \(\d+\)$/).click();
    await expect(areas.getByRole("row").filter({ hasText: titles.archived })).toContainText("Arquivado");
  });

  test("editor autorizado completa o rascunho pela fila e o item sai dela", async ({ page }) => {
    await login(page, accounts.editor!);
    const menu = panelMenu(page);
    for (const hidden of ["Leads e feedbacks", "Usuários e papéis", "Trilha de auditoria"]) {
      await expect(menu.getByText(hidden)).toHaveCount(0);
    }
    await menu.getByRole("link", { name: "Visão geral dos conteúdos" }).click();
    await reviewQueue(page)
      .getByRole("link", { name: `Editar ${titles.draftPending}` })
      .click();
    await expect(page).toHaveURL(new RegExp(`/admin/areas/${ids.draftPending}$`));

    await visible(page.getByLabel("Resumo")).fill("Resumo completo da área de teste.");
    await visible(page.getByLabel("Descrição")).fill("Descrição completa da área usada no teste da visão geral.");
    await visible(page.getByRole("button", { name: "Salvar alterações" })).click();
    await expect(page.getByRole("status")).toContainText("Alterações salvas");

    await menu.getByRole("link", { name: "Visão geral dos conteúdos" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Visão geral dos conteúdos" })).toBeVisible();
    await expect(reviewQueue(page).getByText(titles.draftPending)).toHaveCount(0);
    await expect(
      page
        .getByRole("region", { name: "Áreas de atuação", exact: true })
        .getByRole("row")
        .filter({ hasText: titles.draftPending }),
    ).toContainText("Pronto para publicar");
  });

  test("leitor vê a fila só para consulta e não salva", async ({ page }) => {
    await login(page, accounts.viewer!);
    const menu = panelMenu(page);
    await expect(menu.getByRole("link", { name: "Cases", exact: true })).toBeVisible();
    await expect(menu.getByText("Leads e feedbacks")).toHaveCount(0);

    await page.goto("/admin/conteudos");
    const link = reviewQueue(page).getByRole("link", { name: `Ver ${titles.liveBroken}` });
    await expect(link).toBeVisible();
    await expect(reviewQueue(page).getByRole("link", { name: /^Editar / })).toHaveCount(0);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`/admin/cases/${ids.liveBroken}$`));
    await expect(visible(page.getByLabel("Título"))).toBeDisabled();
    await expect(visible(page.getByRole("button", { name: "Salvar alterações" }))).toHaveCount(0);
  });

  test("no celular o menu abre e fecha por toque e teclado, e o conteúdo não rola para o lado", async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      locale: "pt-BR",
      viewport: PHONE,
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    try {
      await login(page, accounts.admin!);
      const menu = panelMenu(page);
      const button = page.getByRole("button", { name: "Abrir menu" });
      await expect(menu).toBeHidden();
      await expect(button).toHaveAttribute("aria-expanded", "false");
      const box = await button.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);

      await openMenu(page);
      const closeButton = page.getByRole("button", { name: "Fechar menu" });
      await expect(closeButton).toHaveAttribute("aria-expanded", "true");
      await expect(menu.getByRole("link", { name: "Início" })).toHaveAttribute("aria-current", "page");
      for (const link of await menu.getByRole("link").all()) {
        expect((await link.boundingBox())!.height, await link.innerText()).toBeGreaterThanOrEqual(44);
      }
      const width = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(width[0]).toBeLessThanOrEqual(width[1]);

      // Fecha por toque, no próprio botão.
      await closeButton.tap();
      await expect(menu).toBeHidden();

      // Teclado: Enter abre, Tab entra no menu com foco visível, Esc fecha e devolve o foco.
      await button.focus();
      await page.keyboard.press("Enter");
      await expect(menu).toBeVisible();
      await page.keyboard.press("Tab");
      const first = menu.getByRole("link", { name: "Início" });
      await expect(first).toBeFocused();
      await expect(first).toHaveCSS("outline-style", "solid");
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(button).toBeFocused();

      // Escolher um módulo navega e fecha, inclusive quando é a página em que já se está.
      await openMenu(page);
      await menu.getByRole("link", { name: "Início" }).tap();
      await expect(menu).toBeHidden();
      await openMenu(page);
      await menu.getByRole("link", { name: "Visão geral dos conteúdos" }).tap();
      await expect(page).toHaveURL(/\/admin\/conteudos$/);
      await expect(menu).toBeHidden();
      await expect(page.getByRole("heading", { level: 1, name: "Visão geral dos conteúdos" })).toBeVisible();

      // Na fila, o link de edição cabe na largura da tela: basta rolar para baixo.
      const item = reviewQueue(page).getByRole("listitem").filter({ hasText: titles.liveBroken }).first();
      const edit = item.getByRole("link", { name: `Editar ${titles.liveBroken}` });
      await edit.scrollIntoViewIfNeeded();
      const editBox = (await edit.boundingBox())!;
      expect(editBox.x).toBeGreaterThanOrEqual(0);
      expect(editBox.x + editBox.width).toBeLessThanOrEqual(PHONE.width);
      await edit.tap();
      await expect(page).toHaveURL(new RegExp(`/admin/cases/${ids.liveBroken}$`));
      await expect(page.getByRole("heading", { level: 1, name: titles.liveBroken })).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    } finally {
      await context.close();
    }
  });

  test("no celular o editor salva, publica e despublica por toque", async ({ browser }, testInfo) => {
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      locale: "pt-BR",
      viewport: PHONE,
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    try {
      await login(page, accounts.editor!);
      await openMenu(page);
      await panelMenu(page).getByRole("link", { name: "Áreas de atuação" }).tap();
      await expect(page).toHaveURL(/\/admin\/areas$/);
      await page.getByRole("link", { name: titles.draftPending }).tap();
      await expect(page).toHaveURL(new RegExp(`/admin/areas/${ids.draftPending}$`));

      await visible(page.getByLabel("Resumo")).fill("Resumo revisado no celular, por toque.");
      await visible(page.getByRole("button", { name: "Salvar alterações" })).tap();
      await expect(page.getByRole("status")).toContainText("Alterações salvas");

      await visible(page.getByRole("button", { name: "Publicar", exact: true })).tap();
      await expect(page.getByRole("status")).toContainText("Publicado");

      page.once("dialog", (dialog) => dialog.accept());
      await visible(page.getByRole("button", { name: "Despublicar" })).tap();
      await expect(page.getByRole("status")).toContainText("Despublicado");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    } finally {
      await context.close();
    }
  });

  test("o menu e as listas não disparam prefetch, que validaria a sessão a cada link", async ({ page }) => {
    await login(page, accounts.admin!);
    const prefetches: string[] = [];
    page.on("request", (request) => {
      if (request.headers()["next-router-prefetch"]) prefetches.push(request.url());
    });
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto("/admin/conteudos");
    await expect(page.getByRole("heading", { level: 1, name: "Visão geral dos conteúdos" })).toBeVisible();
    // O Next dispara os prefetches logo depois de hidratar, ao ver os links na tela.
    await expect(page.getByRole("button", { name: "Sair" })).toBeEnabled();
    await page.waitForLoadState("networkidle");
    expect(prefetches).toEqual([]);
  });

  test("no desktop o teclado alcança o atalho para o conteúdo e o menu, com foco visível", async ({ page }) => {
    await login(page, accounts.admin!);
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Pular para o conteúdo" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();

    // Tab segue pelo cabeçalho (marca e Sair) até o primeiro link do menu.
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Painel · Agência Benjamin" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Sair" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Sair" })).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Tab");
    const first = panelMenu(page).getByRole("link", { name: "Início" });
    await expect(first).toBeFocused();
    await expect(first).toHaveCSS("outline-style", "solid");

    // O atalho leva o foco ao conteúdo, sem passar de novo pelo menu.
    await skip.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("main")).toBeFocused();
  });
});
