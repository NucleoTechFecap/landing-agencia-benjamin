/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Testes E2E
 Arquivo      : jornada-midia-cms.spec.ts
 Descrição    : Envio de mídia pelo painel, direto ao Storage: 8 MB de PDF e 5 MB de imagem.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinícius Nishimura Reis  Criação inicial (TECH-13, #313).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { expect, test, type Page } from "@playwright/test";

/** Precisa do app construído contra o Supabase local: rode `npm run test:e2e:cms`. */
const SUPABASE_URL = process.env.E2E_SUPABASE_URL;
const SERVICE_KEY = process.env.E2E_SUPABASE_SERVICE_ROLE_KEY;
const MB = 1024 * 1024;

/** PNG com cabeçalho e dimensões reais (100 × 100); o resto do arquivo é preenchimento. */
function pngOf(size: number): Buffer {
  const file = Buffer.alloc(size);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13]).copy(file, 0);
  file.write("IHDR", 12, "latin1");
  file.writeUInt32BE(100, 16);
  file.writeUInt32BE(100, 20);
  return file;
}

function pdfOf(size: number): Buffer {
  const file = Buffer.alloc(size);
  file.write("%PDF-1.7\n", 0, "latin1");
  return file;
}

test.describe("Biblioteca de mídia · envio direto ao Storage @cms", () => {
  test.describe.configure({ mode: "serial" });
  test.skip(!SUPABASE_URL || !SERVICE_KEY, "Requer o Supabase local: npm run test:e2e:cms");
  test.skip(({ isMobile }) => isMobile, "Painel no celular é avaliado em ADM-16.");

  const suffix = randomUUID().slice(0, 8);
  const account = { email: `e2e-midia-${suffix}@teste.local`, password: `Senha-e2e-${suffix}-md!`, id: "" };
  let admin: SupabaseClient;

  test.beforeAll(async () => {
    admin = createClient(SUPABASE_URL!, SERVICE_KEY!, { auth: { persistSession: false } });
    const { data, error } = await admin.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
    });
    if (error) throw error;
    account.id = data.user.id;
    await admin.from("profiles").update({ role: "editor", full_name: "E2E mídia" }).eq("id", account.id);
  });

  test.afterAll(async () => {
    const rows = (await admin.from("media_assets").select("path").like("path", `%-midia-${suffix}%`)).data ?? [];
    await admin.from("media_assets").delete().like("path", `%-midia-${suffix}%`);
    if (rows.length) await admin.storage.from("media").remove(rows.map((row) => row.path as string));
    if (account.id) await admin.auth.admin.deleteUser(account.id);
  });

  async function login(page: Page) {
    await page.goto("/admin/login");
    await expect(page.locator("form")).toHaveCount(1);
    await page.getByLabel("E-mail").fill(account.email);
    await page.getByLabel("Senha").fill(account.password);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/admin$/);
  }

  /** Maior corpo POST enviado ao próprio site: prova de que o arquivo não passou pela Server Action. */
  function watchActionBodies(page: Page) {
    const sizes: number[] = [];
    page.on("request", (request) => {
      if (request.method() === "POST" && new URL(request.url()).origin === new URL(page.url()).origin) {
        sizes.push(request.postDataBuffer()?.length ?? 0);
      }
    });
    return sizes;
  }

  async function send(page: Page, file: { name: string; mimeType: string; buffer: Buffer }, alt: string) {
    await page.goto("/admin/midia");
    await expect(page.locator("#file")).toBeEnabled();
    await page.locator("#file").setInputFiles(file);
    if (alt) await page.locator("#alt").fill(alt);
    await page.getByRole("button", { name: "Enviar", exact: true }).click();
  }

  const rowsOf = async (fragment: string) =>
    (await admin.from("media_assets").select("path, size_bytes").like("path", `%-midia-${suffix}-${fragment}%`)).data ??
    [];

  test("PDF de 8 MB entra na biblioteca, sem o arquivo passar pela Server Action", async ({ page }) => {
    await login(page);
    const bodies = watchActionBodies(page);
    await send(page, { name: `midia-${suffix}-pdf.pdf`, mimeType: "application/pdf", buffer: pdfOf(8 * MB) }, "");
    await expect(page.getByRole("status")).toContainText("enviado", { ignoreCase: true, timeout: 30_000 });
    const rows = await rowsOf("pdf");
    expect(rows).toHaveLength(1);
    expect(rows[0].size_bytes).toBe(8 * MB);
    expect(bodies.length).toBeGreaterThan(0);
    expect(Math.max(...bodies)).toBeLessThan(MB);
  });

  test("imagem de 5 MB entra na biblioteca", async ({ page }) => {
    await login(page);
    const bodies = watchActionBodies(page);
    await send(
      page,
      { name: `midia-${suffix}-img.png`, mimeType: "image/png", buffer: pngOf(5 * MB) },
      "Imagem de teste de cinco megabytes",
    );
    await expect(page.getByRole("status")).toContainText("enviado", { ignoreCase: true, timeout: 30_000 });
    const rows = await rowsOf("img");
    expect(rows).toHaveLength(1);
    expect(rows[0].size_bytes).toBe(5 * MB);
    expect(Math.max(...bodies)).toBeLessThan(MB);
  });

  test("assinatura falsa é recusada e não sobra no bucket", async ({ page }) => {
    await login(page);
    await send(
      page,
      {
        name: `midia-${suffix}-falsa.webp`,
        mimeType: "image/webp",
        buffer: Buffer.from("<html>nao sou imagem</html>"),
      },
      "Imagem falsa",
    );
    await expect(page.locator("#file-erro")).toContainText("não corresponde", { timeout: 30_000 });
    expect(await rowsOf("falsa")).toEqual([]);
    const month = new Date().toISOString().slice(0, 7).replace("-", "/");
    const listed = (await admin.storage.from("media").list(month, { limit: 1000 })).data ?? [];
    expect(listed.filter((entry) => entry.name.includes(`midia-${suffix}-falsa`))).toEqual([]);
  });

  test("arquivo acima do limite é recusado no navegador, antes de qualquer envio", async ({ page }) => {
    await login(page);
    await page.goto("/admin/midia");
    await expect(page.locator("#file")).toBeEnabled();
    await page
      .locator("#file")
      .setInputFiles({ name: `midia-${suffix}-grande.png`, mimeType: "image/png", buffer: pngOf(6 * MB) });
    await expect(page.locator("#file-erro")).toContainText("5 MB");
    await expect(page.getByRole("button", { name: "Enviar", exact: true })).toBeDisabled();
    expect(await rowsOf("grande")).toEqual([]);
  });
});
