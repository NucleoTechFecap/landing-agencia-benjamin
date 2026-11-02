/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : chrome.ts
 Descrição    : Cabeçalho animado: entrada, progresso de leitura, estado rolado e destaque do menu.

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

import { DURATION, EASE, gsap, ScrollTrigger } from "./gsap";

const SCROLLED_AFTER_PX = 12;

let moveNavPillTo: ((link: HTMLElement | null) => void) | null = null;

/** Coloca o destaque da navegação no item da página atual (ou o esconde, fora do menu principal). */
export function syncNavPill() {
  moveNavPillTo?.(document.querySelector<HTMLElement>('[data-nav] a[aria-current="page"]'));
}

function setupNavPill() {
  const nav = document.querySelector<HTMLElement>("[data-nav]");
  const pill = nav?.querySelector<HTMLElement>("[data-nav-pill]");
  if (!nav || !pill) return () => undefined;

  const options = { duration: 0.35, ease: "power3" };
  const toX = gsap.quickTo(pill, "x", options);
  const toY = gsap.quickTo(pill, "y", options);
  const toWidth = gsap.quickTo(pill, "width", options);
  const toHeight = gsap.quickTo(pill, "height", options);
  const toOpacity = gsap.quickTo(pill, "opacity", { duration: DURATION.micro, ease: "power2" });
  let placed = false;

  moveNavPillTo = (link) => {
    if (!link) {
      toOpacity(0);
      placed = false;
      return;
    }
    // Medidas de layout, não getBoundingClientRect: não mudam enquanto o item ainda está entrando.
    const { offsetLeft: x, offsetTop: y, offsetWidth: width, offsetHeight: height } = link;
    // Na primeira aparição o destaque nasce no lugar, sem atravessar a barra a partir do canto.
    toX(x, placed ? undefined : x);
    toY(y, placed ? undefined : y);
    toWidth(width, placed ? undefined : width);
    toHeight(height, placed ? undefined : height);
    toOpacity(1);
    placed = true;
  };

  const onEnter = (event: Event) => {
    const link = (event.target as Element).closest?.<HTMLElement>("a");
    if (link) moveNavPillTo?.(link);
  };

  nav.addEventListener("pointerover", onEnter);
  nav.addEventListener("focusin", onEnter);
  nav.addEventListener("pointerleave", syncNavPill);
  nav.addEventListener("focusout", syncNavPill);
  window.addEventListener("resize", syncNavPill);
  return () => {
    moveNavPillTo = null;
    nav.removeEventListener("pointerover", onEnter);
    nav.removeEventListener("focusin", onEnter);
    nav.removeEventListener("pointerleave", syncNavPill);
    nav.removeEventListener("focusout", syncNavPill);
    window.removeEventListener("resize", syncNavPill);
  };
}

/** Cabeçalho: entrada única por carregamento, progresso de leitura, estado rolado e destaque do menu. */
export function setupChrome(delay: number) {
  const parts = gsap.utils.toArray<HTMLElement>('[data-motion="chrome"]');
  gsap.set(parts, { opacity: 1 });
  const items = parts.flatMap((part) =>
    part.tagName === "UL" ? gsap.utils.toArray<HTMLElement>(part.children) : part,
  );
  gsap.fromTo(
    items,
    // Clique já em andamento (ver `whenReleased` em scene.ts): o item aparece sem sair do lugar.
    { opacity: 0, y: window.__benjaMotion?.pressing ? 0 : -14 },
    { opacity: 1, y: 0, duration: DURATION.card, delay, ease: EASE.out, stagger: 0.05, clearProps: "transform" },
  );

  const progress = document.querySelector("[data-scroll-progress]");
  if (progress) {
    gsap.fromTo(
      progress,
      { scaleX: 0 },
      { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } },
    );
  }

  const header = document.querySelector("[data-site-header]");
  if (header) {
    ScrollTrigger.create({
      start: SCROLLED_AFTER_PX,
      end: "max",
      onToggle: (self) => header.toggleAttribute("data-scrolled", self.isActive),
    });
  }

  return setupNavPill();
}
