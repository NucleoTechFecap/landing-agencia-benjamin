/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : sobre-proposta-de-valor.spec.ts
 Descrição    : Pilares da página Sobre escaneáveis em celular e desktop.

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
 01/11/2026 Vinícius Nishimura Reis  Testes de aceite da proposta de valor (SOB-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test } from "@playwright/test";

/** Proposta de valor e modelo de atuação escaneáveis em celular e desktop (SOB-02). */
test.describe("Sobre · proposta de valor e modelo de atuação", () => {
  const section = 'section[aria-labelledby="pilares-titulo"]';

  test("os três pilares aparecem na ordem, cada um com título e texto", async ({ page }) => {
    await page.goto("/sobre");
    const pillars = page.locator(section).getByRole("listitem");
    await expect(pillars.getByRole("heading", { level: 3 })).toHaveText([
      "Proposta de valor",
      "Modelo de atuação",
      "Dentro da FECAP",
    ]);
    for (const pillar of await pillars.all()) {
      expect((await pillar.locator("p").textContent())?.trim().length).toBeGreaterThan(20);
    }
  });

  test("lado a lado no desktop, empilhados no celular, sem rolagem lateral", async ({ page, isMobile }) => {
    await page.goto("/sobre");
    const pillars = page.locator(section).getByRole("listitem");
    const [first, second] = [(await pillars.nth(0).boundingBox())!, (await pillars.nth(1).boundingBox())!];
    if (isMobile) expect(second.x).toBe(first.x);
    else expect(second.y).toBe(first.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
