/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : jornada-leads-cms.spec.ts
 Descrição    : Do formulário público à consulta no painel, com Auth e RLS reais, por papel.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * J3.4/J3.5 — envio público consultado no painel (FORM-09, INT-07, SEG-04). Precisa do app construído
 * contra o Supabase local: `npm run test:e2e:cms`. Sem as variáveis, o teste é pulado. Dados fictícios.
 */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

/** O Next mantém a rota anterior no DOM, escondida (Activity): o localizador ignora essa cópia. */
const visible = (locator: Locator) => locator.filter({ visible: true });

test.describe("J3 · envio público consultado no painel @cms", () => {
  // Em série: as contas e a massa são do beforeAll, e o limite de envios é por origem.
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "Painel no celular é avaliado em ADM-16.");
  // Origem própria por rodada: o limite é de 5 envios por IP em 10 minutos, e os testes repetem.
  test.use({
    extraHTTPHeaders: { "x-forwarded-for": `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}` },
  });

  const suffix = randomBytes(4).toString("hex");
  const person = { name: `Pessoa E2E ${suffix}`, email: `pessoa-${suffix}@exemplo.test` };
  const message = `Gostaria de uma entrevista sobre o projeto ${suffix}.`;
  const hostile = {
    id: randomUUID(),
    category: `contact:hostil-${suffix}`,
    html: '<img src=x onerror="window.__xss=1">',
  };
  const removable = randomUUID();
  const accounts = Object.fromEntries(
    (["admin", "editor", "super_admin"] as const).map((role) => [
      role,
      {
        email: `e2e-${role.replace("_", "-")}-${suffix}@teste.local`,
        password: `Senha-e2e-${suffix}-${role}!`,
        id: "",
      },
    ]),
  ) as Record<"admin" | "editor" | "super_admin", { email: string; password: string; id: string }>;
  let db: SupabaseClient;
  let opened = "";

  test.beforeAll(async () => {
    db = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } });
    for (const [role, account] of Object.entries(accounts)) {
      const { data, error } = await db.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
      });
      if (error) throw error;
      account.id = data.user.id;
      await db
        .from("profiles")
        .update({ role, full_name: `E2E ${role}` })
        .eq("id", account.id);
    }
    const base = { kind: "contact", payload: { name: hostile.html, message: hostile.html }, status: "novo" };
    const { error } = await db.from("form_submissions").insert([
      {
        ...base,
        id: hostile.id,
        protocol: `AB-${suffix.slice(0, 6).toUpperCase()}`,
        category: hostile.category,
        fingerprint: `e2e-hostil-${suffix}`,
        source_path: "//evil.com",
        notification_status: "failed",
        notification_attempts: 5,
      },
      {
        ...base,
        id: removable,
        protocol: `AB-${removable.slice(0, 6).toUpperCase()}`,
        category: `contact:excluir-${suffix}`,
        fingerprint: `e2e-excluir-${suffix}`,
        source_path: "/contato",
        notification_status: "sent",
        notification_attempts: 1,
      },
    ]);
    if (error) throw error;
  });

  test.afterAll(async () => {
    await db.from("form_submissions").delete().in("id", [hostile.id, removable]);
    await db.from("form_submissions").delete().eq("payload->>email", person.email);
    for (const account of Object.values(accounts)) if (account.id) await db.auth.admin.deleteUser(account.id);
  });

  async function login(page: Page, account: { email: string; password: string }) {
    await page.goto("/admin/login");
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Senha").fill(account.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  }

  const eventsOf = async (id: string) =>
    ((await db.from("audit_log").select("event, metadata").eq("resource_id", id).order("id")).data ?? []) as {
      event: string;
      metadata: Record<string, unknown>;
    }[];

  test("J3.4 visitante envia, admin vê na lista, abre e muda o status, sem depender do e-mail", async ({ page }) => {
    await page.goto("/contato?tipo=contato");
    // Hidratação (identificador de envio) e tempo mínimo antirrobô: antes disso, nada é gravado.
    await expect(page.locator('input[name="submissionId"]')).not.toHaveValue("");
    await page.waitForTimeout(3_100);
    await page.getByLabel(/^Nome/).fill(person.name);
    await page.getByLabel(/^E-mail/).fill(person.email);
    await page.getByLabel(/^Assunto/).selectOption("imprensa");
    await page.getByLabel(/^Mensagem/).fill(message);
    await page.getByLabel(/aviso de privacidade/).check();
    await page.getByRole("button", { name: "Enviar mensagem" }).click();
    const success = page.getByRole("status").filter({ hasText: "Mensagem enviada!" });
    await expect(success).toBeVisible();
    const protocol = /AB-[0-9A-F]{6}/.exec((await success.textContent()) ?? "")?.[0] ?? "";
    expect(protocol).not.toBe("");

    await login(page, accounts.admin);
    await page.getByRole("link", { name: "Leads e feedbacks" }).click();
    await expect(page).toHaveURL(/\/admin\/leads$/);
    await expect(visible(page.getByRole("heading", { level: 1, name: "Leads e feedbacks" }))).toBeVisible();

    await visible(page.getByLabel("Tipo")).selectOption("contact");
    await visible(page.getByLabel("Categoria", { exact: true })).selectOption("contact:imprensa");
    await visible(page.getByRole("button", { name: "Filtrar" })).click();
    await expect(page).toHaveURL(/tipo=contact.*categoria=contact%3Aimprensa/);

    const row = visible(page.getByRole("row").filter({ hasText: protocol }));
    await expect(row).toContainText(person.name);
    await expect(row).toContainText("Imprensa");
    await expect(row).toContainText("Novo");
    // Sem destinatário no ambiente local: o envio está no painel mesmo sem nenhum e-mail ter saído.
    await expect(row).toContainText("Sem destinatário");
    // A lista não mostra o conteúdo, que só aparece ao abrir (TECH-08).
    await expect(row).not.toContainText(person.email);
    await expect(visible(page.getByText(message))).toHaveCount(0);

    await row.getByRole("link", { name: protocol }).click();
    await expect(page).toHaveURL(/\/admin\/leads\/[0-9a-f-]{36}$/);
    opened = page.url().split("/").pop()!;
    expect(page.url()).not.toContain(suffix);
    await expect(page).toHaveTitle(/Envio recebido/);
    await expect(visible(page.getByRole("heading", { level: 1, name: protocol }))).toBeVisible();
    await expect(visible(page.getByText(person.email))).toBeVisible();
    await expect(visible(page.getByText(message))).toBeVisible();
    await expect(visible(page.getByText("nenhum e-mail foi enviado"))).toBeVisible();
    await expect.poll(async () => (await eventsOf(opened)).map((event) => event.event)).toContain("lead.viewed");

    await visible(page.getByLabel("Status de atendimento")).selectOption("em_atendimento");
    await visible(page.getByRole("button", { name: "Salvar status" })).click();
    await expect(visible(page.getByRole("status")).filter({ hasText: "Alterações salvas" })).toBeVisible();
    await expect(visible(page.getByLabel("Status de atendimento"))).toHaveValue("em_atendimento");

    const saved = await db.from("form_submissions").select("status, payload").eq("id", opened).single();
    expect(saved.data).toMatchObject({ status: "em_atendimento", payload: { email: person.email } });
    const changed = (await eventsOf(opened)).find((event) => event.event === "lead.status_changed");
    expect(changed?.metadata).toEqual({ kind: "contact", fromStatus: "novo", toStatus: "em_atendimento" });
    expect(JSON.stringify(await eventsOf(opened))).not.toContain(suffix);

    // A lista fica guardada no navegador para o "voltar": sem invalidar, mostraria o status antigo.
    await page.goBack();
    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/leads\?/);
    await expect(visible(page.getByRole("row").filter({ hasText: protocol }))).toContainText("Em atendimento");
  });

  for (const role of ["editor", "super_admin"] as const) {
    test(`J3.5 ${role} recebe "sem permissão" e não vê dado nenhum`, async ({ page }) => {
      await login(page, accounts[role]);
      await expect(page.getByRole("link", { name: "Leads e feedbacks" })).toHaveCount(0);
      for (const path of ["/admin/leads", `/admin/leads/${hostile.id}`, "/admin/leads/nao-e-uuid"]) {
        await page.goto(path);
        await expect(page).toHaveURL(/\/admin\/sem-permissao$/);
        await expect(page.getByRole("heading", { name: "Sem permissão" })).toBeVisible();
        await expect(page.locator("body")).not.toContainText("window.__xss");
      }
      // A tentativa fica na trilha, sem dizer qual registro foi pedido.
      const denied = await db
        .from("audit_log")
        .select("event, outcome, resource_id, metadata")
        .eq("actor_id", accounts[role].id)
        .eq("event", "access.denied");
      expect(denied.data).toHaveLength(3);
      expect(denied.data?.[0]).toMatchObject({
        outcome: "denied",
        resource_id: null,
        metadata: { resource: "lead", action: "view" },
      });
    });
  }

  test("J3.5 sem sessão, a tela leva ao login e a API pública não tem rota de envios", async ({ page }) => {
    const response = await page.request.get(`/admin/leads/${hostile.id}`, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain("/admin/login");
    expect(await response.text()).not.toContain("window.__xss");
    for (const path of ["/api/v1/leads", "/api/v1/form_submissions", "/api/v1/feedbacks"]) {
      expect((await page.request.get(path)).status()).toBe(404);
    }
  });

  test("J3.6 conteúdo hostil é só texto, e o e-mail que falhou fica à vista", async ({ page }) => {
    await login(page, accounts.admin);
    await page.goto("/admin/leads");
    await expect(page.getByText(/não cheg(ou|aram) por e-mail/)).toBeVisible();
    await page.getByRole("link", { name: "Ver quais são" }).click();
    await expect(page).toHaveURL(/notificacao=failed/);
    await expect(visible(page.getByLabel("Notificação"))).toHaveValue("failed");
    const row = visible(page.getByRole("row").filter({ hasText: `AB-${suffix.slice(0, 6).toUpperCase()}` }));
    await expect(row).toContainText("Falhou");
    await expect(row).toContainText(hostile.html);

    await page.goto(`/admin/leads/${hostile.id}`);
    await expect(page.getByRole("heading", { level: 2, name: "Conteúdo enviado" })).toBeVisible();
    await expect(page.getByText(hostile.html).first()).toBeVisible();
    await expect(page.getByText("não há novo reenvio automático")).toBeVisible();
    await expect(page.locator("code").filter({ hasText: "//evil.com" })).toBeVisible();
    await expect(page.locator('a[href*="evil.com"]')).toHaveCount(0);
    await expect(page.locator("img[src='x']")).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  });

  test("J3.6 entrada malformada não quebra a tela nem expõe erro interno", async ({ page }) => {
    await login(page, accounts.admin);
    await page.goto("/admin/leads?pagina=-1&tipo=orcamento&status=eq.novo&categoria=fulano%40exemplo.test");
    await expect(page.getByRole("heading", { level: 1, name: "Leads e feedbacks" })).toBeVisible();
    await expect(page.getByLabel("Tipo")).toHaveValue("");
    await expect(page.locator("body")).not.toContainText("fulano@exemplo.test");

    await page.goto("/admin/leads?pagina=999999");
    await expect(page.getByRole("navigation", { name: "Páginas da lista" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Próxima" })).toHaveCount(0);

    for (const id of ["nao-e-uuid", randomUUID()]) {
      await page.goto(`/admin/leads/${id}`);
      await expect(page.getByRole("heading", { level: 1, name: "Essa pauta não saiu do briefing." })).toBeVisible();
      await expect(page.locator("body")).not.toContainText(/PGRST|22P02|invalid input/);
    }
  });

  test("J3.8 ao sair, o envio aberto não fica na página, nem escondido", async ({ page }) => {
    await login(page, accounts.admin);
    await page.goto(`/admin/leads?categoria=${encodeURIComponent(hostile.category)}`);
    await page.getByRole("link", { name: `AB-${suffix.slice(0, 6).toUpperCase()}` }).click();
    await expect(visible(page.getByRole("heading", { level: 2, name: "Conteúdo enviado" }))).toBeVisible();

    await visible(page.getByRole("button", { name: "Sair" })).click();
    await expect(page).toHaveURL(/\/admin\/login\?saiu=ok$/);
    await expect(page.getByRole("status")).toContainText("Você saiu do painel com segurança");
    expect(await page.content()).not.toContain("window.__xss");

    await page.goBack();
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByRole("heading", { name: "Conteúdo enviado" })).toHaveCount(0);
  });

  test("J3.7 admin arquiva e só então exclui, e a trilha fica", async ({ page }) => {
    await login(page, accounts.admin);
    await page.goto(`/admin/leads/${removable}`);
    await expect(page.getByRole("button", { name: "Excluir definitivamente" })).toHaveCount(0);
    await expect(page.getByText("arquive o envio primeiro")).toBeVisible();

    await page.getByLabel("Status de atendimento").selectOption("arquivado");
    await page.getByRole("button", { name: "Salvar status" }).click();
    await expect(visible(page.getByRole("status")).filter({ hasText: "Alterações salvas" })).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await visible(page.getByRole("button", { name: "Excluir definitivamente" })).click();
    await expect(page).toHaveURL(/\/admin\/leads\?ok=excluido$/);
    await expect(visible(page.getByRole("status")).filter({ hasText: "Excluído definitivamente" })).toBeVisible();

    const gone = await db.from("form_submissions").select("id").eq("id", removable);
    expect(gone.data).toEqual([]);
    expect((await eventsOf(removable)).map((event) => event.event)).toContain("lead.deleted");
  });
});
