/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : submission-detail.tsx
 Descrição    : Conteúdo e origem de um envio, sempre como texto com escape.

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

import { categoryLabel, describeNotification, presentPayload, type SubmissionDetail } from "@/lib/domain/forms/inbox";
import { SUBMISSION_KIND_LABELS } from "@/lib/domain/forms/schemas";
import { formatDateTime } from "../cms/cms-table";
import { AttendanceBadge, NotificationBadge } from "./submission-table";

/**
 * O que o visitante enviou. Tudo aqui é conteúdo não confiável: é exibido como texto, com o escape do
 * React, sem link automático em e-mail, telefone ou endereço e sem `dangerouslySetInnerHTML`.
 */
export function SubmissionContent({ record }: { record: SubmissionDetail }) {
  const fields = presentPayload(record.payload);
  return (
    <section aria-labelledby="conteudo-enviado" className="rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
      <h2 id="conteudo-enviado" className="mb-4 text-lg font-black text-benja-verde">
        Conteúdo enviado
      </h2>
      {fields.length ? (
        <dl className="space-y-4">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs font-bold tracking-wider text-benja-grafite/80 uppercase">{field.label}</dt>
              <dd className="mt-1 break-words whitespace-pre-wrap">{field.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-benja-grafite/80">Este envio não tem conteúdo legível.</p>
      )}
    </section>
  );
}

/**
 * Dados de controle do envio. `sourcePath` vem do navegador e aceita `//evil.com`, que um link trataria
 * como outro site: por isso é só texto. Hash de IP e impressão digital nem chegam até aqui.
 */
export function SubmissionRecordPanel({
  record,
  services,
}: {
  record: SubmissionDetail;
  services: readonly { slug: string; name: string }[];
}) {
  const rows = [
    [
      "Protocolo",
      <span key="protocolo" className="font-mono font-bold">
        {record.protocol}
      </span>,
    ],
    ["Tipo", SUBMISSION_KIND_LABELS[record.kind]],
    ["Categoria", categoryLabel(record.category, services)],
    ["Recebido em", formatDateTime(record.createdAt)],
    ["Atualizado em", formatDateTime(record.updatedAt)],
    [
      "Página de origem",
      record.sourcePath ? (
        <code key="origem" className="break-all">
          {record.sourcePath}
        </code>
      ) : (
        "—"
      ),
    ],
  ] as const;
  return (
    <section
      aria-labelledby="registro-titulo"
      className="space-y-3 rounded-3xl border-2 border-benja-noite/15 bg-white p-5 text-sm"
    >
      <h2 id="registro-titulo" className="text-sm font-black tracking-widest text-benja-verde uppercase">
        Registro
      </h2>
      <AttendanceBadge status={record.status} />
      <dl className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="font-bold">{label}</dt>
            <dd className="text-benja-grafite/80">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Situação do e-mail interno (INT-07): quem atende descobre aqui que o contato não chegou por e-mail.
 * O erro devolvido pelo provedor não aparece: pode citar destinatários, e não muda o que fazer.
 */
export function NotificationPanel({ record }: { record: SubmissionDetail }) {
  return (
    <section
      aria-labelledby="notificacao-titulo"
      className="space-y-3 rounded-3xl border-2 border-benja-noite/15 bg-white p-5 text-sm"
    >
      <h2 id="notificacao-titulo" className="text-sm font-black tracking-widest text-benja-verde uppercase">
        Notificação por e-mail
      </h2>
      <NotificationBadge status={record.notificationStatus} />
      <p>{describeNotification(record.notificationStatus, record.notificationAttempts)}</p>
    </section>
  );
}
