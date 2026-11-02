/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : rodape.spec.ts
 Descrição    : Rodapé em celular e desktop: redes, teclado e rolagem lateral.

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
 01/11/2026 Vinícius Nishimura Reis  Endereço sem mapa e redes vazias no rodapé (LAY-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test } from "@playwright/test";

/** Rodapé em celular e desktop: redes acessíveis, área de toque e sem rolagem lateral (LAY-03). */
test.describe("Rodapé", () => {
  test("redes sociais são alcançáveis pelo teclado, com área de toque adequada", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await footer.scrollIntoViewIfNeeded();

    const networks = [
      ["Instagram", "www.instagram.com"],
      ["TikTok", "www.tiktok.com"],
      ["LinkedIn", "www.linkedin.com"],
    ] as const;
    for (const [name, host] of networks) {
      const link = footer.getByRole("link", { name: `${name} da Agência Benjamin` });
      await expect(link).toBeVisible();
      expect(new URL((await link.getAttribute("href"))!).host).toBe(host);
      await expect(link).toHaveAttribute("target", "_blank");
      const box = (await link.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      await link.focus();
      await expect(link).toBeFocused();
    }
  });

  test("os links internos levam às páginas certas", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("contentinfo").getByRole("link", { name: "Envie uma mensagem" }).click();
    await expect(page).toHaveURL(/\/contato$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("não causa rolagem lateral", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("contentinfo").scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
});
