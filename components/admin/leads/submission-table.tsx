/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : submission-table.tsx
 Descrição    : Lista paginada de envios recebidos no painel.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-09).
 04/11/2026 Vinícius Nishimura Reis  Situação da notificação e filtro (INT-07).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import {
  INBOX_PATH,
  NOTIFICATION_STATUS_LABELS,
  SUBMISSION_STATUS_LABELS,
  categoryLabel,
  inboxHref,
  type InboxPage,
  type InboxQuery,
  type NotificationStatus,
  type SubmissionStatus,
} from "@/lib/domain/forms/inbox";
import { SUBMISSION_KIND_LABELS } from "@/lib/domain/forms/schemas";
import { formatDateTime } from "../cms/cms-table";

const STATUS_TONES: Record<SubmissionStatus, string> = {
  novo: "border-benja-laranja bg-white text-benja-noite",
  em_atendimento: "border-benja-azul bg-white text-benja-azul",
  respondido: "border-benja-verde bg-benja-claro text-benja-verde",
  lido: "border-benja-verde bg-benja-claro text-benja-verde",
  arquivado: "border-benja-grafite/30 bg-benja-creme text-benja-grafite/80",
};

/** Status de atendimento em texto, não só em cor. */
export function AttendanceBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span className={`rounded-full border-2 px-2.5 py-0.5 text-xs font-bold ${STATUS_TONES[status]}`}>
      {SUBMISSION_STATUS_LABELS[status]}
    </span>
  );
}

const NOTIFICATION_TONES: Record<NotificationStatus, string> = {
  sent: "border-benja-verde bg-benja-claro text-benja-verde",
  pending: "border-benja-laranja bg-white text-benja-noite",
  failed: "border-benja-erro bg-benja-erro-fundo text-benja-erro-texto",
  skipped: "border-dashed border-benja-noite bg-white text-benja-noite",
};

/** Situação do e-mail interno em texto, não só em cor (INT-07). */
export function NotificationBadge({ status }: { status: NotificationStatus }) {
  return (
    <span className={`rounded-full border-2 px-2.5 py-0.5 text-xs font-bold ${NOTIFICATION_TONES[status]}`}>
      {NOTIFICATION_STATUS_LABELS[status]}
    </span>
  );
}

/**
 * O protocolo é o link de abertura. Sem prefetch, porque abrir um envio gera evento na trilha de acesso:
 * passar o mouse não pode contar como leitura (TECH-08).
 */
export function SubmissionTable({
  inbox,
  services,
}: {
  inbox: InboxPage;
  services: readonly { slug: string; name: string }[];
}) {
  return (
    <div className="overflow-x-auto rounded-3xl border-2 border-benja-noite/15 bg-white">
      <table className="w-full min-w-[820px] text-left text-sm">
        <caption className="sr-only">Envios recebidos, do mais novo ao mais antigo</caption>
        <thead className="border-b-2 border-benja-noite/10 text-xs tracking-wider text-benja-grafite/80 uppercase">
          <tr>
            {["Protocolo", "Nome", "Tipo", "Categoria", "Status", "Notificação", "Recebido em"].map((column) => (
              <th key={column} scope="col" className="px-4 py-3">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inbox.items.map((item) => (
            <tr key={item.id} className="border-b border-benja-noite/5 last:border-0">
              <td className="px-4 py-3 font-semibold whitespace-nowrap">
                <Link
                  href={`${INBOX_PATH}/${item.id}`}
                  prefetch={false}
                  className="font-mono text-benja-verde underline-offset-4 hover:underline"
                >
                  {item.protocol}
                </Link>
              </td>
              <td className="max-w-56 px-4 py-3 break-words">{item.name ?? "Anônimo"}</td>
              <td className="px-4 py-3">{SUBMISSION_KIND_LABELS[item.kind]}</td>
              <td className="px-4 py-3">{categoryLabel(item.category, services)}</td>
              <td className="px-4 py-3">
                <AttendanceBadge status={item.status} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <NotificationBadge status={item.notificationStatus} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-benja-grafite/80">{formatDateTime(item.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Navegação entre páginas, mantendo os filtros aplicados. */
export function InboxPagination({ inbox, query }: { inbox: InboxPage; query: InboxQuery }) {
  const link = "rounded-full border-2 border-benja-verde px-4 py-1.5 font-bold text-benja-verde hover:bg-benja-claro";
  return (
    <nav aria-label="Páginas da lista" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p aria-live="polite">
        Página {inbox.page} de {inbox.totalPages} · {inbox.total} {inbox.total === 1 ? "envio" : "envios"}
      </p>
      <div className="flex gap-3">
        {inbox.page > 1 ? (
          <Link href={inboxHref({ ...query, page: inbox.page - 1 })} prefetch={false} rel="prev" className={link}>
            Anterior
          </Link>
        ) : null}
        {inbox.page < inbox.totalPages ? (
          <Link href={inboxHref({ ...query, page: inbox.page + 1 })} prefetch={false} rel="next" className={link}>
            Próxima
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
