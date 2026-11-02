/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : interactions.ts
 Descrição    : Hover de cards, botões magnéticos e foco por teclado, delegados no documento.

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

import { DURATION, EASE, gsap } from "./gsap";

type ContextSafe = <T extends (...args: never[]) => unknown>(fn: T) => T;

const MAX_TILT_DEG = 3;
const MAX_MAGNET_PX = 10;
const MAGNET_STRENGTH = 0.28;

interface CardState {
  hover: gsap.core.Timeline;
  rotateX?: gsap.QuickToFunc;
  rotateY?: gsap.QuickToFunc;
}

function buildCard(card: HTMLElement): CardState {
  const soft = card.dataset.card === "soft";
  const hover = gsap.timeline({ paused: true, defaults: { duration: DURATION.hover, ease: EASE.out } });
  hover.to(card, soft ? { y: -3 } : { x: -2, y: -5 }, 0);

  // A sombra dura ("sticker") cresce junto com o card. O Tailwind compõe várias sombras transparentes
  // antes dela, então só a última muda; cards sem a sombra da marca não animam essa propriedade.
  const shadow = getComputedStyle(card).boxShadow;
  const raised = shadow.replace(/4px 4px 0px 0px$/, "8px 8px 0px 0px");
  if (raised !== shadow) hover.fromTo(card, { boxShadow: shadow }, { boxShadow: raised }, 0);

  const icon = card.querySelector("[data-card-icon]");
  if (icon) hover.to(icon, { scale: 1.14, rotation: -7, y: -3, ease: "back.out(2.4)" }, 0);
  const arrow = card.querySelector("[data-card-arrow]");
  if (arrow) hover.to(arrow, { x: 7 }, 0);
  const media = card.querySelector("[data-card-media] img");
  if (media) hover.to(media, { scale: 1.07, duration: DURATION.card, ease: EASE.soft, overwrite: "auto" }, 0);

  if (soft) return { hover };
  gsap.set(card, { transformPerspective: 900 });
  return {
    hover,
    rotateX: gsap.quickTo(card, "rotationX", { duration: 0.4, ease: "power3" }),
    rotateY: gsap.quickTo(card, "rotationY", { duration: 0.4, ease: "power3" }),
  };
}

/**
 * Hover dos cards, botões magnéticos e foco por teclado, delegados no documento: um conjunto de
 * ouvintes atende todos os elementos, inclusive os que chegam depois (Suspense, filtros). Só o mouse
 * ativa os efeitos de ponteiro, então telas de toque nunca os recebem, qualquer que seja a largura.
 */
export function setupInteractions(safe: ContextSafe, revealFocused: (target: Element) => void) {
  const cards = new Map<HTMLElement, CardState>();
  let hoveredCard: HTMLElement | null = null;
  let magnet: { element: HTMLElement; toX: gsap.QuickToFunc; toY: gsap.QuickToFunc } | null = null;

  const cardState = safe((card: HTMLElement) => {
    let state = cards.get(card);
    if (!state) {
      state = buildCard(card);
      cards.set(card, state);
    }
    return state;
  });

  const releaseCard = (card: HTMLElement) => {
    const state = cardState(card);
    if (!card.matches(":has(:focus-visible)")) state.hover.reverse();
    state.rotateX?.(0);
    state.rotateY?.(0);
  };

  const releaseMagnet = () => {
    magnet?.toX(0);
    magnet?.toY(0);
    magnet = null;
  };

  const onPointerMove = safe((event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const target = event.target as Element;

    const card = target.closest?.<HTMLElement>("[data-card]") ?? null;
    if (card !== hoveredCard) {
      if (hoveredCard) releaseCard(hoveredCard);
      hoveredCard = card;
      if (card) cardState(card).hover.play();
    }
    if (card) {
      const { rotateX, rotateY } = cardState(card);
      if (rotateX && rotateY) {
        const rect = card.getBoundingClientRect();
        rotateY(((event.clientX - rect.left) / rect.width - 0.5) * MAX_TILT_DEG * 2);
        rotateX(((event.clientY - rect.top) / rect.height - 0.5) * -MAX_TILT_DEG * 2);
      }
    }

    const element = target.closest?.<HTMLElement>("[data-magnetic]") ?? null;
    if (element !== magnet?.element) {
      releaseMagnet();
      if (element) {
        const options = { duration: 0.35, ease: "power3" };
        magnet = { element, toX: gsap.quickTo(element, "x", options), toY: gsap.quickTo(element, "y", options) };
      }
    }
    if (magnet) {
      const rect = magnet.element.getBoundingClientRect();
      const clamp = gsap.utils.clamp(-MAX_MAGNET_PX, MAX_MAGNET_PX);
      magnet.toX(clamp((event.clientX - (rect.left + rect.width / 2)) * MAGNET_STRENGTH));
      magnet.toY(clamp((event.clientY - (rect.top + rect.height / 2)) * MAGNET_STRENGTH));
    }
  });

  const onPointerLeave = () => {
    if (hoveredCard) releaseCard(hoveredCard);
    hoveredCard = null;
    releaseMagnet();
  };

  const onPointerDown = safe((event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const card = (event.target as Element).closest?.<HTMLElement>("[data-card]:not([data-card='soft'])");
    if (card) gsap.to(card, { scale: 0.985, duration: 0.12, ease: EASE.soft, overwrite: "auto" });
  });

  const onPointerUp = safe(() => {
    if (hoveredCard) gsap.to(hoveredCard, { scale: 1, duration: DURATION.hover, ease: EASE.out, overwrite: "auto" });
  });

  const onFocusIn = safe((event: FocusEvent) => {
    const target = event.target as Element;
    revealFocused(target);
    if (!target.matches?.(":focus-visible")) return;
    const card = target.closest?.<HTMLElement>("[data-card]");
    if (card) cardState(card).hover.play();
  });

  const onFocusOut = safe((event: FocusEvent) => {
    const card = (event.target as Element).closest?.<HTMLElement>("[data-card]");
    if (card && card !== hoveredCard) cardState(card).hover.reverse();
  });

  document.addEventListener("pointermove", onPointerMove, { passive: true });
  document.documentElement.addEventListener("pointerleave", onPointerLeave);
  document.addEventListener("pointerdown", onPointerDown, { passive: true });
  document.addEventListener("pointerup", onPointerUp, { passive: true });
  document.addEventListener("focusin", onFocusIn);
  document.addEventListener("focusout", onFocusOut);

  return () => {
    document.removeEventListener("pointermove", onPointerMove);
    document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("focusin", onFocusIn);
    document.removeEventListener("focusout", onFocusOut);
  };
}
