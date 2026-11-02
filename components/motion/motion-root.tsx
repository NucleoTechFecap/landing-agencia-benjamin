/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : motion-root.tsx
 Descrição    : Carrega o motor de animação fora do bundle principal e o desliga com movimento reduzido.

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

import { Component, useEffect, useState, type ComponentType, type ReactNode } from "react";

declare global {
  interface Window {
    __benjaMotion?: {
      shownAt?: number;
      pressing?: boolean;
      timer?: ReturnType<typeof setTimeout>;
      expired?: boolean;
    };
  }
}

type EngineModule = { default: ComponentType };

let enginePromise: Promise<EngineModule> | null = null;
const loadEngine = () => (enginePromise ??= import("./engine"));

// Começa a baixar antes da hidratação quando a animação vai rodar: o conteúdo já está à espera dela.
if (typeof window !== "undefined" && document.documentElement.classList.contains("motion")) {
  loadEngine().catch(() => undefined);
}

const stopMotion = () => document.documentElement.classList.remove("motion", "motion-loading");

/** Um erro de animação nunca derruba a página: o site segue, sem movimento. */
class MotionBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    stopMotion();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/** Carrega o motor de animação fora do bundle principal e o desliga com movimento reduzido. */
export function MotionRoot() {
  const [Engine, setEngine] = useState<ComponentType | null>(null);

  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || window.__benjaMotion?.expired) {
      stopMotion();
      return;
    }
    document.documentElement.classList.add("motion");
    let cancelled = false;
    loadEngine()
      .then((module) => {
        if (cancelled || window.__benjaMotion?.expired) return;
        clearTimeout(window.__benjaMotion?.timer);
        setEngine(() => module.default);
      })
      .catch(stopMotion);
    const onChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      setEngine(null);
      stopMotion();
    };
    reduced.addEventListener("change", onChange);
    return () => {
      cancelled = true;
      reduced.removeEventListener("change", onChange);
      clearTimeout(window.__benjaMotion?.timer);
      stopMotion();
    };
  }, []);

  return Engine ? (
    <MotionBoundary>
      <Engine />
    </MotionBoundary>
  ) : null;
}
