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
 04/11/2026 Vinícius Nishimura Reis  Tabela sem rolagem lateral, alvos de toque e texto longo (FORM-09).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
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
import { badgeBase } from "../cms/status-badge";

const STATUS_TONES: Record<SubmissionStatus, string> = {
  novo: "border-benja-laranja bg-white text-benja-noite",
  em_atendimento: "border-benja-azul bg-white text-benja-azul",
  respondido: "border-benja-verde bg-benja-claro text-benja-verde",
  lido: "border-benja-verde bg-benja-claro text-benja-verde",
  arquivado: "border-studio-linha bg-studio-realce text-studio-suave",
};

/** Status de atendimento em texto, não só em cor. */
export function AttendanceBadge({ status }: { status: SubmissionStatus }) {
  return <span className={`${badgeBase} ${STATUS_TONES[status]}`}>{SUBMISSION_STATUS_LABELS[status]}</span>;
}

const NOTIFICATION_TONES: Record<NotificationStatus, string> = {
  sent: "border-benja-verde bg-benja-claro text-benja-verde",
  pending: "border-benja-laranja bg-white text-benja-noite",
  failed: "border-benja-erro bg-benja-erro-fundo text-benja-erro-texto",
  skipped: "border-dashed border-benja-noite bg-white text-benja-noite",
};

/** Situação do e-mail interno em texto, não só em cor (INT-07). */
export function NotificationBadge({ status }: { status: NotificationStatus }) {
  return <span className={`${badgeBase} ${NOTIFICATION_TONES[status]}`}>{NOTIFICATION_STATUS_LABELS[status]}</span>;
}

/**
 * O protocolo é o link de abertura. Sem prefetch, porque abrir um envio gera evento na trilha de acesso:
 * passar o mouse não pode contar como leitura (TECH-08). No celular, as colunas viram linhas sob o
 * protocolo: o status e a notificação ficam à vista sem rolar a tabela de lado.
 */
export function SubmissionTable({
  inbox,
  services,
}: {
  inbox: InboxPage;
  services: readonly { slug: string; name: string }[];
}) {
  const column = "hidden px-4 py-3 md:table-cell";
  return (
    // `relative`: o texto sr-only é absoluto e, sem isso, escapa do quadro e alarga a página no celular.
    <div className="studio-card relative overflow-x-auto">
      <table className="studio-tabela">
        <caption className="sr-only">Envios recebidos, do mais novo ao mais antigo</caption>
        <thead>
          <tr>
            <th scope="col">Protocolo</th>
            {["Nome", "Tipo e categoria", "Status", "Notificação", "Recebido em"].map((name) => (
              <th key={name} scope="col" className="hidden md:table-cell">
                {name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inbox.items.map((item) => {
            const name = item.name ?? "Anônimo";
            const type = `${SUBMISSION_KIND_LABELS[item.kind]} · ${categoryLabel(item.category, services)}`;
            const received = formatDateTime(item.createdAt);
            return (
              <tr key={item.id} className="align-top">
                <td className="px-4 py-3 font-semibold">
                  <Link
                    href={`${INBOX_PATH}/${item.id}`}
                    prefetch={false}
                    className="inline-block py-1 font-mono whitespace-nowrap text-benja-verde underline-offset-4 hover:underline"
                  >
                    {item.protocol}
                  </Link>
                  <div className="mt-1 space-y-1 text-xs font-normal md:hidden">
                    <p className="text-sm font-semibold wrap-anywhere">{name}</p>
                    <p className="wrap-anywhere">{type}</p>
                    <p className="flex flex-wrap gap-1.5">
                      <AttendanceBadge status={item.status} />
                      <NotificationBadge status={item.notificationStatus} />
                    </p>
                    <p className="text-studio-suave">Recebido em {received}</p>
                  </div>
                </td>
                <td className={`${column} wrap-anywhere`}>{name}</td>
                <td className={`${column} wrap-anywhere`}>{type}</td>
                <td className={column}>
                  <AttendanceBadge status={item.status} />
                </td>
                <td className={column}>
                  <NotificationBadge status={item.notificationStatus} />
                </td>
                <td className={`${column} text-studio-suave`}>{received}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Navegação entre páginas, mantendo os filtros aplicados. */
export function InboxPagination({ inbox, query }: { inbox: InboxPage; query: InboxQuery }) {
  const link = "studio-btn studio-btn-secundario";
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
