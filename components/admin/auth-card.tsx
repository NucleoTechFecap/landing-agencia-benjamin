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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
 26/10/2026 Vinícius Nishimura Reis  Logotipo horizontal em SVG (UX-14).
 29/10/2026 Caio Moraes              Cores via tokens do tema (ADM-04).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";
import type { ReactNode } from "react";
import { Sticker } from "@/components/ui/sticker";

/**
 * Moldura das telas de acesso: à esquerda o campo de cor da marca, como nas capas do brandbook, e à
 * direita o formulário. No celular a marca vira uma faixa curta, para o formulário aparecer sem rolar.
 */
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="studio grid min-h-dvh bg-studio-papel text-benja-noite lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="studio-reticula relative flex items-center gap-4 overflow-hidden bg-benja-lima px-6 py-5 lg:flex-col lg:items-start lg:justify-between lg:p-12">
        <Image
          src="/brand/logos/logo-horizontal.svg"
          alt="Agência Benjamin"
          width={180}
          height={117}
          priority
          className="h-auto w-28 lg:w-44"
        />
        <div className="hidden max-w-md lg:block">
          <p className="text-5xl leading-[1.1] font-black text-balance text-benja-verde">Benjamin Studio</p>
          <p className="mt-3 text-lg font-medium text-benja-noite">
            Os conteúdos, projetos e informações da agência em um só lugar.
          </p>
        </div>
        <Sticker name="benja" color="verde" width={130} className="absolute top-10 right-10 hidden rotate-6 lg:block" />
      </aside>
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl leading-tight font-black text-benja-verde">{title}</h1>
          {subtitle ? <p className="mt-2 text-studio-suave">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
