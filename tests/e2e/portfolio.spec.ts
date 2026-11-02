/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : portfolio.spec.ts
 Descrição    : Portfólio em celular e desktop: grade, detalhe, teclado e filtro.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Foco visível no card e testes do portfólio (CASE-01).
 02/11/2026 Vinícius Nishimura Reis  Ajuste às animações GSAP e à remoção do selo provisório.
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test, type Page } from "@playwright/test";

/** Portfólio em celular e desktop: grade, navegação até o detalhe, teclado e filtros (CASE-01). */
const noHorizontalScroll = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

const expectFocusRing = async (page: Page, cardLink: ReturnType<Page["getByRole"]>) => {
  await cardLink.focus();
  await expect(cardLink).toBeFocused();
  expect(await cardLink.evaluate((link) => link.matches(":focus-visible"))).toBe(true);
  const outline = await cardLink.evaluate((link) => {
    const style = getComputedStyle(link.closest("article")!);
    return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  });
  expect(outline.style).toBe("solid");
  expect(outline.width).toBeGreaterThanOrEqual(3);
};

test.describe("Portfólio de cases", () => {
  test("a grade acompanha a largura da tela, sem rolagem lateral", async ({ page, isMobile }) => {
    await page.goto("/cases");
    const cards = page.getByRole("main").locator("article");
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(2);
    // Os cards entram com transformação (ADR-0008): a posição vale depois da entrada.
    await expect
      .poll(async () => {
        const [first, second] = [(await cards.nth(0).boundingBox())!, (await cards.nth(1).boundingBox())!];
        return Math.abs(isMobile ? second.x - first.x : second.y - first.y);
      })
      .toBeLessThan(1);
    await noHorizontalScroll(page);
  });

  test("o card mostra cliente e categoria e leva ao detalhe do case", async ({ page }) => {
    await page.goto("/cases");
    const card = page.getByRole("main").locator("article").first();
    const link = card.getByRole("link");
    const title = (await link.textContent())!;
    const client = await card.locator("p").first().textContent();
    expect(client?.trim()).toBeTruthy();
    await link.click();
    await expect(page).toHaveURL(/\/cases\/[a-z0-9-]+$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  });

  test("o foco do teclado fica visível no card de case", async ({ page }) => {
    await page.goto("/cases");
    await expectFocusRing(page, page.getByRole("main").locator("article").first().getByRole("link"));
  });

  test("o foco do teclado fica visível no card de serviço", async ({ page }) => {
    await page.goto("/servicos");
    await expectFocusRing(page, page.getByRole("main").locator("article").first().getByRole("link"));
  });

  test("o filtro por categoria mostra só os cases dela", async ({ page }) => {
    await page.goto("/cases?categoria=copywriting");
    await expect(page.getByRole("status").filter({ hasText: "1 case encontrado" })).toBeVisible();
    await expect(page.getByRole("main").locator("article")).toHaveCount(1);
    await noHorizontalScroll(page);
  });
});
