/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : home-cases-em-destaque.spec.ts
 Descrição    : Cases em destaque da Home: bloco em celular e desktop, e coerência com o painel.

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
 01/11/2026 Vinícius Nishimura Reis  Sufixo de teste com node:crypto (CodeQL).
 01/11/2026 Vinícius Nishimura Reis  Espera curta para o toPass recarregar a página (HOME-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * Cases em destaque da Home (HOME-04): o bloco em celular e desktop, com o conteúdo versionado, e
 * a coerência com o que é publicado no painel, que precisa do Supabase local (`npm run test:e2e:cms`).
 */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
const PUBLISH_BUDGET_MS = 5_000; // ADR-0006: publicação reflete no site em até 5 s
const READ_TIMEOUT_MS = 500;

const visible = (locator: Locator) => locator.filter({ visible: true });
const section = (page: Page) =>
  page.locator("section", { has: page.getByRole("heading", { name: "Trabalhos que saíram do briefing" }) });

test.describe("Home · cases em destaque", () => {
  test.skip(() => Boolean(SUPABASE_URL), "Com o Supabase local, a massa é a do banco: vale a jornada @cms abaixo.");

  test("cada card tem imagem, resumo e leva ao detalhe do case", async ({ page }) => {
    await page.goto("/");
    const cards = section(page).locator("article");
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeLessThanOrEqual(6);
    for (let index = 0; index < count; index++) {
      await expect(cards.nth(index).getByRole("img")).toHaveAttribute("alt", /\S/);
      await expect(cards.nth(index).getByRole("link")).toHaveAttribute("href", /^\/cases\/[a-z0-9-]+$/);
    }
    const title = await cards.first().getByRole("link").textContent();
    await cards.first().getByRole("link").click();
    await expect(page).toHaveURL(/\/cases\/[a-z0-9-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title!);
  });

  test("a chamada leva ao portfólio completo, também pelo teclado", async ({ page }) => {
    await page.goto("/");
    const link = section(page).getByRole("link", { name: "Ver portfólio completo" });
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/cases$/);
  });

  test("não causa rolagem lateral", async ({ page }) => {
    await page.goto("/");
    await section(page).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});

test.describe("Home · cases em destaque no painel @cms", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "Painel no celular é avaliado em ADM-16.");

  const suffix = randomBytes(3).toString("hex");
  const account = { email: `home-editor-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-ed1`, id: "" };
  const title = `Case em destaque ${suffix}`;
  const renamed = `Case renomeado ${suffix}`;
  const coverPath = "/brand/cases/fecap.webp";
  const ids = { service: "", category: "", media: "", case: "" };
  let admin: SupabaseClient;
  let createdMedia = false;

  const login = async (page: Page) => {
    await page.goto("/admin/login");
    // O login troca o formulário de fallback pelo definitivo ao terminar de carregar (B-08).
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Senha").fill(account.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  };

  /** Abre a Home em aba própria, como o visitante, até o texto aparecer (ou sumir) dentro do prazo. */
  const expectOnHome = async (page: Page, text: string, present = true) => {
    const visitor = await page.context().browser()!.newContext();
    const tab = await visitor.newPage();
    await expect(async () => {
      await tab.goto("/");
      const card = section(tab).getByText(text);
      // Espera curta: a página já carregada não muda. Quem precisa olhar de novo é o toPass, recarregando.
      const onPage = { timeout: READ_TIMEOUT_MS };
      await (present ? expect(card).toBeVisible(onPage) : expect(card).toHaveCount(0, onPage));
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
    ids.service = (
      await admin
        .from("services")
        .insert({
          ...published,
          slug: `servico-home-${suffix}`,
          name: `Serviço Home ${suffix}`,
          summary: "Resumo do serviço usado no teste da Home.",
          description: "Descrição do serviço usado no teste dos cases em destaque.",
        })
        .select("id")
        .single()
    ).data!.id;
    ids.category = (
      await admin
        .from("case_categories")
        .insert({ ...published, slug: `categoria-home-${suffix}`, name: `Categoria Home ${suffix}` })
        .select("id")
        .single()
    ).data!.id;
    // O caminho é único na biblioteca: reaproveita o registro e só apaga no fim o que criou aqui.
    const existing = (await admin.from("media_assets").select("id").eq("path", coverPath).maybeSingle()).data;
    ids.media =
      existing?.id ??
      (
        await admin
          .from("media_assets")
          .insert({
            path: coverPath,
            mime_type: "image/webp",
            width: 1200,
            height: 750,
            alt_text: "Capa provisória do case FECAP",
          })
          .select("id")
          .single()
      ).data!.id;
    createdMedia = !existing;
    // Rascunho completo e já marcado como destaque: só falta publicar.
    ids.case = (
      await admin
        .from("cases")
        .insert({
          slug: `case-home-${suffix}`,
          title,
          client_name: "Cliente da Home",
          category_id: ids.category,
          summary: "Resumo do case usado para testar os destaques da Home.",
          cover_media_id: ids.media,
          featured: true,
        })
        .select("id")
        .single()
    ).data!.id;
    await admin.from("case_services").insert({ case_id: ids.case, service_id: ids.service });
  });

  test.afterAll(async () => {
    await admin.from("cases").delete().eq("id", ids.case);
    await admin.from("case_categories").delete().eq("id", ids.category);
    await admin.from("services").delete().eq("id", ids.service);
    if (createdMedia) await admin.from("media_assets").delete().eq("id", ids.media);
    if (account.id) await admin.auth.admin.deleteUser(account.id);
  });

  test("rascunho marcado como destaque não aparece na Home", async ({ page }) => {
    await expectOnHome(page, title, false);
  });

  test("publicado no painel, aparece na Home com acesso ao detalhe", async ({ page }) => {
    await login(page);
    await page.goto(`/admin/cases/${ids.case}`);
    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(page.getByRole("status").getByText("Publicado.")).toBeVisible();
    await expectOnHome(page, title);

    const visitor = await page.context().browser()!.newContext();
    const tab = await visitor.newPage();
    await tab.goto("/");
    await section(tab).getByRole("link", { name: title }).click();
    await expect(tab).toHaveURL(new RegExp(`/cases/case-home-${suffix}$`));
    await visitor.close();
  });

  test("o título editado no painel chega à Home", async ({ page }) => {
    await login(page);
    await page.goto(`/admin/cases/${ids.case}`);
    await visible(page.getByLabel("Título")).fill(renamed);
    await visible(page.getByRole("button", { name: "Salvar alterações" })).click();
    await expect(page.getByRole("status").getByText("Alterações salvas.")).toBeVisible();
    await expectOnHome(page, renamed);
    await expectOnHome(page, title, false);
  });

  test("arquivado, sai da Home", async ({ page }) => {
    await login(page);
    await page.goto(`/admin/cases/${ids.case}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Arquivar" }).click();
    await expect(page.getByRole("status").getByText("Arquivado")).toBeVisible();
    await expectOnHome(page, renamed, false);
  });
});
