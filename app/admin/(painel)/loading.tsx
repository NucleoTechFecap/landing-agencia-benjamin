/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : loading.tsx
 Descrição    : Espera das telas do painel, com a casca de pé.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (reestruturação do painel).
──────────────────────────────────────────────────────────────────────────────
*/

import { SkeletonBlocks } from "@/components/admin/ui/primitives";

/** Troca de tela no painel: todas dependem da requisição, então a casca fica e o conteúdo mostra que está vindo. */
export default function PanelLoading() {
  return (
    <div role="status" aria-label="Carregando a tela">
      <div aria-hidden className="mb-8 h-10 w-64 max-w-full animate-pulse rounded-studio-md bg-studio-realce" />
      <SkeletonBlocks count={6} className="sm:grid-cols-2 xl:grid-cols-3" />
    </div>
  );
}
