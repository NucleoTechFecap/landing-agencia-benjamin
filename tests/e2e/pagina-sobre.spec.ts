/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : pagina-sobre.spec.ts
 Descrição    : Página Sobre em celular e desktop: agência, FECAP, áreas e próximos passos.

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
 01/11/2026 Vinícius Nishimura Reis  Testes de aceite da página Sobre (SOB-01).
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test } from "@playwright/test";

/** Página Sobre em celular e desktop: agência, FECAP, áreas e próximos passos (SOB-01). */
test.describe("Página Sobre", () => {
  test("apresenta a agência experimental e a relação com a FECAP, sem rolagem lateral", async ({ page }) => {
    const response = await page.goto("/sobre");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("FECAP");
    await expect(page.getByRole("main")).toContainText("agência experimental");
    await expect(page.getByRole("heading", { level: 2, name: "Como a Benjamin funciona" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("texto ainda sem aprovação aparece com o selo, não como final", async ({ page }) => {
    await page.goto("/sobre");
    await expect(page.getByText("Conteúdo provisório").first()).toBeVisible();
  });

  test("a quantidade de áreas confere com o título da seção", async ({ page }) => {
    await page.goto("/sobre");
    const section = page.locator('section[aria-labelledby="sobre-areas-titulo"]');
    await expect(section.getByRole("heading", { level: 2 })).toHaveText("Seis áreas que trabalham juntas");
    await expect(section.getByRole("listitem")).toHaveCount(6);
  });

  test("os próximos passos levam ao formulário certo", async ({ page }) => {
    await page.goto("/sobre");
    await page.getByRole("link", { name: "Quero fazer parte" }).click();
    await expect(page).toHaveURL(/\/contato\?assunto=fazer-parte#formulario$/);
    await page.goto("/sobre");
    await page.getByRole("link", { name: "Quero um projeto" }).click();
    await expect(page).toHaveURL(/\/contato#formulario$/);
  });

  test("a trilha leva de volta ao início", async ({ page }) => {
    await page.goto("/sobre");
    await page.getByRole("main").getByRole("link", { name: "Início" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
