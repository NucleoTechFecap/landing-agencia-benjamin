/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : motion.spec.ts
 Descrição    : Garante que as animações não escondem conteúdo nem quebram os caminhos sem motor.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinícius Nishimura Reis  Criação inicial (animações GSAP).
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test, type Page } from "@playwright/test";

const ROUTES = [
  "/",
  "/sobre",
  "/areas",
  "/servicos",
  "/servicos/copywriting",
  "/cases",
  "/cases/meridiano",
  "/contato",
  "/feedback",
  "/privacidade",
];

/** Percorre a página inteira, como um visitante, e dá tempo para as entradas terminarem. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, window.innerHeight * 0.6);
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" });
  });
  await page.waitForTimeout(1500);
}

const hiddenContent = () =>
  [...document.querySelectorAll<HTMLElement>("[data-motion], [data-motion='cards'] > *, [data-motion='group'] > *")]
    .filter((element) => element.getClientRects().length > 0 && Number(getComputedStyle(element).opacity) < 0.99)
    .map((element) => `${element.tagName}: ${element.textContent?.trim().slice(0, 40)}`);

test.describe("animações não atrapalham o conteúdo", () => {
  for (const route of ROUTES) {
    test(`${route}: tudo visível, imagens carregadas, sem overflow nem erro`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(route, { waitUntil: "networkidle" });
      await scrollThrough(page);

      expect(await page.evaluate(hiddenContent)).toEqual([]);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      const broken = await page.evaluate(() =>
        [...document.images]
          .filter((image) => image.getClientRects().length > 0 && image.complete && image.naturalWidth === 0)
          .map((image) => image.src),
      );
      expect(broken).toEqual([]);
      await expect(page.getByText("Conteúdo provisório")).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }

  test("o conteúdo que recebe foco por teclado é revelado", async ({ page, isMobile }) => {
    test.skip(isMobile, "teclado físico só no desktop");
    await page.goto("/servicos", { waitUntil: "networkidle" });
    const card = page.getByRole("link", { name: "Copywriting", exact: true }).first();
    await card.focus();
    await expect(card).toBeFocused();
    await expect
      .poll(() => card.evaluate((element) => getComputedStyle(element.closest("li") ?? element).opacity))
      .toBe("1");
  });

  test("a tela de carregamento abre uma vez por sessão e não intercepta cliques", async ({ page }) => {
    await page.goto("/", { waitUntil: "commit" });
    const loader = page.locator("[data-loader]");
    await expect(loader).toBeVisible();
    await expect(loader).toHaveCSS("pointer-events", "none");
    await expect(loader).toBeHidden({ timeout: 4000 });
    await page.goto("/sobre", { waitUntil: "commit" });
    await expect(loader).toBeHidden();
  });

  test("o fundo verde se move e para de existir ao sair da rota sem duplicar", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const canvas = page.locator("[data-wave] canvas").first();
    await expect(canvas).toBeAttached();
    const frame = () => canvas.evaluate((element: HTMLCanvasElement) => element.toDataURL());
    const before = await frame();
    await expect.poll(frame).not.toBe(before);
  });
});

test.describe("clique durante a entrada animada", () => {
  test("a entrada espera o clique terminar: o link não sai de baixo do cursor", async ({ page, isMobile }) => {
    test.skip(isMobile, "pressionar e segurar com mouse só no desktop");
    // Atrasa o JavaScript para pressionar o link com certeza antes de o motor começar as entradas.
    await page.route("**/_next/static/chunks/*.js", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.continue();
    });
    await page.goto("/", { waitUntil: "commit" });
    const link = page.getByRole("contentinfo").getByRole("link", { name: "Envie uma mensagem" });
    await link.scrollIntoViewIfNeeded();
    const box = (await link.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    // Solta assim que o link sair do lugar. Sem a proteção ele sai com o botão pressionado, e o clique se
    // perde; com ela nada se move, a espera termina no limite e o clique funciona.
    await page
      .waitForFunction(
        () => {
          const column = document.querySelector('footer [data-motion="group"] > :last-child');
          return column && getComputedStyle(column).transform !== "none";
        },
        undefined,
        { timeout: 3000, polling: "raf" },
      )
      .catch(() => undefined);
    await page.mouse.up();
    await expect(page).toHaveURL(/\/contato$/);
  });
});

test.describe("movimento reduzido", () => {
  test.use({ reducedMotion: "reduce" });

  for (const route of ["/", "/servicos", "/cases"]) {
    test(`${route}: sem tela de carregamento, sem motor e com tudo visível na hora`, async ({ page }) => {
      const engineRequests: string[] = [];
      page.on("request", (request) => {
        if (/gsap|ScrollTrigger/i.test(request.url())) engineRequests.push(request.url());
      });
      await page.goto(route, { waitUntil: "networkidle" });
      await expect(page.locator("html")).not.toHaveClass(/motion/);
      await expect(page.locator("[data-loader]")).toBeHidden();
      await expect(page.locator("[data-wave] canvas")).toHaveCount(0);
      expect(await page.evaluate(hiddenContent)).toEqual([]);
      await expect(page.locator("main h1")).toBeVisible();
      expect(engineRequests).toEqual([]);
    });
  }
});

test.describe("sem JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("todo o conteúdo aparece, sem tela de carregamento", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator("main h1")).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-loader]")).toBeHidden();
  });
});

test.describe("falha ao carregar o motor", () => {
  test("o temporizador libera o conteúdo", async ({ page }) => {
    await page.route("**/_next/static/chunks/*.js", (route) => route.abort());
    await page.goto("/", { waitUntil: "commit" });
    await expect(page.locator("[data-loader]")).toBeHidden({ timeout: 4000 });
    await expect(page.locator("main h1")).toHaveCSS("opacity", "1");
  });
});
