/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : page-ready.tsx
 Descrição    : Sinal de que a página foi hidratada, para o motor poder dividir os títulos.

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

import { useLayoutEffect } from "react";

let mounted = 0;
const waiting = new Set<() => void>();

/** Chama `callback` quando a página visível já estiver hidratada. Retorna como desistir da espera. */
export function whenPageReady(callback: () => void) {
  if (mounted > 0) {
    callback();
    return () => undefined;
  }
  waiting.add(callback);
  return () => void waiting.delete(callback);
}

/**
 * Avisa o motor de animação que a página foi hidratada. Cada rota do Next é uma fronteira de hidratação
 * própria (Activity), que pode terminar depois do layout; dividir um título em linhas antes disso gera
 * erro de hidratação. Precisa ficar dentro da página, junto dos títulos (PageHero, HeroManifesto).
 */
export function PageReady() {
  useLayoutEffect(() => {
    mounted += 1;
    waiting.forEach((callback) => callback());
    waiting.clear();
    return () => {
      mounted -= 1;
    };
  }, []);
  return null;
}
