/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : scene.ts
 Descrição    : Efeitos de uma rota: entradas, rolagem, grades de cards e seção presa.

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

import { DURATION, EASE, gsap, ScrollTrigger, SplitText } from "./gsap";
import { createHalftoneWave } from "./halftone-wave";
import { whenPageReady } from "./page-ready";

type ContextSafe = <T extends (...args: never[]) => unknown>(fn: T) => T;

/** `clamp`: o que está no fim da página também dispara, mesmo que nunca chegue a 88% da tela. */
const REVEAL_START = "clamp(top 88%)";
const PIN_QUERY = "(min-width: 1024px) and (min-height: 720px)";
const PARALLAX_QUERY = "(min-width: 768px)";
/** A espera pelas fontes nunca atrasa a primeira dobra mais do que isto. */
const FONTS_LIMIT_MS = 400;
/** Se o aviso de hidratação da página nunca chegar, as animações seguem mesmo assim. */
const PAGE_READY_LIMIT_MS = 1500;

const isRendered = (element: Element) => element.getClientRects().length > 0;
const childrenOf = (element: Element) => gsap.utils.toArray<HTMLElement>(element.children);

let hashRestored = false;

/**
 * Página aberta direto em um endereço com âncora: o `refresh` do ScrollTrigger mede a página voltando
 * ao topo e interrompe a rolagem suave do navegador até a âncora, então ela é refeita aqui, uma vez por
 * carregamento. Navegação interna fica com o Next; voltar e recarregar, com a posição do navegador.
 */
function restoreHashTarget() {
  if (hashRestored) return;
  hashRestored = true;
  const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  if (!location.hash || navigation?.type !== "navigate") return;
  document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: "instant" });
}

/** Títulos entram linha a linha por máscara. O texto original volta ao fim; `aria` mantém a leitura. */
function linesTween(element: HTMLElement) {
  const split = SplitText.create(element, { type: "lines", mask: "lines", linesClass: "motion-line", aria: "auto" });
  gsap.set(element, { opacity: 1 });
  return gsap.fromTo(
    split.lines,
    { yPercent: 115 },
    {
      yPercent: 0,
      duration: DURATION.title,
      ease: EASE.expo,
      stagger: 0.09,
      onComplete: () => void split.revert(),
    },
  );
}

function playIntro(items: HTMLElement[], delay: number, speed: number) {
  const timeline = gsap.timeline({ delay }).timeScale(speed);
  for (const element of items) {
    const at = Number(element.dataset.at ?? 0);
    switch (element.dataset.motion) {
      case "intro-lines":
        timeline.add(linesTween(element), at);
        break;
      case "intro-cta":
        gsap.set(element, { opacity: 1 });
        timeline.fromTo(
          childrenOf(element),
          { opacity: 0, y: 18, scale: 0.94 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: EASE.sticker, stagger: 0.09, clearProps: "all" },
          at,
        );
        break;
      // Logotipo revelado por máscara: o brandbook não permite alterar a transparência nem distorcer.
      case "intro-logo":
        gsap.set(element, { opacity: 1 });
        timeline.fromTo(
          element,
          { clipPath: "inset(100% 0% 0% 0%)", y: 26 },
          { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: DURATION.image, ease: EASE.expo, clearProps: "clipPath" },
          at,
        );
        break;
      case "intro-sticker":
        timeline.fromTo(
          element,
          { opacity: 0, scale: 0.2, rotation: -26 },
          { opacity: 1, scale: 1, rotation: 0, duration: DURATION.card, ease: "back.out(1.9)" },
          at,
        );
        break;
      case "intro-icon":
        timeline.fromTo(
          element,
          { opacity: 0, scale: 0.6, rotation: -10 },
          { opacity: 1, scale: 1, rotation: 0, duration: DURATION.section, ease: "back.out(1.8)" },
          at,
        );
        break;
      default:
        timeline.fromTo(
          element,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: DURATION.card, ease: EASE.out },
          at,
        );
    }
  }
  const halftone = document.querySelectorAll<HTMLElement>("[data-motion-halftone]");
  halftone.forEach((layer) => {
    if (!isRendered(layer)) return;
    gsap.to(layer, {
      clipPath: "circle(150% at 78% 45%)",
      duration: 1.4,
      delay,
      ease: EASE.expo,
    });
  });
}

/**
 * Efeitos de uma rota. Tudo o que é criado aqui entra no contexto do GSAP da rota (via `safe`) e é
 * revertido ao trocar de página. Elementos ocultos (rota em Activity, trecho `hidden` no breakpoint
 * atual) esperam: um `scan` posterior os encontra quando aparecerem.
 */
