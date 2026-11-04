/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : jornada-midia-gestao.spec.ts
 Descrição    : Jornada de detalhe, edição e exclusão de arquivos da biblioteca de mídia.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-09).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";
import { acceptConfirmation } from "./painel-helpers";

/** Precisa do app construído contra o Supabase local: rode `npm run test:e2e:cms`. */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;

test.describe("Biblioteca de mídia · detalhe, edição e exclusão @cms", () => {
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "Painel no celular é avaliado em ADM-16.");

  const suffix = randomUUID().slice(0, 8);
  const accounts = {
    admin: { email: `e2e-gestao-a-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-a1!`, id: "" },
    editor: { email: `e2e-gestao-e-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-e1!`, id: "" },
    viewer: { email: `e2e-gestao-v-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-v1!`, id: "" },
  };
  const bytes = readFileSync(join(process.cwd(), "public/brand/cases/meridiano.webp"));
  const paths: string[] = [];
  const services: string[] = [];
  let admin: SupabaseClient;

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
        .update({ role, full_name: `E2E gestão ${role}` })
        .eq("id", account.id);
    }
  });

  test.afterAll(async () => {
    if (services.length) await admin.from("services").delete().in("id", services);
    if (paths.length) {
      await admin.from("media_assets").delete().in("path", paths);
      await admin.storage.from("media").remove(paths);
    }
    for (const account of Object.values(accounts)) if (account.id) await admin.auth.admin.deleteUser(account.id);
  });

  async function login(page: Page, account: { email: string; password: string }) {
    await page.goto("/admin/login");
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Senha").fill(account.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  }

  async function seedAsset(name: string) {
    const path = `2026/11/${randomUUID()}-gestao-${suffix}-${name}.webp`;
    paths.push(path);
    const upload = await admin.storage.from("media").upload(path, bytes, { contentType: "image/webp" });
    if (upload.error) throw upload.error;
    const { data, error } = await admin
      .from("media_assets")
      .insert({
        path,
        mime_type: "image/webp",
        size_bytes: bytes.length,
        width: 1200,
        height: 750,
        alt_text: "Texto original",
        decorative: false,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: data.id as string, path, fileName: `gestao-${suffix}-${name}.webp` };
  }

  /** O Next mantém a página anterior oculta no DOM (Activity): só o papel enxerga o campo visível. */
  const altField = (page: Page) => page.getByRole("textbox", { name: "Texto alternativo" });

  const fileExists = async (path: string) => {
    const folder = path.slice(0, path.lastIndexOf("/"));
    const file = path.slice(path.lastIndexOf("/") + 1);
    return ((await admin.storage.from("media").list(folder, { search: file })).data ?? []).length > 0;
  };

  test("administrador abre pela lista, corrige o texto e exclui o arquivo sem uso", async ({ page }) => {
    const file = await seedAsset("livre");
    const blocked: string[] = [];
    page.on("console", (message) => {
      if (message.text().includes("Content Security Policy")) blocked.push(message.text());
    });
    await login(page, accounts.admin);
    await page.goto("/admin/midia");
    await page.getByRole("link", { name: `Detalhes de ${file.fileName}` }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/midia/${file.id}$`));
    await expect(page.getByText("Nenhum conteúdo usa este arquivo.")).toBeVisible();
    // A imagem vem do Storage: precisa passar pela CSP (SEG-06).
    const image = page.getByRole("img", { name: "Texto original" });
    await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
    expect(blocked).toEqual([]);

    await altField(page).fill("Texto corrigido no painel");
    await page.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByRole("status")).toContainText("Alterações salvas");
    await expect(altField(page)).toHaveValue("Texto corrigido no painel");
    const saved = await admin.from("media_assets").select("alt_text").eq("id", file.id).single();
    expect(saved.data?.alt_text).toBe("Texto corrigido no painel");

    const button = page.getByRole("button", { name: "Excluir arquivo" });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.locator("dialog[open]")).toContainText("definitivamente");
    await acceptConfirmation(page, "Excluir arquivo");
    await expect(page).toHaveURL(/\/admin\/midia\?ok=excluido/);
    await expect(page.getByRole("status")).toContainText("Excluído");
    expect((await admin.from("media_assets").select("id").eq("id", file.id)).data).toEqual([]);
    expect(await fileExists(file.path)).toBe(false);
  });

  test("cancelar a confirmação não exclui", async ({ page }) => {
    const file = await seedAsset("cancela");
    await login(page, accounts.admin);
    await page.goto(`/admin/midia/${file.id}`);
    const button = page.getByRole("button", { name: "Excluir arquivo" });
    await expect(button).toBeEnabled();
    await button.click();
    await page.locator("dialog[open]").getByRole("button", { name: "Cancelar" }).click();
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page).toHaveURL(new RegExp(`/admin/midia/${file.id}$`));
    expect((await admin.from("media_assets").select("id").eq("id", file.id)).data).toHaveLength(1);
    expect(await fileExists(file.path)).toBe(true);
  });

  test("arquivo em uso mostra onde é usado e não oferece a exclusão", async ({ page }) => {
    const file = await seedAsset("usado");
    const service = await admin
      .from("services")
      .insert({ slug: `gestao-${suffix}`, name: `Serviço ${suffix}`, image_media_id: file.id })
      .select("id")
      .single();
    if (service.error) throw service.error;
    services.push(service.data.id as string);

    await login(page, accounts.admin);
    await page.goto(`/admin/midia/${file.id}`);
    await expect(page.getByRole("link", { name: `Serviço ${suffix}` })).toHaveAttribute(
      "href",
      `/admin/servicos/${service.data.id}`,
    );
    await expect(page.getByText("Arquivo em uso não pode ser excluído")).toBeVisible();
    await expect(page.getByRole("button", { name: "Excluir arquivo" })).toHaveCount(0);
  });

  test("editor edita, mas não vê exclusão; leitor só consulta", async ({ page }) => {
    const file = await seedAsset("papeis");
    await login(page, accounts.editor);
    await page.goto(`/admin/midia/${file.id}`);
    await expect(altField(page)).toHaveValue("Texto original");
    await expect(page.getByRole("button", { name: "Excluir arquivo" })).toHaveCount(0);

    await page.context().clearCookies();
    await login(page, accounts.viewer);
    await page.goto(`/admin/midia/${file.id}`);
    await expect(page.getByRole("heading", { name: file.fileName })).toBeVisible();
    await expect(page.getByText("Texto original")).toBeVisible();
    await expect(altField(page)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Salvar alterações" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Excluir arquivo" })).toHaveCount(0);
  });

  test("arquivo inexistente mostra a página de não encontrado", async ({ page }) => {
    await login(page, accounts.admin);
    // Como nos outros detalhes do painel, a resposta é transmitida e o status já saiu como 200.
    await page.goto(`/admin/midia/${randomUUID()}`);
    await expect(page.getByRole("heading", { name: "Essa pauta não saiu do briefing." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Excluir arquivo" })).toHaveCount(0);
  });
});
