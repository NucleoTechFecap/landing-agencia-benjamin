/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : jornada-configuracoes-cms.spec.ts
 Descrição    : Jornada do painel ao site: contato e redes salvos direto no ar, sem redeploy.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Browser, type Locator, type Page } from "@playwright/test";

/**
 * Admin altera contato e redes, e o rodapé e /contato mudam sem deploy (ADM-10). Precisa do app
 * construído contra o Supabase local: rode `npm run test:e2e:cms`.
 *
 * site_settings tem uma linha só e a leitura pública fica no cache do Next entre rodadas. Por isso
 * a jornada restaura os valores PELO PAINEL, que invalida o cache: gravar direto no banco deixaria
 * o rodapé alterado para as outras suítes. Com `--repeat-each`, use `--workers=1`: cada repetição
 * disputaria a mesma linha.
 */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
// Aqui a pergunta é se o site muda sem deploy: sem invalidar o cache, ele ficaria igual por horas. A meta
// de 5 s do ADR-0006 é medida em jornada-site-cms; com a máquina carregada, só abrir a página já passa disso.
const REFLECT_TIMEOUT_MS = 15_000;
const READ_TIMEOUT_MS = 500;
const SETTINGS_PATH = "/admin/configuracoes";
const DETAIL_PATH = "/servicos/estrategia-digital"; // publicado no seed; o rodapé vale para toda página
const FIELDS = {
  email: "E-mail",
  phone: "Telefone",
  address: "Endereço",
  mapsUrl: "Link do mapa",
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
} as const;

type Field = keyof typeof FIELDS;
type Values = Record<Field, string>;

