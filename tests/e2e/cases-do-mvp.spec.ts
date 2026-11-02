/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : cases-do-mvp.spec.ts
 Descrição    : Cases do MVP sem material autorizado: filtro e campos omitidos, sem selo no site.

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
 01/11/2026 Vinícius Nishimura Reis  Conformidade do case Aventura de Construir (CASE-05).
 01/11/2026 Vinícius Nishimura Reis  Conformidade do case Meridiano (CASE-06).
 01/11/2026 Vinícius Nishimura Reis  Conformidade do case FECAP (CASE-07).
 02/11/2026 Vinícius Nishimura Reis  O site público não exibe mais o selo de provisório.
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test } from "@playwright/test";

/**
 * Cada case do MVP como o visitante o encontra, em celular e desktop, enquanto o material autorizado
 * não chega (CASE-05 a CASE-07): filtro e nada de campo vazio como resultado real.
 * Quando o case receber o material, ajuste a entrada dele aqui.
 */
const CASES = [
  { slug: "aventura-de-construir", category: "copywriting", client: "Aventura de Construir" },
  { slug: "meridiano", category: "social-media-e-criacao", client: "Meridiano" },
  { slug: "fecap", category: "assessoria-de-imprensa", client: "FECAP" },
];

test("o case FECAP credita a Agência Benjamin; o NúcleoTech aparece só no crédito da plataforma", async ({ page }) => {
  await page.goto("/cases/fecap");
  await expect(page.getByRole("main").getByText("Agência Benjamin").first()).toBeVisible();
  await expect(page.getByRole("main").getByText(/n[úu]cleo\s*tech/i)).toHaveCount(0);
  await expect(page.getByRole("contentinfo").getByRole("link", { name: "NúcleoTech FECAP" })).toBeVisible();
});

for (const { slug, category, client } of CASES) {
  test.describe(`Case ${client}`, () => {
    test("aparece no filtro da categoria e leva ao detalhe", async ({ page }) => {
      await page.goto(`/cases?categoria=${category}`);
      const card = page.getByRole("main").locator("article").filter({ hasText: client });
      await expect(card).toHaveCount(1);
      await card.getByRole("link").click();
      await expect(page).toHaveURL(new RegExp(`/cases/${slug}$`));
    });

    test("não mostra selo de provisório nem campo vazio como resultado", async ({ page }) => {
      await page.goto(`/cases/${slug}`);
      const main = page.getByRole("main");
      await expect(main.getByText("Conteúdo provisório")).toHaveCount(0);
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
