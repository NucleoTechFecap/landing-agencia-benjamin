/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : jornada-home-cms.spec.ts
 Descrição    : Jornada do painel à Home: CTAs e destaques refletidos sem deploy, com papéis reais.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-11, HOME-07).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * CTAs e destaques editados no painel chegam à Home sem deploy (ADM-11, HOME-07). Usa só dados
 * próprios, com sufixo: aguenta `--repeat-each` em paralelo. O que depende de a Home ficar sem
 * nenhum CTA ou destaque mexe no conteúdo de todos e fica em jornada-home-vazia.spec.ts.
 * Precisa do app construído contra o Supabase local: rode `npm run test:e2e:cms`.
 */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
const PUBLISH_BUDGET_MS = 5_000; // ADR-0006: publicação reflete no site em até 5 s
const READ_TIMEOUT_MS = 500;

const visible = (locator: Locator) => locator.filter({ visible: true });

type Role = "admin" | "editor" | "viewer" | "pending";

test.describe("Home · CTAs e destaques pelo painel @cms", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "Painel no celular é avaliado em ADM-16.");

  const suffix = randomBytes(3).toString("hex");
  const accountOf = (role: Role) => ({
    email: `home-cta-${role}-${suffix}@teste.local`,
    password: `Senha-e2e-${suffix}-${role}1`,
    id: "",
  });
  const accounts = {
    admin: accountOf("admin"),
    editor: accountOf("editor"),
    viewer: accountOf("viewer"),
    pending: accountOf("pending"),
  };
  const label = `Botão ${suffix}`;
  const renamed = `Renomeado ${suffix}`;
  const serviceName = `Serviço Home ${suffix}`;
  const serviceSlug = `servico-home-cta-${suffix}`;
  const ids = { service: "", cta: "" };
  let admin: SupabaseClient;

  const submitLogin = async (page: Page, role: Role) => {
    await page.goto("/admin/login");
    // O login troca o formulário de fallback pelo definitivo ao terminar de carregar (B-08).
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail").fill(accounts[role].email);
    await page.getByLabel("Senha").fill(accounts[role].password);
    await page.getByRole("button", { name: "Entrar" }).click();
  };

  const login = async (page: Page, role: Role = "editor") => {
    await submitLogin(page, role);
    await expect(page).toHaveURL(/\/admin$/);
  };

  /** O campo do destino depende da hidratação: antes dela, trocar o tipo não mostra o campo novo. */
  const chooseTarget = async (page: Page, kind: string, field: string) => {
    await expect(async () => {
      await visible(page.getByLabel("Tipo de destino")).selectOption(kind);
      await expect(visible(page.getByLabel(field))).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
  };

  const save = async (page: Page) => {
    await visible(page.getByRole("button", { name: "Salvar alterações" })).click();
    await expect(page.getByRole("status").getByText("Alterações salvas.")).toBeVisible();
  };

  const runCommand = async (page: Page, button: string, flash: string) => {
    // Só publicar não pede confirmação; um `once` que sobra responderia ao diálogo seguinte duas vezes.
    if (button !== "Publicar") page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(page.getByRole("status").getByText(flash)).toBeVisible();
  };

  /** Abre a Home em aba própria, como o visitante, até o que se espera aparecer dentro do prazo. */
  const expectOnHome = async (page: Page, check: (tab: Page, options: { timeout: number }) => Promise<void>) => {
    const visitor = await page.context().browser()!.newContext();
    const tab = await visitor.newPage();
    await expect(async () => {
      await tab.goto("/");
      // Espera curta: a página já carregada não muda. Quem precisa olhar de novo é o toPass, recarregando.
      await check(tab, { timeout: READ_TIMEOUT_MS });
    }).toPass({ timeout: PUBLISH_BUDGET_MS });
    await visitor.close();
  };

  const heroCtasFromApi = async (page: Page) => {
    const response = await page.request.get("/api/v1/ctas?placement=home-hero");
    expect(response.status()).toBe(200);
    return (await response.json()).data as { label: string; href: string; external: boolean }[];
  };

  const featuredSection = (tab: Page) =>
    tab.locator("section", { has: tab.getByRole("heading", { name: "O que a Benjamin faz pela sua marca" }) });

  test.beforeAll(async () => {
    admin = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } });
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
    const area = (await admin.from("areas").select("id").eq("status", "published").limit(1).single()).data!;
    ids.service = (
      await admin
        .from("services")
        .insert({
          slug: serviceSlug,
          name: serviceName,
          summary: "Resumo do serviço usado nos CTAs da Home.",
          description: "Descrição do serviço usado para testar CTAs e destaques da Home.",
          status: "published",
          published_at: new Date(Date.now() - 86_400_000).toISOString(),
        })
        .select("id")
        .single()
    ).data!.id;
    await admin.from("service_areas").insert({ service_id: ids.service, area_id: area.id });
  });

  test.afterAll(async () => {
    await admin.from("ctas").delete().like("label", `%${suffix}`);
    await admin.from("services").delete().eq("id", ids.service);
    for (const account of Object.values(accounts)) if (account.id) await admin.auth.admin.deleteUser(account.id);
  });

  test("módulo no painel: CTA novo nasce rascunho, e rascunho não vaza para a Home nem para a API", async ({
    page,
  }) => {
    await login(page);
    await page.getByRole("link", { name: "CTAs e destaques da Home" }).first().click();
    await expect(page).toHaveURL(/\/admin\/ctas$/);
    await expect(page.getByRole("heading", { level: 1, name: "CTAs e destaques da Home" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Destaques da Home", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Novo CTA" }).click();
    await visible(page.getByLabel("Texto do botão")).fill(label);
    await visible(page.getByLabel("Posição")).selectOption("home-hero");
    await chooseTarget(page, "internal", "Página");
    await visible(page.getByLabel("Página")).selectOption("/servicos");
    await visible(page.getByRole("button", { name: "Criar rascunho" })).click();
    await expect(page.getByRole("status").getByText("Rascunho criado.")).toBeVisible();
    ids.cta = page.url().split("?")[0].split("/").pop()!;

    await expectOnHome(page, (tab, options) => expect(tab.getByRole("link", { name: label })).toHaveCount(0, options));
    expect((await heroCtasFromApi(page)).map((cta) => cta.label)).not.toContain(label);
  });

  test("destino perigoso ou circular volta com erro no campo e nada muda", async ({ page }) => {
    await login(page);
    await page.goto(`/admin/ctas/${ids.cta}`);
    await chooseTarget(page, "external", "Link");
    await visible(page.getByLabel("Link")).fill("javascript:alert(1)");
    await visible(page.getByRole("button", { name: "Salvar alterações" })).click();
    await expect(page.getByText("Use um link completo com https://, sem espaços")).toBeVisible();
    // O que foi digitado continua no formulário, com o tipo escolhido.
    await expect(visible(page.getByLabel("Link"))).toHaveValue("javascript:alert(1)");
    await expect(visible(page.getByLabel("Tipo de destino"))).toHaveValue("external");

    await chooseTarget(page, "internal", "Página");
    await visible(page.getByLabel("Página")).selectOption("/");
    await visible(page.getByRole("button", { name: "Salvar alterações" })).click();
    await expect(page.getByText("Este botão já fica na Home e levaria para ela mesma.")).toBeVisible();

    const saved = await admin.from("ctas").select("target_kind, target_path, target_url").eq("id", ids.cta).single();
    expect(saved.data).toEqual({ target_kind: "internal", target_path: "/servicos", target_url: null });
  });

  test("publicado vira botão na Home, navegável, e entra na API pública", async ({ page }) => {
    await login(page);
    await page.goto(`/admin/ctas/${ids.cta}`);
    await runCommand(page, "Publicar", "Publicado.");
    await expectOnHome(page, (tab, options) => expect(tab.getByRole("link", { name: label })).toBeVisible(options));
    expect(await heroCtasFromApi(page)).toContainEqual({ label, href: "/servicos", external: false });

    const visitor = await page.context().browser()!.newContext();
    const tab = await visitor.newPage();
    await tab.goto("/");
    await tab.getByRole("link", { name: label }).click();
    await expect(tab).toHaveURL(/\/servicos$/);
    await visitor.close();
  });

  test("editar texto e destino muda a Home; destino fora do site cai no fallback, sem 404", async ({ page }) => {
    await login(page);
    await page.goto(`/admin/ctas/${ids.cta}`);
    await visible(page.getByLabel("Texto do botão")).fill(renamed);
    await chooseTarget(page, "service", "Serviço");
    await visible(page.getByLabel("Serviço")).selectOption(ids.service);
    await save(page);
    await expect(visible(page.getByText(`/servicos/${serviceSlug}`))).toBeVisible();

    await expectOnHome(page, async (tab, options) => {
      await expect(tab.getByRole("link", { name: renamed })).toHaveAttribute(
        "href",
        `/servicos/${serviceSlug}`,
        options,
      );
      await expect(tab.getByRole("link", { name: label, exact: true })).toHaveCount(0, options);
    });

    // Serviço sai do site: quem publica é avisado, o painel explica, e o botão leva à lista.
    await page.goto(`/admin/servicos/${ids.service}`);
    await runCommand(page, "Despublicar", "Despublicado");
    await expect(
      page.getByRole("status").getByText("CTAs publicados passarão a usar o link de fallback."),
    ).toBeVisible();
    await expectOnHome(page, (tab, options) =>
      expect(tab.getByRole("link", { name: renamed })).toHaveAttribute("href", "/servicos", options),
    );
    await page.goto(`/admin/ctas/${ids.cta}`);
    await expect(visible(page.getByText("Destino não publicado"))).toBeVisible();

    await page.goto(`/admin/servicos/${ids.service}`);
    await runCommand(page, "Publicar", "Publicado.");
    await expectOnHome(page, (tab, options) =>
      expect(tab.getByRole("link", { name: renamed })).toHaveAttribute("href", `/servicos/${serviceSlug}`, options),
    );
  });

  test("destaque é marcado no serviço, a tela de CTAs mostra onde, e a Home acompanha", async ({ page }) => {
    await login(page);
    await page.goto("/admin/ctas");
    await expect(page.getByRole("link", { name: serviceName })).toHaveCount(0);
    await expect(page.getByText("Destacar na Home")).toBeVisible();

    await page.goto(`/admin/servicos/${ids.service}`);
    await visible(page.getByLabel(/Destacar na Home/)).check();
    await save(page);
    await expectOnHome(page, (tab, options) =>
      expect(featuredSection(tab).getByRole("heading", { name: serviceName })).toBeVisible(options),
    );

    await page.goto("/admin/ctas");
    await page.getByRole("link", { name: serviceName }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/servicos/${ids.service}$`));

    await visible(page.getByLabel(/Destacar na Home/)).uncheck();
    await save(page);
    await expectOnHome(page, (tab, options) =>
      expect(featuredSection(tab).getByRole("heading", { name: serviceName })).toHaveCount(0, options),
    );
  });

  test("leitor vê e não edita; conta pendente e visitante não entram", async ({ page, browser }) => {
    await login(page, "viewer");
    await page.getByRole("link", { name: "CTAs e destaques da Home" }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "CTAs e destaques da Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Novo CTA" })).toHaveCount(0);
    await page.goto(`/admin/ctas/${ids.cta}`);
    await expect(visible(page.getByLabel("Texto do botão"))).toBeDisabled();
    await expect(page.getByRole("button", { name: "Salvar alterações" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Despublicar" })).toHaveCount(0);
    await page.goto("/admin/ctas/novo");
    await expect(page).toHaveURL(/\/admin\/sem-permissao/);

    const pending = await browser.newContext();
    const pendingTab = await pending.newPage();
    await submitLogin(pendingTab, "pending");
    await expect(pendingTab.getByText("Sua conta ainda não tem acesso liberado ao painel.")).toBeVisible();
    await pendingTab.goto("/admin/ctas");
    await expect(pendingTab).toHaveURL(/\/admin\/login/);
    // Sessão já aberta quando a conta perde o papel: a tela também não abre.
    await admin.from("profiles").update({ role: "viewer" }).eq("id", accounts.pending.id);
    await submitLogin(pendingTab, "pending");
    await expect(pendingTab).toHaveURL(/\/admin$/);
    await admin.from("profiles").update({ role: "pending" }).eq("id", accounts.pending.id);
    await pendingTab.goto("/admin/ctas");
    await expect(pendingTab).toHaveURL(/\/admin\/acesso-pendente/);
    await pending.close();

    const visitor = await browser.newContext();
    const visitorTab = await visitor.newPage();
    await visitorTab.goto(`/admin/ctas/${ids.cta}`);
    await expect(visitorTab).toHaveURL(/\/admin\/login/);
    await visitor.close();
  });

  test("despublicar tira o botão da Home; arquivar e excluir fecham o ciclo", async ({ page, browser }) => {
    await login(page);
    await page.goto(`/admin/ctas/${ids.cta}`);
    await runCommand(page, "Despublicar", "Despublicado");
    await expectOnHome(page, (tab, options) =>
      expect(tab.getByRole("link", { name: renamed })).toHaveCount(0, options),
    );
    expect((await heroCtasFromApi(page)).map((cta) => cta.label)).not.toContain(renamed);

    await runCommand(page, "Arquivar", "Arquivado");
    await expect(visible(page.getByText("CTA arquivado: restaure como rascunho para editar."))).toBeVisible();
    await expect(page.getByRole("button", { name: "Excluir definitivamente" })).toHaveCount(0);

    const adminContext = await browser.newContext();
    const adminTab = await adminContext.newPage();
    await login(adminTab, "admin");
    await adminTab.goto(`/admin/ctas/${ids.cta}`);
    await runCommand(adminTab, "Excluir definitivamente", "Excluído definitivamente.");
    await expect(adminTab).toHaveURL(/\/admin\/ctas\?/);
    await adminContext.close();
    expect((await admin.from("ctas").select("id").eq("id", ids.cta)).data).toEqual([]);

    // A despublicação do serviço vale para o site inteiro: deixa o cache sem o serviço de teste.
    await page.goto(`/admin/servicos/${ids.service}`);
    await runCommand(page, "Despublicar", "Despublicado");
  });
});
