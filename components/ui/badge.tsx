/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : badge.tsx
 Descrição    : Selos de destaque e de conteúdo provisório.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { ReactNode } from "react";

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border-2 border-benja-noite bg-benja-nyanza px-3 py-0.5 text-xs font-bold text-benja-verde ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * Selo exibido em conteúdo ainda provisório (PRJ §40 / CON-13). Some quando o texto
 * final for publicado pela Benjamin; o gate de release impede ir ao ar com ele.
 */
export function ProvisionalBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Texto provisório aguardando a versão final da Agência Benjamin"
      className={`inline-flex items-center gap-1 rounded-full border-2 border-dashed border-benja-laranja bg-benja-nyanza px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-benja-grafite uppercase ${className}`}
    >
      Conteúdo provisório
    </span>
  );
}
