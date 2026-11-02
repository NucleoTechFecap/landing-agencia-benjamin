/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : estados-globais.spec.ts
 Descrição    : Estados de lista vazia e erro para o visitante.

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
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test, type Page } from "@playwright/test";

/** Estados de lista vazia e de erro para o visitante, em celular e desktop (LAY-07). */
const expectNoHorizontalScroll = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

test.describe("Estados globais", () => {
  test("filtro sem resultado explica o que houve e oferece limpar, sem rolagem lateral", async ({ page }) => {
    await page.goto("/cases?categoria=categoria-sem-case");
    await expect(page.getByRole("status").filter({ hasText: "0 cases encontrados" })).toBeVisible();
    await expect(page.getByText("Nenhum case com esses filtros por enquanto.")).toBeVisible();
    await expectNoHorizontalScroll(page);

    await page.getByRole("link", { name: "Limpar filtros e ver todos os cases" }).click();
    await expect(page).toHaveURL(/\/cases$/);
    await expect(page.getByRole("status").filter({ hasText: /case(s)? encontrado/ })).not.toContainText("0 cases");
  });

  test("o limpar filtros funciona pelo teclado", async ({ page }) => {
    await page.goto("/cases?categoria=categoria-sem-case");
    const reset = page.getByRole("link", { name: "Limpar filtros e ver todos os cases" });
    await reset.focus();
    await expect(reset).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/cases$/);
  });

  test("detalhe inexistente continua respondendo 404 de verdade", async ({ page }) => {
    const response = await page.goto("/cases/case-que-nao-existe");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Essa pauta não saiu do briefing." })).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
