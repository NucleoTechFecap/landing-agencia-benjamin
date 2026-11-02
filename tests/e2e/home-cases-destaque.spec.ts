/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : home-cases-destaque.spec.ts
 Descrição    : Cases em destaque da Home: navegação e o que o painel publica.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Testes de aceite dos cases em destaque (HOME-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Locator, type Page } from "@playwright/test";

/** Seção de cases em destaque da Home: leitura, navegação e o que o painel publica (HOME-04). */
const section = (page: Page) => page.getByRole("region", { name: "Trabalhos que saíram do briefing" });

test.describe("Home · cases em destaque", () => {
  test("mostra cases com capa, cliente e acesso ao detalhe, sem rolagem lateral", async ({ page }) => {
    await page.goto("/");
    const cards = section(page).locator("article");
    await expect(cards.first()).toBeVisible();
    await expect(cards.first().getByRole("img")).toBeVisible();

    const link = cards.first().getByRole("link");
    const title = (await link.textContent())!;
    await link.click();
    await expect(page).toHaveURL(/\/cases\/[a-z0-9-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("o botão leva ao portfólio completo", async ({ page }) => {
    await page.goto("/");
    await section(page).getByRole("link", { name: "Ver portfólio completo" }).click();
    await expect(page).toHaveURL(/\/cases$/);
  });
});

const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
const PUBLISH_BUDGET_MS = 5_000; // ADR-0006: publicação reflete no site em até 5 s
const visible = (locator: Locator) => locator.filter({ visible: true });

test.describe("Home · destaque publicado pelo painel @cms", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "Painel no celular é avaliado em ADM-16.");

  const suffix = Math.random().toString(36).slice(2, 8);
  const account = { email: `home-editor-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-ed1`, id: "" };
  const title = `Case destaque ${suffix}`;
  const coverPath = "/brand/cases/fecap.webp";
  const ids = { case: "", service: "", category: "", media: "" };
  let createdMedia = false;
  let admin: SupabaseClient;

  const onHome = async (page: Page, present: boolean) => {
    const visitor = await page.context().browser()!.newContext();
    const tab = await visitor.newPage();
    await expect(async () => {
      await tab.goto("/");
      const count = await section(tab).getByRole("link", { name: title }).count();
      expect(count).toBe(present ? 1 : 0);
    }).toPass({ timeout: PUBLISH_BUDGET_MS });
    await visitor.close();
  };

  test.beforeAll(async () => {
    admin = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } });
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
    });
    if (error) throw error;
    account.id = data.user.id;
    await admin.from("profiles").update({ role: "editor", full_name: "E2E editor" }).eq("id", account.id);

    const published = { status: "published", published_at: new Date(Date.now() - 86_400_000).toISOString() };
    const insert = async (table: string, values: Record<string, unknown>) => {
      const { data: row, error: failure } = await admin.from(table).insert(values).select("id").single();
      if (failure) throw failure;
      return row.id as string;
    };
    ids.service = await insert("services", {
      ...published,
      slug: `servico-home-${suffix}`,
      name: `Serviço Home ${suffix}`,
      summary: "Resumo do serviço de teste.",
      description: "Descrição do serviço usado no teste da Home.",
    });
    ids.category = await insert("case_categories", {
      ...published,
      slug: `categoria-home-${suffix}`,
      name: `Categoria Home ${suffix}`,
    });
    const existing = (await admin.from("media_assets").select("id").eq("path", coverPath).maybeSingle()).data;
    createdMedia = !existing;
    ids.media =
      existing?.id ??
      (await insert("media_assets", {
        path: coverPath,
        mime_type: "image/webp",
        width: 1200,
        height: 750,
        alt_text: "Capa provisória do case FECAP",
      }));
    // Rascunho completo e marcado como destaque: só a publicação pode levá-lo à Home.
    ids.case = await insert("cases", {
      slug: `case-home-${suffix}`,
      title,
      client_name: "Cliente de teste",
      category_id: ids.category,
      summary: "Resumo do case usado no teste da seção de destaques da Home.",
      cover_media_id: ids.media,
      featured: true,
    });
    const { error: linkError } = await admin
      .from("case_services")
      .insert({ case_id: ids.case, service_id: ids.service });
    if (linkError) throw linkError;
  });

  test.afterAll(async () => {
    if (ids.case) await admin.from("cases").delete().eq("id", ids.case);
    if (ids.category) await admin.from("case_categories").delete().eq("id", ids.category);
    if (ids.service) await admin.from("services").delete().eq("id", ids.service);
    if (createdMedia) await admin.from("media_assets").delete().eq("id", ids.media);
    if (account.id) await admin.auth.admin.deleteUser(account.id);
  });

  test("rascunho em destaque fica fora; publicado aparece; despublicado sai", async ({ page }) => {
    await onHome(page, false);

    await page.goto("/admin/login");
    // O login troca o formulário de fallback pelo definitivo ao terminar de carregar (B-08).
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Senha").fill(account.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto(`/admin/cases/${ids.case}`);
    await visible(page.getByRole("button", { name: "Publicar" })).click();
    await expect(page.getByRole("status").getByText("Publicado.")).toBeVisible();
    await onHome(page, true);

    await page.goto(`/admin/cases/${ids.case}`);
    page.once("dialog", (dialog) => dialog.accept());
    await visible(page.getByRole("button", { name: "Despublicar" })).click();
    await expect(page.getByRole("status").getByText("Despublicado")).toBeVisible();
    await onHome(page, false);
  });
});
