/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : jornada-home-vazia.spec.ts
 Descrição    : Home sem nenhum CTA e sem destaque publicados: não quebra nem mostra bloco vazio.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (HOME-07).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";
import { acceptConfirmation } from "./painel-helpers";

/**
 * Tira da Home TODOS os CTAs e destaques, inclusive os do seed, e devolve ao fim. Por mexer no
 * conteúdo de todos, tem etiqueta própria (`@home-global`, sem `@cms`): `npm run test:e2e:cms` roda
 * esta jornada depois das demais, com um worker só. Com `--repeat-each` continua valendo.
 */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
const PUBLISH_BUDGET_MS = 5_000; // ADR-0006: publicação reflete no site em até 5 s
const READ_TIMEOUT_MS = 500;
const CLOSING_TITLE = "Tem um projeto em mente?";

const visible = (locator: Locator) => locator.filter({ visible: true });

test.describe("Home sem CTA e sem destaque @home-global", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "Painel no celular é avaliado em ADM-16.");

  const suffix = randomBytes(3).toString("hex");
  const account = { email: `home-vazia-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-ed1`, id: "" };
  const original = {
    ctas: [] as { id: string; label: string; placement: string }[],
    featuredServices: [] as string[],
    featuredCases: [] as string[],
    /** Serviço publicado usado para renovar o cache de serviços, cases e CTAs pelo painel. */
    anyService: "",
  };
  let admin: SupabaseClient;
  let changed = false;

  const login = async (page: Page) => {
    await page.goto("/admin/login");
    // O login troca o formulário de fallback pelo definitivo ao terminar de carregar (B-08).
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Senha").fill(account.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  };

  const expectOnHome = async (page: Page, check: (tab: Page, options: { timeout: number }) => Promise<void>) => {
    const visitor = await page.context().browser()!.newContext();
    const tab = await visitor.newPage();
    await expect(async () => {
      const response = await tab.goto("/");
      expect(response?.status()).toBe(200);
      await check(tab, { timeout: READ_TIMEOUT_MS });
    }).toPass({ timeout: PUBLISH_BUDGET_MS });
    await visitor.close();
  };

  const ctasFromApi = async (page: Page, placement: string) => {
    const response = await page.request.get(`/api/v1/ctas?placement=${placement}`);
    expect(response.status()).toBe(200);
    return (await response.json()).data as unknown[];
  };

  /** Salvar um serviço publicado é o que o editor faria: renova o cache sem novo deploy. */
  const refreshCache = async (page: Page) => {
    await page.goto(`/admin/servicos/${original.anyService}`);
    await visible(page.getByRole("button", { name: "Salvar alterações" })).click();
    await expect(page.getByRole("status").getByText("Alterações salvas.")).toBeVisible();
  };

  const setFeatured = async (featured: boolean) => {
    await admin.from("services").update({ featured }).in("id", original.featuredServices);
    await admin.from("cases").update({ featured }).in("id", original.featuredCases);
  };

  /** Rede de segurança: teste que falhou no meio não deixa a base sem os botões e destaques do seed. */
  const restore = async (browser: Browser) => {
    await setFeatured(true);
    await admin
      .from("ctas")
      .update({ status: "published" })
      .in(
        "id",
        original.ctas.map((cta) => cta.id),
      );
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page);
    await refreshCache(page);
    await context.close();
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

    original.ctas =
      (
        await admin
          .from("ctas")
          .select("id, label, placement")
          .eq("status", "published")
          .in("placement", ["home-hero", "home-highlight"])
          .order("sort_order")
      ).data ?? [];
    const services =
      (await admin.from("services").select("id, featured").eq("status", "published").order("sort_order")).data ?? [];
    original.featuredServices = services.filter((service) => service.featured).map((service) => service.id);
    original.anyService = services[0].id;
    original.featuredCases =
      (await admin.from("cases").select("id").eq("featured", true)).data?.map(({ id }) => id) ?? [];
    expect(original.ctas.length, "o seed publica CTAs na Home").toBeGreaterThan(0);
    expect(original.featuredServices.length, "o seed destaca serviços").toBeGreaterThan(0);
  });

  test.afterAll(async ({ browser }) => {
    if (changed) await restore(browser);
    if (account.id) await admin.auth.admin.deleteUser(account.id);
  });

  test("sem nenhum CTA publicado, a Home fica de pé, sem caixa vazia e sem convite sem botão", async ({ page }) => {
    await login(page);
    changed = true;
    for (const cta of original.ctas) {
      await page.goto(`/admin/ctas/${cta.id}`);
      await page.getByRole("button", { name: "Despublicar" }).click();
      await acceptConfirmation(page, "Despublicar");
      await expect(page.getByRole("status").getByText("Despublicado")).toBeVisible();
    }

    await expectOnHome(page, async (tab, options) => {
      await expect(tab.getByRole("heading", { level: 1 })).toBeVisible(options);
      await expect(tab.locator('[data-motion="intro-cta"]')).toHaveCount(0, options);
      await expect(tab.getByRole("heading", { name: CLOSING_TITLE })).toHaveCount(0, options);
      // O restante da Home e os caminhos fixos continuam.
      await expect(tab.getByRole("link", { name: "Ver todos os serviços" })).toBeVisible(options);
    });
    expect(await ctasFromApi(page, "home-hero")).toEqual([]);
    expect(await ctasFromApi(page, "home-highlight")).toEqual([]);

    // O painel explica o que isso causa no site.
    await page.goto("/admin/ctas");
    await expect(page.getByText("o topo da Home fica só com o manifesto")).toBeVisible();
    await expect(page.getByText("a faixa final da Home não aparece")).toBeVisible();
  });

  test("publicar um CTA de cada posição devolve os dois blocos", async ({ page }) => {
    await login(page);
    for (const cta of original.ctas) {
      await page.goto(`/admin/ctas/${cta.id}`);
      await page.getByRole("button", { name: "Publicar" }).click();
      await expect(page.getByRole("status").getByText("Publicado.")).toBeVisible();
    }
    await expectOnHome(page, async (tab, options) => {
      const labels = (placement: string) =>
        original.ctas.filter((cta) => cta.placement === placement).map((cta) => cta.label);
      // Por bloco: o cabeçalho do site tem links fixos que podem repetir o mesmo texto.
      await expect(tab.locator('[data-motion="intro-cta"]').getByRole("link")).toHaveText(labels("home-hero"), options);
      const closing = tab.locator("section", { has: tab.getByRole("heading", { name: CLOSING_TITLE }) });
      await expect(closing.getByRole("link")).toHaveText(labels("home-highlight"), options);
    });
  });

  test("sem destaque, serviços e cases avisam em vez de ficar em branco", async ({ page }) => {
    await login(page);
    await setFeatured(false);
    await refreshCache(page);
    await expectOnHome(page, async (tab, options) => {
      await expect(tab.getByText("Os serviços em destaque estão sendo atualizados")).toBeVisible(options);
      await expect(tab.getByText("Os primeiros cases estão sendo preparados")).toBeVisible(options);
      await expect(tab.getByRole("link", { name: "Ver portfólio completo" })).toBeVisible(options);
    });
    await page.goto("/admin/ctas");
    await expect(page.getByText("Nenhum serviço em destaque")).toBeVisible();
    await expect(page.getByText("Nenhum case em destaque")).toBeVisible();
  });

  test("devolver os destaques traz as listas de volta, sem deploy", async ({ page }) => {
    await login(page);
    await setFeatured(true);
    await refreshCache(page);
    changed = false;
    await expectOnHome(page, async (tab, options) => {
      await expect(tab.getByText("Os serviços em destaque estão sendo atualizados")).toHaveCount(0, options);
      await expect(tab.getByText("Os primeiros cases estão sendo preparados")).toHaveCount(0, options);
    });
  });
});
