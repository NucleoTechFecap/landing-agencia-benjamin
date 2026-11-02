/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : detalhe-do-case.spec.ts
 Descrição    : Rota por slug e leitura do case em celular e desktop.

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
 01/11/2026 Vinícius Nishimura Reis  Testes de aceite do detalhe do case (CASE-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test } from "@playwright/test";

/** Rota por slug e leitura do case em celular e desktop (CASE-02). */
test.describe("Detalhe do case", () => {
  test("a rota por slug abre o case, com a ficha do projeto e sem rolagem lateral", async ({ page }) => {
    const response = await page.goto("/cases/meridiano");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const sheet = page.getByRole("complementary", { name: "Ficha do projeto" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "Cliente" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("o caminho de volta para o portfólio funciona", async ({ page }) => {
    await page.goto("/cases/meridiano");
    await page.getByRole("link", { name: "Ver todos os cases" }).click();
    await expect(page).toHaveURL(/\/cases$/);
  });
});
