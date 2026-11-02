/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : engine.tsx
 Descrição    : Motor de animação do site público: contexto por rota, cortina e limpeza.

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

"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import { setupChrome, syncNavPill } from "./chrome";
import { useGSAP } from "./gsap";
import { setupInteractions } from "./interactions";
import { exitLoader } from "./loader";
import { createPageTransition, type PageTransition } from "./page-transition";
import { createScene } from "./scene";

/** Depois da tela de carregamento, as páginas abrem mais rápido: a abertura longa acontece uma vez. */
const REPEAT_INTRO_SPEED = 1.4;

/**
 * Motor de animação do site público. Os componentes de servidor só declaram `data-motion`; aqui
 * ficam os efeitos, um contexto por rota e a limpeza. Com Cache Components a rota anterior continua
 * no DOM (Activity, `display: none`): cada troca de rota reverte tudo e recomeça na página visível.
 */
export default function MotionEngine() {
  const pathname = usePathname();
  const curtainRef = useRef<HTMLDivElement>(null);
  const transition = useRef<PageTransition | null>(null);
  const intro = useRef({ delay: 0, speed: REPEAT_INTRO_SPEED });

  useLayoutEffect(() => {
    const created = createPageTransition(curtainRef.current!);
    transition.current = created;
    return () => {
      transition.current = null;
      created.dispose();
    };
  }, []);

  // Fora do contexto do GSAP de propósito: tela de carregamento e cortina atravessam as rotas e não
  // podem ser revertidas com elas.
  useLayoutEffect(() => {
    const afterLoader = exitLoader();
    const afterCurtain = transition.current?.enter() ?? 0;
    intro.current = {
      delay: Math.max(afterLoader, afterCurtain),
      speed: afterLoader > 0 ? 1 : REPEAT_INTRO_SPEED,
    };
  }, [pathname]);

  useGSAP(() => setupChrome(intro.current.delay), []);

  useGSAP(
    (_context, contextSafe) => {
      const safe = contextSafe!;
      const scene = createScene(safe, intro.current.delay, intro.current.speed);
      const stopInteractions = setupInteractions(safe, scene.revealFocused);
      syncNavPill();
      return () => {
        stopInteractions();
        scene.dispose();
      };
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <div
      ref={curtainRef}
      aria-hidden
      className="pointer-events-none invisible fixed inset-0 z-50 flex items-center justify-center bg-benja-verde"
      style={{ clipPath: "inset(100% 0% 0% 0%)" }}
    >
      <div className="halftone absolute inset-0 text-benja-lima opacity-40" />
      <Image src="/brand/logos/simbolo.svg" alt="" width={110} height={103} className="relative h-auto w-[110px]" />
    </div>
  );
}
