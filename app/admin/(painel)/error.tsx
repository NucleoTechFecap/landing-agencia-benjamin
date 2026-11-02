/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : error.tsx
 Descrição    : Erro inesperado nas telas do painel.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { ErrorState } from "@/components/ui/states";

/** Erro inesperado no painel: não leva a pessoa para fora nem perde o caminho de volta (LAY-07). */
export default function PanelError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <ErrorState
      error={error}
      retry={retry}
      description="Nada foi perdido do que já estava salvo. Tente de novo; se persistir, envie o código ao NúcleoTech."
      home={{ href: "/admin", label: "Voltar ao painel" }}
    />
  );
}
