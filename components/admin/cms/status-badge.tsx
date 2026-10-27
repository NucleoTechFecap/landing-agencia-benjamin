/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : status-badge.tsx
 Descrição    : Selo do estado de publicação (rascunho, publicado, arquivado) no painel.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
──────────────────────────────────────────────────────────────────────────────
*/

import { PUBLICATION_STATUS_LABELS, type PublicationStatus } from "@/lib/domain/content/publication-status";

const TONES: Record<PublicationStatus, string> = {
  draft: "border-benja-noite/30 bg-white text-benja-noite",
  published: "border-benja-verde bg-benja-claro text-benja-verde",
  archived: "border-benja-grafite/30 bg-benja-creme text-benja-grafite/80",
};

/** Estado do item com texto (não só cor), para leitura por leitor de tela. */
export function StatusBadge({ status, provisional }: { status: PublicationStatus; provisional?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={`rounded-full border-2 px-2.5 py-0.5 text-xs font-bold ${TONES[status]}`}>
        {PUBLICATION_STATUS_LABELS[status]}
      </span>
      {provisional ? (
        <span className="rounded-full border-2 border-dashed border-benja-laranja px-2.5 py-0.5 text-xs font-bold text-benja-noite">
          Provisório
        </span>
      ) : null}
    </span>
  );
}
