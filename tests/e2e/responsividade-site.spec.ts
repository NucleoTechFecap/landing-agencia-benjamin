/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : responsividade-site.spec.ts
 Descrição    : Site público em 360, 768, 1280 e 1920 px: rolagem, sobreposição, alvos de toque e mídia.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (QA-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { expect, test, type Page } from "@playwright/test";
import { saveEvidence } from "./painel-helpers";

/*
 * QA-03: o site público em celular, tablet e desktop. As larguras são as de CA-06. O painel tem a mesma
 * verificação em `painel-responsivo.spec.ts` (ADM-16). A medição vale com as animações terminadas: durante
 * a entrada, um item pode estar deslocado de propósito, e o que importa é o que sobra para quem lê.
 */
const WIDTHS = [360, 768, 1280, 1920] as const;
const HEIGHT = 800;
/** WCAG 2.5.8 (AA): 24 px, com a exceção de espaçamento. Campos e botões ficam na recomendação de 44 px. */
const MIN_TARGET = 24;
const MIN_CONTROL = 44;

const ROUTES = [
  { label: "inicio", path: "/" },
  { label: "sobre", path: "/sobre" },
  { label: "areas", path: "/areas" },
  { label: "servicos", path: "/servicos" },
  { label: "cases", path: "/cases" },
  { label: "contato", path: "/contato" },
  { label: "contato-projeto", path: "/contato/projeto" },
  { label: "contato-mensagem", path: "/contato/mensagem" },
  { label: "feedback", path: "/feedback" },
  { label: "privacidade", path: "/privacidade" },
  { label: "nao-encontrada", path: "/rota-que-nao-existe" },
];

interface Audit {
  scrollWidth: number;
  clientWidth: number;
  /** Elemento visível que passa da janela sem estar recortado por um ancestral. */
  outside: string[];
  /** Pares de elementos principais que ocupam o mesmo lugar. */
  overlaps: string[];
  /** Alvos de toque abaixo do mínimo. */
  smallTargets: string[];
  /** Texto cortado: conteúdo maior que a caixa, com overflow escondido. */
  cutText: string[];
  /** Imagem deformada: proporção da tela longe da proporção do arquivo, sem object-fit. */
  stretched: string[];
  /** Imagem visível que não carregou. */
  broken: string[];
}

/** Roda na página. O que está escondido, marcado como decorativo ou só para leitor de tela fica de fora. */
function auditPage({ minTarget, minControl }: { minTarget: number; minControl: number }): Audit {
  const describe = (element: Element) => {
    const text = element.textContent?.replace(/\s+/g, " ").trim().slice(0, 40) ?? "";
    const className = typeof element.className === "string" ? element.className.slice(0, 40) : "";
    return `<${element.tagName.toLowerCase()} class="${className}"> ${text}`;
  };
  const shown = (element: Element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return box.width > 1 && box.height > 1 && style.visibility !== "hidden" && style.display !== "none";
  };
  const decorative = (element: Element) =>
    Boolean(element.closest("[aria-hidden='true'], [data-loader], [data-wave], .sr-only")) ||
    (element.matches("img") && element.getAttribute("alt") === "");
  const clippedByAncestor = (element: Element) => {
    for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const { overflowX } = getComputedStyle(parent);
      if (overflowX === "hidden" || overflowX === "clip" || overflowX === "auto" || overflowX === "scroll") return true;
    }
    return false;
  };

  const width = document.documentElement.clientWidth;
  const all = [...document.body.querySelectorAll("*")].filter((element) => shown(element) && !decorative(element));

  const outside = all
    .filter((element) => !element.closest("svg") && !clippedByAncestor(element))
    .filter((element) => {
      const box = element.getBoundingClientRect();
      return box.right > width + 1 || box.left < -1;
    })
    .map(describe);

  const main = document.querySelector("main");
  const pieces = [
    ...(main?.querySelectorAll(
      "h1, h2, h3, h4, p, a[href], button, input:not([type=hidden]), select, textarea, label, img",
    ) ?? []),
  ].filter((element) => shown(element) && !decorative(element));
  const boxesOf = (element: Element) =>
    getComputedStyle(element).display === "inline" ? [...element.getClientRects()] : [element.getBoundingClientRect()];
  const overlaps: string[] = [];
  for (let first = 0; first < pieces.length; first += 1) {
    for (let second = first + 1; second < pieces.length; second += 1) {
      const [a, b] = [pieces[first], pieces[second]];
      if (a.contains(b) || b.contains(a)) continue;
      // Rótulo e campo são uma unidade: a caixa de marcar costuma ficar dentro do rótulo visualmente.
      if (a.matches("label") || b.matches("label")) {
        const [label, other] = a.matches("label") ? [a, b] : [b, a];
        if ((label as HTMLLabelElement).control === other) continue;
      }
      const hit = boxesOf(a).some((boxA) =>
        boxesOf(b).some((boxB) => {
          const across = Math.min(boxA.right, boxB.right) - Math.max(boxA.left, boxB.left);
          const down = Math.min(boxA.bottom, boxB.bottom) - Math.max(boxA.top, boxB.top);
          return across > 2 && down > 2;
        }),
      );
      if (hit) overlaps.push(`${describe(a)} × ${describe(b)}`);
    }
  }

  const targets = all.filter((element) =>
    element.matches("a[href], button, summary, select, textarea, input:not([type=hidden])"),
  );
  const undersized = (element: Element) => {
    const { height, width: targetWidth } = element.getBoundingClientRect();
    return height < minTarget || targetWidth < minTarget;
  };
  /** Exceção da WCAG 2.5.8: um círculo de 24 px em torno do alvo não encosta em outro alvo. */
  const hasSpacing = (element: Element) => {
    const box = element.getBoundingClientRect();
    const [x, y] = [box.left + box.width / 2, box.top + box.height / 2];
    return targets.every((other) => {
      if (other === element || other.contains(element) || element.contains(other)) return true;
      const near = other.getBoundingClientRect();
      if (undersized(other)) {
        return Math.hypot(near.left + near.width / 2 - x, near.top + near.height / 2 - y) >= minTarget;
      }
      const dx = Math.max(near.left - x, 0, x - near.right);
      const dy = Math.max(near.top - y, 0, y - near.bottom);
      return Math.hypot(dx, dy) >= minTarget / 2;
    });
  };
  const inlineInText = (element: Element) =>
    getComputedStyle(element).display === "inline" &&
    (element.parentElement?.textContent?.trim().length ?? 0) > (element.textContent?.trim().length ?? 0);
  const smallTargets = targets
    .filter((element) => {
      if (element.matches("input[type=checkbox], input[type=radio]")) {
        const boxes = [element, ...((element as HTMLInputElement).labels ?? [])].map((part) =>
          part.getBoundingClientRect(),
        );
        return Math.max(...boxes.map((box) => box.bottom)) - Math.min(...boxes.map((box) => box.top)) < minTarget;
      }
      if (element.matches("a") && inlineInText(element)) return false;
      if (element.matches("button, summary, select, textarea, input")) {
        return element.getBoundingClientRect().height < minControl;
      }
      return undersized(element) && !hasSpacing(element);
    })
    .map((element) => `${Math.round(element.getBoundingClientRect().height)}px ${describe(element)}`);

  const cutText = all
    .filter((element) => element.matches("h1, h2, h3, h4, p, a, button, label, li, dd, dt, span"))
    .filter((element) => {
      const { overflowX, overflowY } = getComputedStyle(element);
      const hides = [overflowX, overflowY].some((value) => value === "hidden" || value === "clip");
      return (
        hides && (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 2)
      );
    })
    .map(describe);

  const images = all.filter((element): element is HTMLImageElement => element.matches("img"));
  const stretched = images
    .filter((image) => image.naturalWidth > 0 && getComputedStyle(image).objectFit === "fill")
    .filter((image) => {
      const box = image.getBoundingClientRect();
      const natural = image.naturalWidth / image.naturalHeight;
      return Math.abs(box.width / box.height - natural) / natural > 0.05;
    })
    .map((image) => image.currentSrc.split("/").pop() ?? image.src);
  const broken = images.filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src);

  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: width,
    outside: outside.slice(0, 6),
    overlaps: overlaps.slice(0, 6),
    smallTargets: smallTargets.slice(0, 10),
    cutText: cutText.slice(0, 6),
    stretched: stretched.slice(0, 6),
    broken: broken.slice(0, 6),
  };
}

