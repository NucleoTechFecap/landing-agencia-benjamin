/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : page-transition.ts
 Descrição    : Cortina entre páginas, que acompanha o roteador sem atrasar o clique.

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

import { DURATION, gsap } from "./gsap";

const HIDDEN_BELOW = "inset(100% 0% 0% 0%)";
const COVERED = "inset(0% 0% 0% 0%)";
const HIDDEN_ABOVE = "inset(0% 0% 100% 0%)";
const COVER_DURATION = 0.28;
/** Navegação lenta não prende a cortina na tela: a página sai dela mesmo sem a rota nova. */
const COVER_LIMIT_MS = 1800;

export interface PageTransition {
  /** Chamado a cada rota nova. Retorna quanto a entrada da página deve esperar a cortina, em segundos. */
  enter(): number;
  dispose(): void;
}

/**
 * Cortina entre páginas. Só acompanha a navegação do Next: o clique segue direto para o roteador, sem
 * atraso, e voltar, avançar, links externos e downloads ficam de fora.
 */
export function createPageTransition(curtain: HTMLElement): PageTransition {
  let firstRoute = true;
  let covering: gsap.core.Tween | null = null;
  let limitTimer: ReturnType<typeof setTimeout> | undefined;

  const uncover = (delay = 0) => {
    clearTimeout(limitTimer);
    covering = null;
    gsap.to(curtain, {
      clipPath: HIDDEN_ABOVE,
      duration: DURATION.page,
      delay,
      ease: "power3.inOut",
      overwrite: "auto",
      onComplete: () => void gsap.set(curtain, { clipPath: HIDDEN_BELOW, visibility: "hidden" }),
    });
  };

  const cover = () => {
    clearTimeout(limitTimer);
    gsap.set(curtain, { visibility: "visible" });
    covering = gsap.fromTo(
      curtain,
      { clipPath: HIDDEN_BELOW },
      { clipPath: COVERED, duration: COVER_DURATION, ease: "power3.inOut", overwrite: "auto" },
    );
    limitTimer = setTimeout(uncover, COVER_LIMIT_MS);
  };

  const onClick = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest?.<HTMLAnchorElement>("a[href]");
    if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname) return;
    cover();
  };

  // Na captura: o <Link> chama preventDefault e navega durante a propagação do clique.
  document.addEventListener("click", onClick, true);

  return {
    enter() {
      if (firstRoute) {
        firstRoute = false;
        return 0;
      }
      if (!covering) return 0;
      const remaining = Math.max(covering.duration() - covering.time(), 0);
      uncover(remaining);
      return remaining + 0.1;
    },
    dispose() {
      clearTimeout(limitTimer);
      document.removeEventListener("click", onClick, true);
      gsap.killTweensOf(curtain);
    },
  };
}
