/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : jornada-site-cms.spec.ts
 Descrição    : Jornada do painel ao site: Home e Sobre refletem o que foi publicado.

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
 01/11/2026 Vinícius Nishimura Reis  Site lê páginas e blocos publicados no CMS (INT-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * O que o editor publica no painel aparece no site, sem deploy (INT-03). Precisa do app construído
 * contra o Supabase local: rode `npm run test:e2e:cms`. As rotas são fixas e a leitura fica no
 * cache do Next entre rodadas: por isso a jornada termina despublicando pelo painel.
 */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
const PUBLISH_BUDGET_MS = 5_000; // ADR-0006: publicação reflete no site em até 5 s

const visible = (locator: Locator) => locator.filter({ visible: true });

test.describe("Painel → site · Home e Sobre @cms", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "Painel no celular é avaliado em ADM-16.");

  const suffix = Math.random().toString(36).slice(2, 8);
  const account = { email: `site-editor-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-ed1`, id: "" };
  const manifesto = `Manifesto ${suffix}`;
  const sobre = `Sobre ${suffix}`;
  const bloco = `Bloco ${suffix}`;
  let admin: SupabaseClient;
  const editors: Record<string, string> = {};

  const login = async (page: Page) => {
    await page.goto("/admin/login");
    // O login troca o formulário de fallback pelo definitivo ao terminar de carregar (B-08).
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Senha").fill(account.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  };

  const createPage = async (page: Page, label: string) => {
    await page.goto("/admin/paginas");
    await page.getByRole("link", { name: `Criar conteúdo da página ${label}` }).click();
    await visible(page.getByRole("button", { name: "Criar rascunho" })).click();
    await expect(page.getByRole("status").getByText("Rascunho criado.")).toBeVisible();
    return page.url().split("?")[0];
  };

  const addBlock = async (page: Page, editor: string, type: string, fields: Record<string, string>) => {
    await page.goto(`${editor}/blocos/novo?tipo=${type}`);
    for (const [label, value] of Object.entries(fields)) await visible(page.getByLabel(label)).fill(value);
    await visible(page.getByRole("button", { name: "Adicionar bloco" })).click();
    await expect(page.getByRole("status").getByText("Alterações salvas.")).toBeVisible();
  };

  const publish = async (page: Page, editor: string) => {
    await page.goto(editor);
    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(page.getByRole("status").getByText("Publicado.")).toBeVisible();
  };

  const unpublish = async (page: Page, editor: string) => {
    await page.goto(editor);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Despublicar" }).click();
    await expect(page.getByRole("status").getByText("Despublicado")).toBeVisible();
  };

  /** Abre a rota em aba própria, como o visitante, até o texto aparecer dentro do prazo. */
  const expectOnSite = async (page: Page, path: string, text: string, present = true) => {
    const visitor = await page.context().browser()!.newContext();
    const tab = await visitor.newPage();
    await expect(async () => {
      await tab.goto(path);
      await (present ? expect(tab.getByText(text).first()).toBeVisible() : expect(tab.getByText(text)).toHaveCount(0));
    }).toPass({ timeout: PUBLISH_BUDGET_MS });
    await visitor.close();
  };

  test.beforeAll(async () => {
    admin = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } });
    await admin.from("pages").delete().in("slug", ["home", "sobre"]);
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
    });
    if (error) throw error;
    account.id = data.user.id;
    await admin.from("profiles").update({ role: "editor", full_name: "E2E editor" }).eq("id", account.id);
  });

  test.afterAll(async () => {
    await admin.from("pages").delete().in("slug", ["home", "sobre"]);
    if (account.id) await admin.auth.admin.deleteUser(account.id);
  });

  test("manifesto em rascunho não aparece; publicado, vira o topo da Home", async ({ page }) => {
    await login(page);
    editors.home = await createPage(page, "Home");
    await addBlock(page, editors.home, "manifesto", { Título: manifesto, Parágrafos: "Texto do painel." });
    await expectOnSite(page, "/", manifesto, false);

    await publish(page, editors.home);
    await expectOnSite(page, "/", manifesto);
  });

  test("Sobre publicado muda a página Sobre e o bloco Quem é a Benjamin da Home", async ({ page }) => {
    await login(page);
    editors.sobre = await createPage(page, "Sobre");
    await addBlock(page, editors.sobre, "about", {
      Título: sobre,
      "Quem somos": "Quem somos, pelo painel.",
      "Proposta de valor": "Proposta, pelo painel.",
      "Modelo de atuação": "Modelo, pelo painel.",
      "Relação com a FECAP": "FECAP, pelo painel.",
    });
    await publish(page, editors.sobre);
    await expectOnSite(page, "/sobre", "Proposta, pelo painel.");
    await expectOnSite(page, "/sobre", "FECAP, pelo painel.");
    await expectOnSite(page, "/", "Modelo, pelo painel.");
  });

  test("bloco acrescentado a uma página publicada entra depois das seções fixas", async ({ page }) => {
    await login(page);
    await addBlock(page, editors.sobre, "rich-text", { Título: bloco, Parágrafos: "Parágrafo extra." });
    await expectOnSite(page, "/sobre", bloco);

    const visitor = await page.context().browser()!.newContext();
    const tab = await visitor.newPage();
    await tab.goto("/sobre");
    const order = await tab
      .locator("h2")
      .evaluateAll((headings) => headings.map((heading) => heading.textContent ?? ""));
    await visitor.close();
    expect(order.indexOf(bloco)).toBeGreaterThan(order.indexOf("Seis áreas que trabalham juntas"));
    expect(order.indexOf(bloco)).toBeLessThan(order.indexOf("Quer construir algo com a gente?"));
  });

  test("texto marcado como provisório mostra o selo no site", async ({ page }) => {
    await login(page);
    const visitor = await page.context().browser()!.newContext();
    const tab = await visitor.newPage();
    await tab.goto("/");
    await expect(tab.locator("section", { hasText: manifesto }).getByText("Conteúdo provisório")).toBeVisible();
    await visitor.close();
  });

  test("despublicar devolve os textos anteriores, e o site não quebra", async ({ page }) => {
    await login(page);
    await unpublish(page, editors.home);
    await unpublish(page, editors.sobre);
    await expectOnSite(page, "/", manifesto, false);
    await expectOnSite(page, "/sobre", bloco, false);
    await expectOnSite(page, "/sobre", "Proposta, pelo painel.", false);
    await expectOnSite(page, "/sobre", "Como a Benjamin funciona");
  });
});
