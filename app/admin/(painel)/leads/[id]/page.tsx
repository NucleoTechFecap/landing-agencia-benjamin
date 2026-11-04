/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Detalhe de um envio recebido, com status de atendimento.

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
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { StatusForm } from "@/components/admin/leads/status-form";
import { SubmissionContent, SubmissionRecordPanel } from "@/components/admin/leads/submission-detail";
import { INBOX_PATH, canOnKind, isSubmissionId, statusOptions } from "@/lib/domain/forms/inbox";
import { listServices } from "@/lib/server/content/repository";
import { openSubmission, requireInboxPage } from "@/lib/server/forms/inbox-context";
import { changeSubmissionStatusAction } from "../actions";

// Título fixo: nome e e-mail do visitante não vão para a aba, o histórico nem a trilha da página.
export const metadata: Metadata = { title: "Envio recebido" };

/** Abrir um envio é uma leitura de dados pessoais: gera evento na trilha de acesso (TECH-08 §4). */
export default async function SubmissionPage({ params, searchParams }: PageProps<"/admin/leads/[id]">) {
  const { id } = await params;
  const { user } = await requireInboxPage(isSubmissionId(id) ? `${INBOX_PATH}/${id}` : INBOX_PATH);
  const [record, query, services] = await Promise.all([
    openSubmission(user, id),
    searchParams,
    listServices().catch(() => []),
  ]);
  if (!record) notFound();
  return (
    <>
      <CmsHeader
        title={record.protocol}
        trail={[{ label: "Leads e feedbacks", href: INBOX_PATH }, { label: record.protocol }]}
      />
      <FlashMessage ok={query.ok} />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <SubmissionContent record={record} />
        <aside className="space-y-4">
          <SubmissionRecordPanel record={record} services={services} />
          {canOnKind(user.role, record.kind, "edit") ? (
            <StatusForm
              action={changeSubmissionStatusAction}
              id={record.id}
              current={record.status}
              options={statusOptions(record.kind, record.status)}
            />
          ) : null}
        </aside>
      </div>
    </>
  );
}
