/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : cases-do-mvp.spec.ts
 Descrição    : Cases do MVP sem material autorizado: filtro, selo e campos omitidos.

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
 01/11/2026 Vinícius Nishimura Reis  Conformidade do case Aventura de Construir (CASE-05).
 01/11/2026 Vinícius Nishimura Reis  Conformidade do case Meridiano (CASE-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test } from "@playwright/test";

/**
 * Cada case do MVP como o visitante o encontra, em celular e desktop, enquanto o material autorizado
 * não chega (CASE-05 a CASE-07): filtro, selo de provisório e nada de campo vazio como resultado real.
 * Quando o case receber o material, ajuste a entrada dele aqui.
 */
const CASES = [
  { slug: "aventura-de-construir", category: "copywriting", client: "Aventura de Construir" },
  { slug: "meridiano", category: "social-media-e-criacao", client: "Meridiano" },
];

for (const { slug, category, client } of CASES) {
  test.describe(`Case ${client}`, () => {
    test("aparece no filtro da categoria e leva ao detalhe", async ({ page }) => {
      await page.goto(`/cases?categoria=${category}`);
      const card = page.getByRole("main").locator("article").filter({ hasText: client });
      await expect(card).toHaveCount(1);
      await card.getByRole("link").click();
      await expect(page).toHaveURL(new RegExp(`/cases/${slug}$`));
    });

    test("deixa claro que é provisório e não mostra campo vazio como resultado", async ({ page }) => {
      await page.goto(`/cases/${slug}`);
      const main = page.getByRole("main");
      await expect(main.getByText("Conteúdo provisório").first()).toBeVisible();
      await expect(main.getByText("Os detalhes deste case")).toBeVisible();
      for (const name of ["Desafio", "Solução", "Resultados", "Galeria", "Veja publicado", "Equipe"]) {
        await expect(main.getByRole("heading", { name, exact: true })).toHaveCount(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(
        0,
      );
    });
  });
}
