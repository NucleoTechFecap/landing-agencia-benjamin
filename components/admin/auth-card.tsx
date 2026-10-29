/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : auth-card.tsx
 Descrição    : Moldura visual das telas de autenticação do painel.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 29/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
 26/10/2026 Vinícius Nishimura Reis  Logotipo horizontal em SVG (UX-14).
 29/10/2026 Caio Moraes              Cores via tokens do tema (ADM-04).
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";
import type { ReactNode } from "react";

/** Moldura das telas de autenticação do painel. */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border-2 border-benja-verde bg-benja-nyanza p-8 shadow-[8px_8px_0_var(--color-benja-verde)]">
        <Image
          src="/brand/logos/logo-horizontal.svg"
          alt="Agência Benjamin"
          width={180}
          height={117}
          className="mx-auto mb-6 h-auto w-44"
          priority
        />
        <h1 className="text-center text-2xl font-black text-benja-verde">{title}</h1>
        {subtitle ? (
          <p className="mt-1 mb-6 text-center text-sm text-benja-grafite/80">{subtitle}</p>
        ) : (
          <div className="mb-6" />
        )}
        {children}
      </div>
    </main>
  );
}
