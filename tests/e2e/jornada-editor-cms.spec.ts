/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : jornada-editor-cms.spec.ts
 Descrição    : J2 — editor publica um case pelo CMS e o site mostra a versão nova (TECH-12).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 27/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-12).
 27/10/2026 Vinícius Nishimura Reis  Jornadas em série: a massa do beforeAll é compartilhada (TECH-12).
──────────────────────────────────────────────────────────────────────────────
*/

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Locator, type Page } from "@playwright/test";

/**
 * J2.5/J2.6 — jornada do editor no CMS (TECH-12). Precisa do app construído contra o Supabase
 * local e da chave service_role para preparar a massa: rode `npm run test:e2e:cms`.
 * Sem essas variáveis o teste é pulado (o `npm run test:e2e` padrão usa o conteúdo versionado).
 */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
const PUBLISH_BUDGET_MS = 5_000; // ADR-0006: publicação reflete no site em até 5 s

/**
 * Com Cache Components o Next mantém a rota anterior escondida (Activity) para o "voltar":
 * depois de criar o case, o formulário de /novo continua no DOM com display:none. O campo
 * visível vem primeiro no documento (o <label> funciona para quem usa o painel), mas o
 * localizador precisa ignorar a cópia escondida.
 */
const visible = (locator: Locator) => locator.filter({ visible: true });

test.describe("J2 · editor publica no CMS e o site mostra @cms", () => {
  // Em série: com fullyParallel, cada worker rodaria o próprio beforeAll. Os dois criariam a
  // mesma mídia (caminho único no banco), e o afterAll de um apagaria a capa que o outro usa.
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "Painel no celular é avaliado em ADM-16.");

  const suffix = Math.random().toString(36).slice(2, 8);
  const slug = `case-e2e-${suffix}`;
  const past = new Date(Date.now() - 86_400_000).toISOString();
  const accounts = {
    editor: { email: `e2e-editor-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-ed!`, id: "" },
    viewer: { email: `e2e-viewer-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-vw!`, id: "" },
  };
  const ids = { service: "", category: "", media: "" };
  let admin: SupabaseClient;
  let createdMedia = false;

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
    const published = { status: "published", published_at: past };
    ids.service = (
      await admin
        .from("services")
        .insert({
          ...published,
          slug: `servico-e2e-${suffix}`,
          name: `Serviço E2E ${suffix}`,
          summary: "Resumo do serviço E2E.",
          description: "Descrição do serviço usado no teste E2E.",
        })
        .select("id")
        .single()
    ).data!.id;
    ids.category = (
      await admin
        .from("case_categories")
        .insert({ ...published, slug: `categoria-e2e-${suffix}`, name: `Categoria E2E ${suffix}` })
        .select("id")
        .single()
    ).data!.id;
    // Capa: arquivo versionado em public/. O caminho é único na biblioteca, então reaproveita
    // o registro se ele já existir (e só apaga no fim o que este teste criou).
    const cover = "/brand/cases/meridiano.webp";
    const existing = (await admin.from("media_assets").select("id").eq("path", cover).maybeSingle()).data;
    ids.media =
      existing?.id ??
      (
        await admin
          .from("media_assets")
          .insert({
            path: cover,
            mime_type: "image/webp",
            width: 1200,
            height: 750,
            alt_text: "Capa provisória do case Meridiano",
          })
          .select("id")
          .single()
      ).data!.id;
    createdMedia = !existing;
  });

  test.afterAll(async () => {
    await admin.from("cases").delete().eq("slug", slug);
    await admin.from("case_categories").delete().eq("id", ids.category);
    await admin.from("services").delete().eq("id", ids.service);
    if (createdMedia) await admin.from("media_assets").delete().eq("id", ids.media);
    for (const account of Object.values(accounts)) if (account.id) await admin.auth.admin.deleteUser(account.id);
  });

  async function login(page: Page, account: { email: string; password: string }) {
    await page.goto("/admin/login");
    // O login troca o formulário de fallback pelo definitivo ao terminar de carregar (B-08).
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Senha").fill(account.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  }

  async function publicStatus(page: Page) {
    return (await page.request.get(`/cases/${slug}`)).status();
  }

  test("J2.5 rascunho → publicar → editar → arquivar, refletindo no site sem redeploy", async ({ page }) => {
    await login(page, accounts.editor);
    await page.getByRole("link", { name: "Cases e categorias" }).click();
    await page.getByRole("link", { name: "Novo case" }).click();
    await visible(page.getByLabel("Título")).fill(`Case E2E ${suffix}`);
    // Endereço em branco: o servidor gera "case-e2e-<sufixo>" a partir do título.
    await visible(page.getByRole("button", { name: "Criar rascunho" })).click();
    await expect(page.getByRole("status")).toContainText("Rascunho criado");
    await expect(visible(page.getByText("Para publicar, falta:"))).toBeVisible();
    expect(await publicStatus(page)).toBe(404);

    await visible(page.getByLabel("Cliente")).fill("Cliente E2E");
    await visible(page.getByRole("combobox", { name: /^Categoria/ })).selectOption(ids.category);
    await visible(page.getByLabel(`Serviço E2E ${suffix}`)).check();
    await visible(page.getByLabel("Resumo")).fill("Resumo do case criado pelo teste ponta a ponta do CMS.");
    await visible(page.getByRole("combobox", { name: /^Capa/ })).selectOption(ids.media);
    await visible(page.getByRole("button", { name: "Salvar alterações" })).click();
    await expect(page.getByRole("status")).toContainText("Alterações salvas");
    await expect(visible(page.getByText("Para publicar, falta:"))).toHaveCount(0);

    await visible(page.getByRole("button", { name: "Publicar", exact: true })).click();
    await expect(page.getByRole("status")).toContainText("Publicado");
    const published = Date.now();
    await expect.poll(() => publicStatus(page), { timeout: PUBLISH_BUDGET_MS }).toBe(200);
    const site = await page.context().newPage();
    await site.goto(`/cases/${slug}`);
    await expect(site.getByRole("heading", { level: 1, name: `Case E2E ${suffix}` })).toBeVisible();
    expect(Date.now() - published).toBeLessThan(PUBLISH_BUDGET_MS);

    await visible(page.getByLabel("Resumo")).fill(
      "Resumo editado no painel: a página pública deve mostrar este texto.",
    );
    await visible(page.getByRole("button", { name: "Salvar alterações" })).click();
    await expect(page.getByRole("status")).toContainText("Alterações salvas");
    await site.goto(`/cases/${slug}`);
    await expect(site.getByText("Resumo editado no painel: a página pública deve mostrar este texto.")).toBeVisible({
      timeout: PUBLISH_BUDGET_MS,
    });

    page.once("dialog", (dialog) => dialog.accept());
    await visible(page.getByRole("button", { name: "Arquivar" })).click();
    await expect(page.getByRole("status")).toContainText("Arquivado");
    await expect.poll(() => publicStatus(page), { timeout: PUBLISH_BUDGET_MS }).toBe(404);
  });

  test("J2.6 leitor vê o CMS só para leitura e não cria conteúdo", async ({ page }) => {
    await login(page, accounts.viewer);
    await page.goto("/admin/cases");
    await expect(page.getByRole("heading", { level: 1, name: "Cases" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Novo case" })).toHaveCount(0);
    await page.goto("/admin/cases/novo");
    await expect(page).toHaveURL(/\/admin\/sem-permissao$/);
  });
});