test.describe("Painel → site · Contato e redes @cms", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "A largura de 360 px é conferida no teste próprio, no desktop.");

  const suffix = randomBytes(3).toString("hex");
  const accounts = {
    admin: { email: `set-admin-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-ad1`, id: "" },
    editor: { email: `set-editor-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-ed1`, id: "" },
    viewer: { email: `set-viewer-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-vw1`, id: "" },
  };
  let service: SupabaseClient;
  let original: Values;

  const login = async (page: Page, account: { email: string; password: string }) => {
    await page.goto("/admin/login");
    // O login troca o formulário de fallback pelo definitivo ao terminar de carregar (B-08).
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Senha").fill(account.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  };

  const field = (page: Page, name: Field) => page.getByRole("textbox", { name: FIELDS[name], exact: false });

  /** Preenche e salva. A tela grava só o que difere, então restaurar é salvar os valores de antes. */
  const save = async (page: Page, values: Partial<Values>) => {
    await page.goto(SETTINGS_PATH);
    for (const [name, value] of Object.entries(values)) await field(page, name as Field).fill(value);
    await page.getByRole("button", { name: "Salvar e colocar no ar" }).click();
  };

  /** Abre a rota como visitante e repete, recarregando, até a condição valer dentro do prazo. */
  const onSite = async (
    browser: Browser,
    path: string,
    check: (tab: Page, onPage: { timeout: number }) => Promise<void>,
  ) => {
    const visitor = await browser.newContext();
    const tab = await visitor.newPage();
    await expect(async () => {
      await tab.goto(path);
      // Espera curta: a página já carregada não muda. Quem precisa olhar de novo é o toPass, recarregando.
      await check(tab, { timeout: READ_TIMEOUT_MS });
    }).toPass({ timeout: REFLECT_TIMEOUT_MS });
    await visitor.close();
  };

  const footer = (tab: Page) => tab.getByRole("contentinfo");
  const channels = (tab: Page) => tab.getByRole("complementary", { name: "Outros canais" });
  const network = (scope: Locator, name: string) => scope.getByRole("link", { name: `${name} da Agência Benjamin` });

  test.beforeAll(async () => {
    service = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } });
    const roles = { admin: "admin", editor: "editor", viewer: "viewer" } as const;
    for (const [key, role] of Object.entries(roles) as [keyof typeof roles, string][]) {
      const account = accounts[key];
      const { data, error } = await service.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
      });
      if (error) throw error;
      account.id = data.user.id;
      await service
        .from("profiles")
        .update({ role, full_name: `E2E ${role}` })
        .eq("id", account.id);
    }
    const { data, error } = await service.from("site_settings").select("contact, socials").single();
    if (error) throw error;
    const { contact, socials } = data as {
      contact: Partial<Record<Field, string>>;
      socials: Partial<Record<Field, string>>;
    };
    original = {
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      address: contact.address ?? "",
      mapsUrl: contact.mapsUrl ?? "",
      instagram: socials.instagram ?? "",
      tiktok: socials.tiktok ?? "",
      linkedin: socials.linkedin ?? "",
    };
  });

  test.afterAll(async () => {
    for (const account of Object.values(accounts)) {
      if (account.id) await service.auth.admin.deleteUser(account.id);
    }
  });

  test("admin altera rede e contato; rodapé e /contato mudam sem deploy, e a restauração volta tudo", async ({
    page,
    browser,
    request,
  }) => {
    test.slow(); // Jornada longa: cada etapa abre várias páginas, em duas rodadas (alterar e restaurar).
    const instagram = `https://www.instagram.com/benja-e2e-${suffix}`;
    const address = `Endereço E2E ${suffix}`;
    const email = `contato-${suffix}@exemplo.com.br`;

    await login(page, accounts.admin);
    // `first`: com o menu fixo do painel, o mesmo nome também aparece no card do início.
    await page.getByRole("link", { name: "Contato, links e redes sociais" }).first().click();
    await expect(page).toHaveURL(SETTINGS_PATH);
    await expect(page.getByText("Salvar vai direto ao ar.")).toBeVisible();

    try {
      await save(page, { instagram, address, email, mapsUrl: "", tiktok: "" });
      await expect(page.getByRole("status").getByText("Salvo e já no ar")).toBeVisible();
      // Depois de salvar, a tela já mostra a versão nova e aceita outra gravação.
      await expect(field(page, "instagram")).toHaveValue(instagram);

      await onSite(browser, "/", async (tab, onPage) => {
        await expect(network(footer(tab), "Instagram")).toHaveAttribute("href", instagram, onPage);
        await expect(footer(tab).getByText(address)).toBeVisible(onPage);
        await expect(footer(tab).getByRole("link", { name: email })).toHaveAttribute("href", `mailto:${email}`, onPage);
        // Campo apagado: sem o ícone da rede e sem link de mapa.
        await expect(network(footer(tab), "TikTok")).toHaveCount(0, onPage);
        await expect(footer(tab).getByRole("link", { name: address })).toHaveCount(0, onPage);
      });

      await onSite(browser, "/contato", async (tab, onPage) => {
        await expect(network(channels(tab), "Instagram")).toHaveAttribute("href", instagram, onPage);
        await expect(channels(tab).getByText(address)).toBeVisible(onPage);
        await expect(channels(tab).getByRole("link", { name: address })).toHaveCount(0, onPage);
        await expect(channels(tab).getByRole("link", { name: email })).toBeVisible(onPage);
      });

      await onSite(browser, DETAIL_PATH, async (tab, onPage) => {
        await expect(network(footer(tab), "Instagram")).toHaveAttribute("href", instagram, onPage);
      });

      // Buscadores e integrações: dados estruturados e API pública leem a mesma configuração.
      await onSite(browser, "/", async (tab) => {
        const jsonLd = await tab.locator('script[type="application/ld+json"]').allTextContents();
        expect(jsonLd.join("")).toContain(instagram);
      });
      const api = await (await request.get("/api/v1/settings")).json();
      expect(api.data.socials).toEqual({ instagram, linkedin: original.linkedin });
      expect(api.data.contact).toEqual({ email, address });
    } finally {
      await save(page, original);
      await expect(page.getByRole("status").getByText("Salvo e já no ar")).toBeVisible();
    }

    await onSite(browser, "/", async (tab, onPage) => {
      await expect(network(footer(tab), "Instagram")).toHaveAttribute("href", original.instagram, onPage);
      await expect(network(footer(tab), "TikTok")).toHaveAttribute("href", original.tiktok, onPage);
      await expect(footer(tab).getByText(address)).toHaveCount(0, onPage);
    });
    await onSite(browser, "/contato", async (tab, onPage) => {
      await expect(network(channels(tab), "Instagram")).toHaveAttribute("href", original.instagram, onPage);
      await expect(channels(tab).getByRole("link", { name: original.address })).toHaveAttribute(
        "href",
        original.mapsUrl,
        onPage,
      );
    });
    await onSite(browser, DETAIL_PATH, async (tab, onPage) => {
      await expect(network(footer(tab), "Instagram")).toHaveAttribute("href", original.instagram, onPage);
    });
  });

  test("link inválido mostra o erro no campo, mantém o digitado e não muda o site", async ({ page, browser }) => {
    await login(page, accounts.admin);
    await save(page, { instagram: "javascript:alert(1)", mapsUrl: "http://maps.exemplo.com/a", phone: "ligue já" });

    await expect(page.getByRole("alert").getByText("Revise os campos destacados.")).toBeVisible();
    await expect(page.locator("#instagram-erro")).toContainText("https://");
    await expect(page.locator("#mapsUrl-erro")).toContainText("https://");
    await expect(page.locator("#phone-erro")).toContainText("Use só números");
    await expect(field(page, "instagram")).toHaveAttribute("aria-invalid", "true");
    await expect(field(page, "instagram")).toHaveValue("javascript:alert(1)");

    await onSite(browser, "/", async (tab, onPage) => {
      await expect(network(footer(tab), "Instagram")).toHaveAttribute("href", original.instagram, onPage);
    });
  });

  test("duas abas: quem salva com a versão antiga recebe conflito e não sobrescreve", async ({ page, browser }) => {
    await login(page, accounts.admin);
    const second = await page.context().newPage();
    await second.goto(SETTINGS_PATH);

    await save(page, { phone: "(11) 3333-3333" });
    await expect(page.getByRole("status").getByText("Salvo e já no ar")).toBeVisible();
    try {
      await field(second, "phone").fill("(11) 4444-4444");
      await second.getByRole("button", { name: "Salvar e colocar no ar" }).click();
      await expect(second.getByRole("alert").getByText("alterado por outra pessoa")).toBeVisible();
      await expect(field(second, "phone")).toHaveValue("(11) 4444-4444");
    } finally {
      await second.close();
      await save(page, { phone: original.phone });
      await expect(page.getByRole("status").getByText("Salvo e já no ar")).toBeVisible();
    }
    await onSite(browser, "/", async (tab, onPage) => {
      await expect(footer(tab).getByText("(11) 3333-3333")).toHaveCount(0, onPage);
    });
  });

  test("editor vê em modo leitura e o servidor recusa o envio forçado", async ({ page, browser }) => {
    await login(page, accounts.editor);
    await page.goto(SETTINGS_PATH);
    await expect(page.getByText("Somente leitura.")).toBeVisible();
    await expect(page.getByText("Salvar vai direto ao ar.")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Salvar e colocar no ar" })).toHaveCount(0);
    await expect(field(page, "instagram")).toBeDisabled();
    await expect(field(page, "instagram")).toHaveValue(original.instagram);

    // Quem mexe no HTML reabilita os campos e envia: a barreira real é a do servidor.
    const invasion = `https://www.instagram.com/invasao-${suffix}`;
    await page.evaluate((value) => {
      const form = document.querySelector("form:has(input[name='instagram'])") as HTMLFormElement;
      form.querySelector("fieldset")!.disabled = false;
      (form.elements.namedItem("instagram") as HTMLInputElement).value = value;
      form.requestSubmit();
    }, invasion);
    await expect(page.getByRole("alert").getByText("Você não tem permissão")).toBeVisible();

    const { data } = await service.from("site_settings").select("socials").single();
    expect((data as { socials: { instagram?: string } }).socials.instagram).toBe(original.instagram);
    await onSite(browser, "/", async (tab, onPage) => {
      await expect(network(footer(tab), "Instagram")).toHaveAttribute("href", original.instagram, onPage);
    });
  });

  test("leitor vê em modo leitura", async ({ page }) => {
    await login(page, accounts.viewer);
    await page.goto(SETTINGS_PATH);
    await expect(page.getByText("Somente leitura.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Salvar e colocar no ar" })).toHaveCount(0);
    await expect(field(page, "email")).toBeDisabled();
  });

  test("visitante sem sessão vai para o login", async ({ page }) => {
    await page.goto(SETTINGS_PATH);
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("em 360 px o formulário cabe na tela, sem rolagem lateral", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await login(page, accounts.admin);
    await page.goto(SETTINGS_PATH);
    await expect(field(page, "mapsUrl")).toBeVisible();
    const submit = page.getByRole("button", { name: "Salvar e colocar no ar" });
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
