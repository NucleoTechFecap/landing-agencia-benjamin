/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : menu.ts
 Descrição    : Abertura e fechamento animados do menu mobile.

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

import { EASE, gsap } from "./gsap";

const CLOSED = "inset(0% 0% 100% 0% round 24px)";
// Folga negativa: o recorte aberto não pode cortar a sombra dura do painel.
const OPEN = "inset(-16px -16px -16px -16px round 24px)";

export function openMenu(panel: HTMLElement) {
  const items = panel.querySelectorAll("li");
  gsap.killTweensOf([panel, ...items]);
  gsap.fromTo(panel, { clipPath: CLOSED }, { clipPath: OPEN, duration: 0.38, ease: EASE.out, clearProps: "clipPath" });
  gsap.fromTo(
    items,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.34, delay: 0.06, ease: EASE.out, stagger: 0.035, clearProps: "all" },
  );
}

export function closeMenu(panel: HTMLElement, onComplete: () => void) {
  gsap.killTweensOf([panel, ...panel.querySelectorAll("li")]);
  gsap.to(panel, {
    clipPath: CLOSED,
    duration: 0.24,
    ease: "power2.in",
    clearProps: "clipPath",
    onComplete,
  });
}
