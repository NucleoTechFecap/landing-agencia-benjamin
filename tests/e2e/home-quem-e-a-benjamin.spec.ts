/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : home-quem-e-a-benjamin.spec.ts
 Descrição    : Bloco Quem é a Benjamin da Home em celular e desktop.

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
 01/11/2026 Vinícius Nishimura Reis  Testes de aceite do bloco Quem é a Benjamin (HOME-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test } from "@playwright/test";

/** Bloco "Quem é a Benjamin" da Home em celular e desktop (HOME-02). */
test.describe('Home · "Quem é a Benjamin"', () => {
  const block = 'section[aria-labelledby="quem-somos-titulo"]';

  test("apresenta a agência e a ligação com a FECAP, sem rolagem lateral", async ({ page }) => {
    await page.goto("/");
    const section = page.locator(block);
    await expect(section.getByRole("heading", { level: 2 })).toBeVisible();
    for (const topic of ["Quem somos", "Nossa proposta", "Como atuamos", "O que entregamos"]) {
      await expect(section.getByRole("heading", { level: 3, name: topic })).toBeVisible();
    }
    await expect(section).toContainText("FECAP");
    await expect(section).not.toContainText("0 serviços");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("leva à página Sobre, também pelo teclado", async ({ page }) => {
    await page.goto("/");
    const link = page.locator(block).getByRole("link", { name: "Conheça a agência" });
    await link.focus();
    await expect(link).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/sobre$/);
  });
});
