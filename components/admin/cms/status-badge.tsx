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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import { PUBLICATION_STATUS_LABELS, type PublicationStatus } from "@/lib/domain/content/publication-status";

const TONES: Record<PublicationStatus, { box: string; dot: string }> = {
  draft: { box: "border-studio-controle bg-white text-benja-noite", dot: "border-[1.5px] border-benja-noite" },
  published: { box: "border-benja-verde bg-benja-claro text-benja-verde", dot: "bg-benja-verde" },
  archived: { box: "border-studio-linha bg-studio-realce text-studio-suave", dot: "bg-studio-suave" },
};

export const badgeBase =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold whitespace-nowrap";

/** Estado do item com texto (não só cor), para leitura por leitor de tela. */
export function StatusBadge({ status, provisional }: { status: PublicationStatus; provisional?: boolean }) {
  const tone = TONES[status];
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className={`${badgeBase} ${tone.box}`}>
        <span aria-hidden className={`size-2 rounded-full ${tone.dot}`} />
        {PUBLICATION_STATUS_LABELS[status]}
      </span>
      {provisional ? (
        <span className={`${badgeBase} border-dashed border-benja-laranja bg-white text-benja-noite`}>Provisório</span>
      ) : null}
    </span>
  );
}
