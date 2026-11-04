/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Lista paginada de leads, contatos e feedbacks no painel.

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
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { SubmissionFilters } from "@/components/admin/leads/submission-filters";
import { InboxPagination, SubmissionTable } from "@/components/admin/leads/submission-table";
import { EmptyState } from "@/components/ui/states";
import { INBOX_PATH, parseInboxQuery } from "@/lib/domain/forms/inbox";
import { listServices } from "@/lib/server/content/repository";
import { listSubmissions } from "@/lib/server/forms/inbox";
import { requireInboxPage } from "@/lib/server/forms/inbox-context";
import { createSessionClient } from "@/lib/server/supabase/server";

export const metadata: Metadata = { title: "Leads e feedbacks" };

/**
 * Envios recebidos (FORM-09). A guarda vem antes de ler filtros ou dados, a consulta usa a sessão de
 * quem está logado e os filtros passam por lista fechada. Os nomes dos serviços são públicos e só dão
 * rótulo à categoria: sem eles a lista continua funcionando, com o slug.
 */
export default async function LeadsAdminPage({ searchParams }: PageProps<"/admin/leads">) {
  const { kinds } = await requireInboxPage(INBOX_PATH);
  const params = await searchParams;
  const query = parseInboxQuery(params, kinds);
  const [inbox, services] = await Promise.all([
    listSubmissions(await createSessionClient(), query, kinds),
    listServices().catch(() => []),
  ]);
  return (
    <>
      <CmsHeader title="Leads e feedbacks" trail={[{ label: "Leads e feedbacks" }]} />
      <FlashMessage ok={params.ok} />
      <SubmissionFilters query={query} kinds={kinds} services={services} />
      {inbox.items.length ? (
        <>
          <SubmissionTable inbox={inbox} services={services} />
          <InboxPagination inbox={inbox} query={query} />
        </>
      ) : (
        <EmptyState className="bg-white" action={{ href: INBOX_PATH, label: "Ver todos os envios" }}>
          Nenhum envio encontrado com estes filtros.
        </EmptyState>
      )}
    </>
  );
}
