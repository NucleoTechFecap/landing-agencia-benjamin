/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : motion-gate.tsx
 Descrição    : Script inline que liga as animações e a tela de carregamento antes da primeira pintura.

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

/** Tempo máximo (ms) com o conteúdo oculto à espera do motor; depois o site segue sem animação. */
const MOTION_TIMEOUT_MS = 2000;

const script = `(function(){try{var h=document.documentElement;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;h.classList.add("motion");var s=window.__benjaMotion={shownAt:performance.now(),pressing:false};["pointerdown","pointerup","pointercancel"].forEach(function(t){addEventListener(t,function(){s.pressing=t==="pointerdown"},{capture:true,passive:true})});try{if(!sessionStorage.getItem("benja-loader")){sessionStorage.setItem("benja-loader","1");h.classList.add("motion-loading")}}catch(e){}s.timer=setTimeout(function(){h.classList.remove("motion","motion-loading");s.expired=true},${MOTION_TIMEOUT_MS})}catch(e){}})()`;

/**
 * Liga o estado inicial das animações antes da primeira pintura, e a tela de carregamento na primeira
 * página da sessão. Sem JavaScript ou com movimento reduzido nada disso é aplicado, e todo o conteúdo
 * aparece direto; se o motor demorar ou falhar, o temporizador libera o conteúdo (ver `html.motion` em
 * globals.css). Também registra se há um clique em andamento desde já: ele pode começar antes de o motor
 * carregar, e as entradas animadas precisam esperá-lo (ver `whenReleased` em scene.ts).
 */
export function MotionGate() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