/** Percorre a página como um visitante, para as entradas e as imagens preguiçosas terminarem, e volta ao topo. */
async function settle(page: Page) {
  await page.evaluate(async () => {
    const step = Math.max(200, window.innerHeight * 0.6);
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  // Termina quando nada mais anima: em máquina carregada, um prazo fixo mediria a entrada pela metade.
  await page.waitForFunction(
    () =>
      !document.documentElement.classList.contains("motion-loading") &&
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .every((animation) => animation.playState !== "running"),
    undefined,
    { timeout: 20_000 },
  );
  // As entradas do GSAP não aparecem em `getAnimations`: dá o tempo da mais longa delas.
  await page.waitForTimeout(1600);
}

const problemsOf = ({ scrollWidth, clientWidth, ...rest }: Audit, width: number) => {
  const problems: Record<string, unknown> = {};
  if (scrollWidth > clientWidth) problems["rolagem lateral"] = { scrollWidth, clientWidth };
  if (rest.outside.length) problems["fora da janela"] = rest.outside;
  if (rest.overlaps.length) problems["sobreposição"] = rest.overlaps;
  if (rest.cutText.length) problems["texto cortado"] = rest.cutText;
  if (rest.stretched.length) problems["imagem deformada"] = rest.stretched;
  if (rest.broken.length) problems["imagem quebrada"] = rest.broken;
  if (width === 360 && rest.smallTargets.length) problems["alvo pequeno"] = rest.smallTargets;
  return problems;
};

async function auditAt(page: Page, label: string, path: string, width: number) {
  await page.setViewportSize({ width, height: HEIGHT });
  await page.goto(path, { waitUntil: "networkidle" });
  await settle(page);
  await saveEvidence(page, `site-${label}-${width}`);
  return problemsOf(await page.evaluate(auditPage, { minTarget: MIN_TARGET, minControl: MIN_CONTROL }), width);
}

/** Primeiro detalhe de cada lista: o endereço depende da massa (conteúdo versionado ou banco). */
async function detailPaths(page: Page, list: string, prefix: string) {
  await page.goto(list, { waitUntil: "networkidle" });
  const hrefs = await page
    .locator(`main a[href^="${prefix}"]`)
    .evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href")!));
  return [...new Set(hrefs.map((href) => href.split(/[?#]/)[0]))].filter((href) => href.length > prefix.length);
}

test.describe("QA-03 · site público em 360, 768, 1280 e 1920 px", () => {
  // A largura é definida aqui, tela por tela: no projeto "mobile" o resultado seria o mesmo.
  test.skip(({ isMobile }) => isMobile, "As larguras são definidas pelo próprio teste.");
  test.setTimeout(120_000);

  for (const { label, path } of ROUTES) {
    for (const width of WIDTHS) {
      test(`${path} em ${width} px`, async ({ page }) => {
        expect(await auditAt(page, label, path, width)).toEqual({});
      });
    }
  }

  for (const [list, prefix, label] of [
    ["/servicos", "/servicos/", "servico"],
    ["/cases", "/cases/", "case"],
  ] as const) {
    for (const width of WIDTHS) {
      test(`detalhe de ${label} em ${width} px`, async ({ page }) => {
        const [first] = await detailPaths(page, list, prefix);
        expect(first).toBeTruthy();
        expect(await auditAt(page, label, first, width)).toEqual({});
      });
    }

    test(`todo detalhe de ${label} em 360 px`, async ({ page }) => {
      test.setTimeout(300_000);
      await page.setViewportSize({ width: 360, height: HEIGHT });
      const details = await detailPaths(page, list, prefix);
      expect(details.length).toBeGreaterThan(0);
      const failures: Record<string, unknown> = {};
      for (const detail of details) {
        const problems = await auditAt(page, label, detail, 360);
        if (Object.keys(problems).length) failures[detail] = problems;
      }
      expect(failures).toEqual({});
    });
  }

  for (const [width, height, label] of [
    [360, 800, "celular em pé"],
    [360, 480, "celular com o teclado aberto"],
    [800, 360, "celular deitado"],
    [768, 1024, "tablet"],
  ] as const) {
    test(`menu em ${width} × ${height} (${label}): todos os destinos são alcançáveis`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/", { waitUntil: "networkidle" });
      await settle(page);
      const toggle = page.getByRole("button", { name: /Abrir menu|Fechar menu/ });
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      const menu = page.getByRole("navigation", { name: "Menu principal" });
      await expect(menu).toBeVisible();
      await page.waitForTimeout(600);

      // O painel cabe na janela: o cabeçalho é fixo, e rolar a página não revelaria o fim dele.
      const panel = await menu.evaluate((element) => {
        const box = element.parentElement!.getBoundingClientRect();
        return { bottom: box.bottom, viewport: window.innerHeight };
      });
      expect(panel.bottom).toBeLessThanOrEqual(panel.viewport);

      const links = menu.getByRole("link");
      const count = await links.count();
      expect(count).toBeGreaterThanOrEqual(8);
      for (let index = 0; index < count; index += 1) {
        const link = links.nth(index);
        await link.scrollIntoViewIfNeeded();
        await expect(link).toBeInViewport({ ratio: 1 });
        const box = (await link.boundingBox())!;
        expect(box.height, await link.textContent().then(String)).toBeGreaterThanOrEqual(MIN_TARGET);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
      ).toBe(true);
      await saveEvidence(page, `site-menu-${width}x${height}`, false);
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
    });
  }

  test("a medição enxerga o que procura: cada defeito plantado é apontado", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: HEIGHT });
    await page.goto("/privacidade", { waitUntil: "networkidle" });
    await settle(page);
    expect(problemsOf(await page.evaluate(auditPage, { minTarget: MIN_TARGET, minControl: MIN_CONTROL }), 360)).toEqual(
      {},
    );

    await page.evaluate(() => {
      const main = document.querySelector("main")!;
      main.insertAdjacentHTML(
        "afterbegin",
        `<div id="plantado">
           <div style="width:900px;height:10px">estouro</div>
           <h2 style="margin:0">Título plantado</h2>
           <p style="margin-top:-30px">Parágrafo em cima do título plantado</p>
           <p style="width:60px;height:20px;overflow:hidden;white-space:nowrap">texto longo demais para a caixa plantada</p>
           <a href="/" style="display:inline-block;width:12px;height:12px"></a><a href="/" style="display:inline-block;width:12px;height:12px"></a>
           <img alt="deformada" src="/brand/cases/meridiano.webp" style="width:300px;height:30px;object-fit:fill">
           <img alt="quebrada" src="/nao-existe.webp" style="width:50px;height:50px">
         </div>`,
      );
    });
    await page.waitForFunction(() =>
      [...document.querySelectorAll("#plantado img")].every((image) => (image as HTMLImageElement).complete),
    );
    const problems = problemsOf(
      await page.evaluate(auditPage, { minTarget: MIN_TARGET, minControl: MIN_CONTROL }),
      360,
    );
    expect(Object.keys(problems).sort()).toEqual(
      [
        "alvo pequeno",
        "fora da janela",
        "imagem deformada",
        "imagem quebrada",
        "rolagem lateral",
        "sobreposição",
        "texto cortado",
      ].sort(),
    );
  });

  for (const width of [1024, 1280] as const) {
    test(`cabeçalho em ${width} px: os itens não se atropelam`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto("/", { waitUntil: "networkidle" });
      await settle(page);
      const collisions = await page.evaluate(() => {
        const items = [...document.querySelectorAll("header a[href], header button")].filter((element) => {
          const box = element.getBoundingClientRect();
          return box.width > 1 && getComputedStyle(element).visibility !== "hidden";
        });
        const found: string[] = [];
        items.forEach((first, index) => {
          for (const second of items.slice(index + 1)) {
            if (first.contains(second) || second.contains(first)) continue;
            const [a, b] = [first.getBoundingClientRect(), second.getBoundingClientRect()];
            if (
              Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
              Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1
            ) {
              found.push(`${first.textContent} × ${second.textContent}`);
            }
          }
        });
        return found;
      });
      expect(collisions).toEqual([]);
    });
  }

  for (const [path, button, label] of [
    ["/contato/mensagem", /Enviar/, "mensagem"],
    ["/contato/projeto", /Enviar/, "projeto"],
    ["/feedback", /Enviar/, "feedback"],
  ] as const) {
    test(`${path}: com os erros na tela, o formulário continua cabendo em 360 px`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: HEIGHT });
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(async () => {
        await page.getByRole("button", { name: button }).click({ timeout: 2_000 });
        await expect(page.locator("[aria-invalid='true']").first()).toBeVisible({ timeout: 1_000 });
      }).toPass({ timeout: 15_000 });
      await settle(page);
      const audit = await page.evaluate(auditPage, { minTarget: MIN_TARGET, minControl: MIN_CONTROL });
      await saveEvidence(page, `site-${label}-erros-360`);
      expect(problemsOf(audit, 360)).toEqual({});
    });
  }

  test("âncora do formulário não fica escondida sob o cabeçalho fixo", async ({ page }) => {
    for (const width of [360, 1280]) {
      await page.setViewportSize({ width, height: HEIGHT });
      await page.goto("/contato#formulario", { waitUntil: "networkidle" });
      await settle(page);
      await page.locator("#formulario").evaluate((element) => element.scrollIntoView());
      const { target, header } = await page.evaluate(() => ({
        target: document.querySelector("#formulario")!.getBoundingClientRect().top,
        header: document.querySelector("header")!.getBoundingClientRect().bottom,
      }));
      expect(target, `${width} px`).toBeGreaterThanOrEqual(header - 1);
    }
  });
});

