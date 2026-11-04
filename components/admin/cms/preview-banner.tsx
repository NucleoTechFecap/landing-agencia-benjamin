/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : preview-banner.tsx
 Descrição    : Faixa da prévia: diz o estado do item e volta ao painel.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-14).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import type { PublicationStatus } from "@/lib/domain/content/publication-status";
import { StatusBadge } from "./status-badge";

const STATUS_NOTE: Record<PublicationStatus, string> = {
  draft: "Este rascunho ainda não está no site.",
  published: "Esta é a versão que está no site.",
  archived: "Este item está arquivado e fora do site.",
};

/** Sempre visível: quem olha a prévia precisa saber que aquilo não é o site. */
export function PreviewBanner({
  status,
  backHref,
  note,
}: {
  status: PublicationStatus;
  backHref: string;
  note?: string;
}) {
  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b-2 border-benja-noite bg-white px-6 py-3 text-sm text-benja-noite"
    >
      <p className="flex flex-wrap items-center gap-2">
        <strong>Prévia</strong>
        <StatusBadge status={status} />
        <span>
          {STATUS_NOTE[status]} Só quem entra no painel vê esta página.{note ? ` ${note}` : ""}
        </span>
      </p>
      <Link href={backHref} className="inline-block py-1 font-bold text-benja-verde underline underline-offset-4">
        Voltar ao painel
      </Link>
    </div>
  );
}
