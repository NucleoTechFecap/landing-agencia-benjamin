/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : gsap.ts
 Descrição    : Registro do GSAP e dos plugins usados, com durações e curvas da linguagem de movimento.

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

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

// Único ponto que importa o GSAP: este módulo só entra no chunk carregado por MotionRoot.
gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
gsap.config({ nullTargetWarn: false });
ScrollTrigger.config({ ignoreMobileResize: true });

/** Durações da linguagem de movimento, em segundos. */
export const DURATION = {
  micro: 0.2,
  hover: 0.3,
  card: 0.7,
  section: 0.85,
  title: 1,
  image: 1.1,
  page: 0.42,
} as const;

/**
 * Curvas da linguagem de movimento. `sticker` é a assinatura da marca: uma pequena passada
 * do ponto final, como um adesivo colado na página.
 */
export const EASE = {
  out: "power3.out",
  soft: "power2.out",
  expo: "expo.out",
  inOut: "power2.inOut",
  sticker: "back.out(1.5)",
} as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