export function createScene(safe: ContextSafe, introDelay: number, introSpeed: number) {
  const seen = new WeakSet<Element>();
  const waves = new Set<() => void>();
  const revealByElement = new WeakMap<Element, () => void>();
  const matchMedia = gsap.matchMedia();
  const distance = globalThis.matchMedia("(max-width: 639px)").matches ? 0.6 : 1;
  let disposed = false;

  // As entradas deslocam os elementos: se uma começar durante um clique, o botão solta fora do link e
  // o navegador descarta o clique. Por isso, nenhuma entrada começa com o botão ou o dedo pressionado.
  let pressing = window.__benjaMotion?.pressing ?? false;
  const afterPress = new Set<() => void>();
  const whenReleased = (task: () => void) => {
    if (pressing) afterPress.add(task);
    else task();
  };
  const onPress = () => {
    pressing = true;
  };
  const onRelease = () => {
    pressing = false;
    // No quadro seguinte: o `click` ainda precisa encontrar o elemento no mesmo lugar.
    requestAnimationFrame(() => {
      if (pressing || disposed) return;
      const tasks = [...afterPress];
      afterPress.clear();
      tasks.forEach((task) => task());
    });
  };
  document.addEventListener("pointerdown", onPress, { capture: true, passive: true });
  document.addEventListener("pointerup", onRelease, { capture: true, passive: true });
  document.addEventListener("pointercancel", onRelease, { capture: true, passive: true });

  const onReveal = (element: HTMLElement, play: () => void) => {
    let played = false;
    const run = safe(() => {
      if (played) return;
      played = true;
      play();
    });
    // `once` encerra o gatilho; `onEnter` pode rodar já na criação, se a página abriu além deste ponto.
    ScrollTrigger.create({ trigger: element, start: REVEAL_START, once: true, onEnter: () => whenReleased(run) });
    revealByElement.set(element, run);
  };

  const revealHeading = (element: HTMLElement) =>
    onReveal(element, () => {
      gsap.set(element, { opacity: 1 });
      const timeline = gsap.timeline();
      childrenOf(element).forEach((child, index) => {
        if (/^H[1-6]$/.test(child.tagName)) {
          timeline.add(linesTween(child), index * 0.08);
        } else {
          // from: a descrição tem opacidade própria (classe) e deve terminar nela, não em 1.
          timeline.from(
            child,
            { opacity: 0, y: 20 * distance, duration: DURATION.card, ease: EASE.out, clearProps: "all" },
            index * 0.12,
          );
        }
      });
    });

  const revealBlock = (element: HTMLElement) =>
    onReveal(element, () => {
      gsap.fromTo(
        element,
        { opacity: 0, y: 36 * distance },
        { opacity: 1, y: 0, duration: DURATION.section, ease: EASE.out, clearProps: "transform" },
      );
    });

  const revealGroup = (element: HTMLElement) =>
    onReveal(element, () => {
      gsap.set(element, { opacity: 1 });
      gsap.fromTo(
        childrenOf(element),
        { opacity: 0, y: 24 * distance },
        { opacity: 1, y: 0, duration: DURATION.card, ease: EASE.out, stagger: 0.07, clearProps: "all" },
      );
    });

  const revealPop = (element: HTMLElement) =>
    onReveal(element, () => {
      gsap.fromTo(
        element,
        { opacity: 0, scale: 0.6, rotation: -10 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: DURATION.section,
          ease: "back.out(1.8)",
          clearProps: "transform",
        },
      );
    });

  const revealImage = (element: HTMLElement) =>
    onReveal(element, () => {
      gsap.set(element, { opacity: 1 });
      gsap.fromTo(
        element,
        { clipPath: "inset(14% 10% 14% 10%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: DURATION.image, ease: EASE.expo, clearProps: "clipPath" },
      );
      const image = element.querySelector("img");
      if (image) {
        gsap.fromTo(image, { scale: 1.16 }, { scale: 1, duration: 1.3, ease: EASE.expo, clearProps: "transform" });
      }
    });

  /** Entrada "sticker": os cards chegam levemente tortos, em cascata, e assentam na grade. */
  const revealCards = (items: HTMLElement[]) => {
    const pending = new Set(items);
    gsap.set(items, {
      opacity: 0,
      y: 48 * distance,
      scale: 0.97,
      rotation: (index: number) => (index % 2 ? 1.6 : -1.6),
    });
    const play = safe((batch: HTMLElement[]) => {
      const entering = batch.filter((item) => pending.delete(item));
      if (!entering.length) return;
      gsap.to(entering, {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        duration: DURATION.card,
        ease: EASE.sticker,
        stagger: 0.08,
        clearProps: "all",
      });
      entering.forEach((item, index) => {
        const media = item.querySelector("[data-card-media]");
        if (!media) return;
        gsap.fromTo(
          media,
          { clipPath: "inset(0% 0% 100% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: DURATION.image,
            delay: index * 0.08,
            ease: EASE.expo,
            clearProps: "clipPath",
          },
        );
      });
    });
    ScrollTrigger.batch(items, {
      start: REVEAL_START,
      once: true,
      onEnter: (batch) => whenReleased(() => play(batch as HTMLElement[])),
    });
    items.forEach((item) => revealByElement.set(item, () => play([item])));
  };

  /** Do briefing à entrega: as etapas acendem uma a uma com a seção presa, só em telas com folga. */
  const buildSteps = (element: HTMLElement) => {
    const items = childrenOf(element);
    const section = element.closest("section");
    const line = section?.querySelector("[data-steps-line]");
    gsap.set(element, { opacity: 1 });
    matchMedia.add(PIN_QUERY, () => {
      // Presa, a seção ocupa a tela abaixo do cabeçalho: sem isso sobra um vazio até a seção seguinte.
      if (section) gsap.set(section, { minHeight: "calc(100vh - 80px)", display: "flex", alignItems: "center" });
      gsap.set(items.slice(1), { opacity: 0.28, y: 28 });
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: section,
          start: "top top+=80",
          end: "+=110%",
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
        },
      });
      if (line) timeline.fromTo(line, { scaleX: 1 / items.length }, { scaleX: 1, duration: items.length - 1 }, 0);
      items.slice(1).forEach((item, index) => {
        timeline.to(item, { opacity: 1, y: 0, duration: 1 }, index);
      });
    });
    matchMedia.add(`not all and ${PIN_QUERY}`, () => revealCards(items));
  };

  const buildScrollEffects = (root: ParentNode) => {
    const fresh = (selector: string) =>
      [...root.querySelectorAll<HTMLElement>(selector)].filter((element) => isRendered(element) && !seen.has(element));

    const parallax = fresh("[data-parallax]");
    const clipped = fresh("[data-clip-reveal]");
    const floating = fresh("[data-float]");
    const tracks = fresh("[data-band-track]");
    [...parallax, ...clipped, ...floating, ...tracks].forEach((element) => seen.add(element));

    if (parallax.length || clipped.length) {
      matchMedia.add(PARALLAX_QUERY, () => {
        parallax.forEach((element) => {
          gsap.fromTo(
            element,
            { y: 0 },
            {
              y: Number(element.dataset.parallax),
              ease: "none",
              scrollTrigger: {
                trigger: element.closest("section") ?? element,
                start: "clamp(top bottom)",
                end: "bottom top",
                scrub: 0.6,
              },
            },
          );
        });
        clipped.forEach((element) => {
          gsap.fromTo(
            element,
            { clipPath: "inset(7% 5% 0% 5% round 40px)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 0px)",
              ease: "none",
              scrollTrigger: { trigger: element, start: "top bottom", end: "top 45%", scrub: 0.4 },
            },
          );
        });
      });
    }

    // Flutuação só enquanto o elemento está na tela: animação infinita não roda à toa.
    floating.forEach((element, index) => {
      const float = gsap.to(element, {
        yPercent: -7,
        duration: 2.8 + index * 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        paused: true,
      });
      ScrollTrigger.create({
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => void (self.isActive ? float.play() : float.pause()),
      });
    });

    // A faixa da marca anda com a rolagem do usuário: sem loop automático para pausar (WCAG 2.2.2).
    tracks.forEach((track) => {
      gsap.fromTo(
        track,
        { xPercent: 0 },
        {
          xPercent: -12,
          ease: "none",
          scrollTrigger: {
            trigger: track.parentElement,
            start: "clamp(top bottom)",
            end: "bottom top",
            scrub: 0.5,
          },
        },
      );
    });
  };

  let firstScan = true;

  const runScan = safe(() => {
    for (const trigger of ScrollTrigger.getAll()) {
      const element = trigger.trigger;
      if (element && !element.isConnected) trigger.kill();
    }

    const nodes = [...document.querySelectorAll<HTMLElement>("[data-motion]")].filter(
      (element) => element.dataset.motion !== "chrome" && !seen.has(element) && isRendered(element),
    );
    nodes.forEach((element) => seen.add(element));

    const intro = nodes.filter((element) => element.dataset.motion?.startsWith("intro"));
    if (intro.length) playIntro(intro, firstScan ? introDelay : 0, introSpeed);
    firstScan = false;

    for (const element of nodes) {
      switch (element.dataset.motion) {
        case "heading":
          revealHeading(element);
          break;
        case "lines":
          onReveal(element, () => void linesTween(element));
          break;
        case "reveal":
          revealBlock(element);
          break;
        case "group":
          revealGroup(element);
          break;
        case "pop":
          revealPop(element);
          break;
        case "image":
          revealImage(element);
          break;
        case "steps":
          buildSteps(element);
          break;
        case "cards":
          gsap.set(element, { opacity: 1 });
          break;
      }
    }

    // Itens de uma grade podem chegar depois (filtros de cases): cada um entra uma vez só.
    document.querySelectorAll<HTMLElement>('[data-motion="cards"]').forEach((grid) => {
      if (!isRendered(grid)) return;
      const items = childrenOf(grid).filter((item) => !seen.has(item));
      if (!items.length) return;
      items.forEach((item) => seen.add(item));
      revealCards(items);
    });

    // Banners de erro e sucesso já entram visíveis: a animação nunca atrasa um aviso nem o esconde.
    document.querySelectorAll<HTMLElement>("[data-nudge]").forEach((element) => {
      if (seen.has(element) || !isRendered(element)) return;
      seen.add(element);
      gsap.from(element, { y: -8, scale: 0.985, duration: DURATION.hover, ease: EASE.out, clearProps: "transform" });
    });

    document.querySelectorAll<HTMLElement>("[data-wave]").forEach((host) => {
      if (seen.has(host) || !isRendered(host)) return;
      seen.add(host);
      waves.add(createHalftoneWave(host));
    });

    buildScrollEffects(document);
  });

  const scan = () => whenReleased(runScan);

  let started = false;
  let scanning = false;
  let frame = 0;
  const start = () => {
    if (started || disposed) return;
    started = true;
    clearTimeout(pageReadyLimit);
    frame = requestAnimationFrame(() => {
      // Só no quadro seguinte: o Next já levou a nova rota ao topo e os gatilhos medem a posição certa.
      frame = 0;
      const fontsLimit = new Promise((resolve) => setTimeout(resolve, FONTS_LIMIT_MS));
      void Promise.race([document.fonts?.ready, fontsLimit]).then(() => {
        if (disposed) return;
        scan();
        ScrollTrigger.refresh();
        restoreHashTarget();
        scanning = true;
      });
    });
  };
  const pageReadyLimit = setTimeout(start, PAGE_READY_LIMIT_MS);
  const stopWaiting = whenPageReady(start);

  // Os observadores só agem depois do primeiro scan: antes dele a página pode não estar hidratada, e o
  // próprio streaming do React move nós pelo documento, o que os dispararia cedo demais.
  let pendingScan = 0;
  const scheduleScan = () => {
    if (!scanning || pendingScan || disposed) return;
    pendingScan = requestAnimationFrame(() => {
      pendingScan = 0;
      if (!disposed) scan();
    });
  };

  const mutations = new MutationObserver((records) => {
    if (records.some((record) => [...record.addedNodes].some((node) => node.nodeType === Node.ELEMENT_NODE))) {
      scheduleScan();
    }
  });
  mutations.observe(document.body, { childList: true, subtree: true });

  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  const resizes = new ResizeObserver(() => {
    if (!scanning) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      if (disposed) return;
      scan();
      ScrollTrigger.refresh();
    }, 150);
  });
  resizes.observe(document.body);

  return {
    /** Foco por teclado em um trecho ainda oculto revela o trecho na hora. */
    revealFocused(target: Element) {
      // Clicar também dá foco: com o mouse pressionado, a entrada espera o clique terminar.
      whenReleased(() => {
        let element: Element | null = target;
        while (element) {
          revealByElement.get(element)?.();
          element = element.parentElement;
        }
      });
    },
    dispose() {
      disposed = true;
      document.removeEventListener("pointerdown", onPress, { capture: true });
      document.removeEventListener("pointerup", onRelease, { capture: true });
      document.removeEventListener("pointercancel", onRelease, { capture: true });
      stopWaiting();
      clearTimeout(pageReadyLimit);
      waves.forEach((stop) => stop());
      if (frame) cancelAnimationFrame(frame);
      if (pendingScan) cancelAnimationFrame(pendingScan);
      clearTimeout(refreshTimer);
      mutations.disconnect();
      resizes.disconnect();
      matchMedia.revert();
    },
  };
}
