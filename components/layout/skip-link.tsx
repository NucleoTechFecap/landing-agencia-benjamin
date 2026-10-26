/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : skip-link.tsx
 Descrição    : Link para pular direto ao conteúdo principal.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 25/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 25/10/2026 Caio Moraes              Faixa no topo e foco reiniciado a cada página (LAY-02).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Primeiro foco da página: pula direto para o conteúdo principal (WCAG 2.4.1).
 * Em foco, vira uma faixa acima do header, sem cobrir o logo nem o menu. A cada
 * troca de página o foco volta ao início, então o próximo Tab recomeça por este
 * link, como numa página recém-aberta (LAY-02).
 */
export function SkipLink() {
  const pathname = usePathname();
  const topRef = useRef<HTMLDivElement>(null);
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    topRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div ref={topRef} tabIndex={-1} className="outline-none!">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:block focus:w-full focus:border-b-2 focus:border-benja-noite focus:bg-benja-lima focus:px-4 focus:py-3 focus:text-center focus:text-sm focus:font-black focus:tracking-widest focus:text-benja-verde focus:uppercase focus-visible:outline-offset-[-6px]!"
      >
        Pular para o conteúdo
      </a>
    </div>
  );
}
