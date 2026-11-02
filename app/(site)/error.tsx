/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : error.tsx
 Descrição    : Tela de erro das páginas públicas com código de atendimento.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 29/10/2026 Caio Moraes              Botão "Tentar novamente" com o estilo padrão (INT-01).
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { ErrorState } from "@/components/ui/states";

/** Erro inesperado em páginas públicas: mensagem amigável + código para atendimento (ARC-09). */
export default function SiteError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <ErrorState error={error} retry={retry} description="Já registramos o problema. Tente de novo em instantes." />
  );
}
