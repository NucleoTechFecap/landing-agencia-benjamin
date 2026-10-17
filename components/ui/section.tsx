/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : section.tsx
 Descrição    : Seção com tons de cor do brandbook e textura halftone opcional.

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
import { Container } from "./container";

/** Tons de seção do sistema de cores variadas (UX-05), com contraste AA garantido. */
export const SECTION_TONES = {
  nyanza: "bg-benja-nyanza text-benja-noite",
  verde: "bg-benja-verde text-benja-nyanza",
  lima: "bg-benja-lima text-benja-verde",
  claro: "bg-benja-claro text-benja-verde",
  laranja: "bg-benja-laranja text-benja-noite",
  azul: "bg-benja-azul text-benja-nyanza",
  rosa: "bg-benja-rosa text-benja-noite",
  creme: "bg-benja-creme text-benja-noite",
} as const;

export type SectionTone = keyof typeof SECTION_TONES;

export function Section({
  id,
  tone = "nyanza",
  halftone = false,
  className = "",
  containerClassName = "",
  labelledBy,
  children,
}: {
  id?: string;
  tone?: SectionTone;
  halftone?: boolean;
  className?: string;
  containerClassName?: string;
  labelledBy?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`relative overflow-hidden py-16 sm:py-24 ${SECTION_TONES[tone]} ${className}`}
    >
      {halftone ? <div aria-hidden className="halftone pointer-events-none absolute inset-0 opacity-60" /> : null}
      <Container className={`relative ${containerClassName}`}>{children}</Container>
    </section>
  );
}