test.describe("QA-03 · rolagem lateral enquanto a página anima", () => {
  test.setTimeout(180_000);

  /** Mede a cada quadro, do início do carregamento ao fim da rolagem, e guarda o maior estouro. */
  for (const rate of [1, 6]) {
    for (const route of ["/", "/servicos", "/cases", "/contato"]) {
      test(`${route} com CPU ${rate}x: nunca rola para o lado`, async ({ page }) => {
        const session = await page.context().newCDPSession(page);
        await session.send("Emulation.setCPUThrottlingRate", { rate });
        await page.addInitScript(() => {
          const state = { peak: 0, culprits: [] as string[] };
          (window as unknown as { __overflow: typeof state }).__overflow = state;
          const sample = () => {
            const root = document.documentElement;
            const over = root ? root.scrollWidth - root.clientWidth : 0;
            if (over > state.peak) {
              state.peak = over;
              state.culprits = [...document.body.querySelectorAll("*")]
                .filter((element) => element.getBoundingClientRect().right > root.clientWidth + 1)
                .slice(0, 5)
                .map((element) => element.tagName + " " + String(element.className).slice(0, 50));
            }
            requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        });
        await page.goto(route, { waitUntil: "networkidle", timeout: 120_000 });
        await settle(page);
        const measured = await page.evaluate(
          () => (window as unknown as { __overflow: { peak: number; culprits: string[] } }).__overflow,
        );
        expect(measured).toEqual({ peak: 0, culprits: [] });
      });
    }
  }
});
