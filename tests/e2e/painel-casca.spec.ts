/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : painel-casca.spec.ts
 Descrição    : Jornadas da casca do painel: início por papel, menu recolhido, listas e confirmações.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (reestruturação do painel).
──────────────────────────────────────────────────────────────────────────────
*/

import type { SupabaseClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";
import {
  REQUIRES_SUPABASE,
  SERVICE_KEY,
  SUPABASE_URL,
  createAccount,
  deleteAccounts,
  login,
  newSuffix,
  panelMenu,
  serviceClient,
  type Account,
  type PanelRole,
} from "./painel-helpers";

const PAST = "2026-10-01T12:00:00.000Z";

test.describe("Painel · casca, início e listas @cms", () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY, REQUIRES_SUPABASE);
  test.skip(({ isMobile }) => isMobile, "A largura é a do desktop: a gaveta do celular tem teste próprio.");

  const suffix = newSuffix();
  const titles = { published: `Case vitrine ${suffix}`, draft: `Rascunho ótimo ${suffix}` };
  const accounts: Partial<Record<PanelRole, Account>> = {};
  const caseIds: string[] = [];
  let client: SupabaseClient;
  let categoryId = "";
  let coverId = "";

  test.beforeAll(async () => {
    client = serviceClient();
    for (const role of ["admin", "editor", "viewer"] as const) {
      accounts[role] = await createAccount(client, role, suffix);
    }
    const category = await client
      .from("case_categories")
      .insert({ slug: `casca-${suffix}`, name: `Categoria da casca ${suffix}` })
      .select("id")
      .single();
    if (category.error) throw category.error;
    categoryId = category.data.id as string;
    const cover = await client
      .from("media_assets")
      .insert({
        path: `e2e/casca-${suffix}.webp`,
        mime_type: "image/webp",
        width: 1200,
        height: 750,
        alt_text: "Capa fictícia do teste",
      })
      .select("id")
      .single();
    if (cover.error) throw cover.error;
    coverId = cover.data.id as string;
    const rows = [
      {
        slug: `vitrine-${suffix}`,
        title: titles.published,
        status: "published",
        published_at: PAST,
        client_name: "Cliente fictício",
        summary: "Resumo fictício do case publicado no teste da casca.",
        category_id: categoryId,
        cover_media_id: coverId,
      },
      { slug: `rascunho-${suffix}`, title: titles.draft, status: "draft" },
    ];
    const { data, error } = await client.from("cases").insert(rows).select("id");
    if (error) throw error;
    caseIds.push(...data.map((row) => row.id as string));
  });

  test.afterAll(async () => {
    if (!client) return;
    await client.from("cases").delete().in("id", caseIds);
    if (categoryId) await client.from("case_categories").delete().eq("id", categoryId);
    if (coverId) await client.from("media_assets").delete().eq("id", coverId);
    await deleteAccounts(client, Object.values(accounts));
  });

  test("o início só oferece o que o papel pode fazer e só mostra envios a quem pode lê-los", async ({ page }) => {
    await login(page, accounts.admin!);
    const main = page.getByRole("main");
    await expect(main.getByRole("heading", { level: 1, name: /Benjamin Studio/ })).toBeVisible();
    await expect(main.getByRole("region", { name: "Caixa de entrada" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Novo case" })).toHaveAttribute("href", "/admin/cases/novo");
    await expect(main.getByRole("link", { name: "Atualizar informações" })).toBeVisible();
    await expect(main.getByRole("region", { name: "Como está o conteúdo" }).getByRole("listitem")).toHaveCount(5);
    await page.context().clearCookies();

    await login(page, accounts.editor!);
    await expect(main.getByRole("link", { name: "Novo case" })).toBeVisible();
    await expect(main.getByRole("link", { name: "Atualizar informações" })).toHaveCount(0);
    await expect(main.getByRole("region", { name: "Caixa de entrada" })).toHaveCount(0);
    await page.context().clearCookies();

    await login(page, accounts.viewer!);
    await expect(main.getByRole("link", { name: /Ver site publicado/ })).toBeVisible();
    await expect(main.getByRole("link", { name: "Novo case" })).toHaveCount(0);
    await expect(main.getByRole("link", { name: "Gerenciar serviços" })).toHaveCount(0);
  });

  test("os conteúdos recentes levam à edição do item alterado", async ({ page }) => {
    const [id] = caseIds;
    await client.from("cases").update({ summary: "Resumo alterado no teste do início do painel." }).eq("id", id!);
    await login(page, accounts.admin!);
    const recent = page.getByRole("region", { name: "Conteúdos recentes" });
    await expect(recent.getByRole("link", { name: new RegExp(titles.published) })).toHaveAttribute(
      "href",
      `/admin/cases/${id}`,
    );
  });

  test("recolher o menu mantém os nomes acessíveis, mostra a dica e vale ao recarregar", async ({ page }) => {
    await login(page, accounts.admin!);
    const menu = panelMenu(page);
    await page.getByRole("button", { name: "Recolher menu" }).click();
    const services = menu.getByRole("link", { name: "Serviços" });
    await expect(services).toBeVisible();
    await services.hover();
    await expect(page.getByRole("tooltip")).toHaveText("Serviços");
    await page.reload();
    await expect(page.getByRole("button", { name: "Expandir menu" })).toBeVisible();
    await page.getByRole("button", { name: "Expandir menu" }).click();
    await expect(page.getByRole("button", { name: "Recolher menu" })).toBeVisible();
  });

  test("a lista de cases busca, filtra por estado e troca entre cartões e tabela", async ({ page }) => {
    await login(page, accounts.admin!);
    await page.goto("/admin/cases");
    const main = page.locator("#conteudo");
    const published = main.getByRole("link", { name: titles.published });
    const draft = main.getByRole("link", { name: titles.draft });
    await expect(published).toBeVisible();
    await expect(draft).toBeVisible();

    // Sem acento e sem caixa: "otimo" encontra "ótimo".
    await main.getByLabel("Buscar case").fill(`otimo ${suffix}`);
    await expect(draft).toBeVisible();
    await expect(published).toHaveCount(0);

    await main.getByLabel("Buscar case").fill(suffix);
    await main.getByLabel("Estado").selectOption("published");
    await expect(published).toBeVisible();
    await expect(draft).toHaveCount(0);

    await main.getByLabel("Estado").selectOption("");
    await main.getByRole("button", { name: "Tabela" }).click();
    await expect(main.getByRole("table")).toBeVisible();
    await expect(main.getByRole("link", { name: titles.published })).toBeVisible();
    await page.reload();
    await expect(main.getByRole("button", { name: "Tabela" })).toHaveAttribute("aria-pressed", "true");
    await main.getByRole("button", { name: "Cartões" }).click();
    await expect(main.getByRole("table")).toHaveCount(0);
  });

  test("sair de um formulário alterado pede confirmação; cancelar mantém o que foi digitado", async ({ page }) => {
    await login(page, accounts.admin!);
    await page.goto("/admin/categorias/nova");
    const name = page.locator("#conteudo").getByLabel("Nome");
    await expect(name).toBeEditable();
    const typed = `Digitado e não salvo ${suffix}`;
    await name.fill(typed);
    await expect(page.getByText("Alterações não salvas")).toBeVisible();

    const services = panelMenu(page).getByRole("link", { name: "Serviços" });
    await services.click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toContainText("Sair sem salvar?");
    await expect(page).toHaveURL(/\/admin\/categorias\/nova$/);
    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(name).toHaveValue(typed);

    await services.click();
    await dialog.getByRole("button", { name: "Sair sem salvar" }).click();
    await expect(page).toHaveURL(/\/admin\/servicos$/);
  });

  test("Esc fecha a confirmação sem enviar nada", async ({ page }) => {
    await login(page, accounts.admin!);
    const [, id] = caseIds;
    await page.goto(`/admin/cases/${id}`);
    const archive = page.getByRole("button", { name: "Arquivar" });
    await expect(archive).toBeEnabled();
    await archive.click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toContainText("Arquivar este item?");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    const { data } = await client.from("cases").select("status").eq("id", id!).single();
    expect(data?.status).toBe("draft");
  });
});
