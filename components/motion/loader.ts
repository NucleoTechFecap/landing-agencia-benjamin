/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : loader.ts
 Descrição    : Saída da tela de carregamento com GSAP.

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

/** Tempo mínimo na tela para a abertura em CSS terminar: abaixo disso a tela só pisca. */
const MIN_ON_SCREEN_MS = 900;
const WIPE_DURATION = 0.6;

let exiting = false;

/**
 * Tira a tela de carregamento assim que o motor está pronto. Retorna quanto a entrada da página espera
 * para começar enquanto a tela sobe, em segundos (0 quando a tela não está aberta). O limite máximo
 * fica em MotionGate: se o motor não chegar a tempo, a tela sai sem depender deste código.
 */
export function exitLoader() {
  const html = document.documentElement;
  const loader = document.querySelector<HTMLElement>("[data-loader]");
  if (exiting || !loader || !html.classList.contains("motion-loading")) return 0;
  exiting = true;

  const shownAt = window.__benjaMotion?.shownAt ?? 0;
  const wait = Math.max(MIN_ON_SCREEN_MS - (performance.now() - shownAt), 0) / 1000;
  const fill = loader.querySelector("[data-loader-fill]");
  const stickers = loader.querySelectorAll("[data-loader-sticker]");

  const timeline = gsap.timeline({
    delay: wait,
    onComplete: () => {
      html.classList.remove("motion-loading");
      exiting = false;
    },
  });
  // A abertura em CSS mantém o estado final (fill-mode): sem desligá-la, ela vence os estilos do GSAP.
  if (fill) {
    timeline.fromTo(fill, { animation: "none", scaleX: 0.85 }, { scaleX: 1, duration: 0.22, ease: EASE.out });
  }
  if (stickers.length) {
    timeline.fromTo(
      stickers,
      { animation: "none", scale: 1 },
      { scale: 0, duration: 0.2, ease: "power2.in", stagger: 0.04 },
      0.04,
    );
  }
  timeline.to(loader, { clipPath: "inset(0% 0% 100% 0%)", duration: WIPE_DURATION, ease: "power3.inOut" }, 0.2);
  return wait + 0.2 + WIPE_DURATION * 0.45;
}
