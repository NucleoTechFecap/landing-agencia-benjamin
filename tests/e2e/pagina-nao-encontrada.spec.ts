/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : pagina-nao-encontrada.spec.ts
 Descrição    : Rota inexistente: status 404, caminhos de volta, teclado e celular.

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
 01/11/2026 Vinícius Nishimura Reis  Testes de aceite da página 404 (LAY-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test } from "@playwright/test";

/** Rota inexistente responde 404 de verdade e oferece caminhos de volta, em celular e desktop (LAY-09). */
test.describe("Página não encontrada", () => {
  for (const path of ["/rota-que-nao-existe", "/servicos/servico-inexistente", "/cases/case-inexistente"]) {
    test(`${path} responde 404 com a identidade da marca`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole("heading", { level: 1, name: "Essa pauta não saiu do briefing." })).toBeVisible();
      await expect(page.getByText("Erro 404")).toBeVisible();
      await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
    });
  }

  test("a estrutura da página não se repete: um cabeçalho, um conteúdo, um rodapé", async ({ page }) => {
    await page.goto("/cases/case-inexistente");
    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("contentinfo")).toHaveCount(1);
  });

  for (const [label, destination] of [
    ["Voltar ao início", /\/$/],
    ["Ver serviços", /\/servicos$/],
    ["Ver cases", /\/cases$/],
  ] as const) {
    test(`"${label}" leva a uma página que existe`, async ({ page }) => {
      await page.goto("/rota-que-nao-existe");
      await page.getByRole("main").getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(destination);
      await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Essa pauta não saiu do briefing.");
    });
  }

  test("funciona pelo teclado e sem rolagem lateral", async ({ page }) => {
    await page.goto("/rota-que-nao-existe");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const home = page.getByRole("main").getByRole("link", { name: "Voltar ao início" });
    await home.focus();
    await expect(home).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/$/);
  });
});
