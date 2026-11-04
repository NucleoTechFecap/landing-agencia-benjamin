/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : content-overview.tsx
 Descrição    : Visão geral dos conteúdos: fila do que precisa de revisão e lista por tipo de conteúdo.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-18).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import {
  hasProblems,
  type ContentOverview,
  type OverviewGroup,
  type OverviewItem,
} from "@/lib/domain/content/overview";
import type { PublicationStatus } from "@/lib/domain/content/publication-status";
import { CmsTable, formatDateTime } from "./cms-table";
import { StatusBadge } from "./status-badge";

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

const STATUS_COUNTS: { status: PublicationStatus; one: string; many: string }[] = [
  { status: "published", one: "publicado", many: "publicados" },
  { status: "draft", one: "rascunho", many: "rascunhos" },
  { status: "archived", one: "arquivado", many: "arquivados" },
];

const countsText = (counts: Record<PublicationStatus, number>) =>
  STATUS_COUNTS.map(({ status, one, many }) => plural(counts[status], one, many)).join(" · ");

function NoteList({ title, notes }: { title: string; notes: string[] }) {
  if (!notes.length) return null;
  return (
    <div>
      <p className="font-bold">{title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {notes.map((note) => (
          <li key={note} className="wrap-anywhere">
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EditLink({ item, className = "" }: { item: OverviewItem; className?: string }) {
  return (
    <Link href={item.editHref} prefetch={false} className={`studio-btn studio-btn-secundario ${className}`}>
      {item.canEdit ? "Editar" : "Ver"}
      <span className="sr-only"> {item.title}</span>
    </Link>
  );
}

function ReviewItem({ item }: { item: OverviewItem }) {
  return (
    <li className="rounded-studio-md border border-studio-linha p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="studio-rotulo">{item.groupLabel}</p>
          <h3 className="mt-1 font-bold wrap-anywhere">{item.title}</h3>
          <p className="mt-1 text-xs text-studio-suave">Atualizado em {formatDateTime(item.updatedAt)}</p>
        </div>
        <StatusBadge status={item.status} provisional={item.provisional} />
      </div>
      <div className="mt-3 space-y-3 text-sm">
        <NoteList
          title={item.status === "published" ? "No ar com pendências:" : "Para publicar, falta:"}
          notes={item.notes.missing}
        />
        <NoteList title="Avisos:" notes={item.notes.warnings} />
      </div>
      <EditLink item={item} className="mt-3" />
    </li>
  );
}

/**
 * Quando quase tudo ainda é provisório, a lista sem pendências seria longa o bastante para esconder o
 * que precisa de ação. Fica recolhida, com a contagem à vista, e cada item em uma linha.
 */
function ProvisionalList({ items }: { items: OverviewItem[] }) {
  if (!items.length) return null;
  return (
    <details className="mt-4 rounded-studio-md border border-studio-linha px-4 py-1.5">
      <summary className="cursor-pointer py-2.5 font-bold">
        Textos provisórios, sem outra pendência ({items.length})
      </summary>
      <p className="mt-1 text-sm">
        Aguardam aprovação da Benjamin. O go-live é bloqueado enquanto houver item provisório publicado.
      </p>
      <ul className="mt-2 divide-y-2 divide-benja-noite/5">
        {items.map((item) => (
          <li key={item.editHref} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
            <div className="min-w-0">
              <p className="studio-rotulo">{item.groupLabel}</p>
              <p className="font-semibold wrap-anywhere">{item.title}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={item.status} provisional={item.provisional} />
              <EditLink item={item} />
            </div>
          </li>
        ))}
      </ul>
    </details>
  );
}

function ReviewSection({ overview }: { overview: ContentOverview }) {
  const total = overview.review.length;
  const hasContent = overview.groups.some((group) => group.items.length > 0);
  const problems = overview.review.filter((item) => hasProblems(item.notes));
  return (
    <section aria-labelledby="revisao-titulo" className="studio-card border-benja-laranja p-4 sm:p-6">
      <h2 id="revisao-titulo" className="studio-titulo-secao">
        Precisa de revisão ({total})
      </h2>
      {problems.length ? (
        <ul className="mt-4 space-y-3">
          {problems.map((item) => (
            <ReviewItem key={item.editHref} item={item} />
          ))}
        </ul>
      ) : null}
      <ProvisionalList items={overview.review.filter((item) => !hasProblems(item.notes))} />
      {total ? null : (
        <p className="mt-2 text-sm">
          {hasContent
            ? "Nada por aqui: nenhum item provisório, com pendência de publicação ou com aviso."
            : "Ainda não há conteúdo cadastrado."}
        </p>
      )}
    </section>
  );
}

/** Coluna da tabela: resumo em uma linha, sem repetir a lista que já está na fila de revisão. */
function reviewSummary(item: OverviewItem) {
  if (item.status === "archived") return "—";
  const pending = item.notes.missing.length + item.notes.warnings.length;
  if (pending) return plural(pending, "pendência", "pendências");
  if (item.notes.provisional) return "Aprovar texto";
  return item.status === "draft" ? "Pronto para publicar" : "Em dia";
}

function GroupSection({ group }: { group: OverviewGroup }) {
  const id = `grupo-${group.type}`;
  return (
    <section aria-labelledby={id}>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id={id} className="studio-titulo-secao">
          {group.label}
        </h2>
        <p className="text-sm text-studio-suave">{countsText(group.counts)}</p>
      </div>
      <CmsTable
        basePath={group.adminPath}
        extraHeader="Revisão"
        rows={group.items.map((item) => ({ ...item, extra: reviewSummary(item) }))}
        empty={<p>Nenhum item cadastrado ainda.</p>}
      />
    </section>
  );
}

/** A tela só recebe os grupos que o papel pode ver (lib/server/cms/overview.ts). */
export function ContentOverviewView({ overview }: { overview: ContentOverview }) {
  if (!overview.groups.length) {
    return (
      <p className="studio-card border-dashed border-studio-controle p-8 text-center">
        O seu papel não dá acesso a nenhum tipo de conteúdo.
      </p>
    );
  }
  return (
    <div className="space-y-10">
      <p className="font-semibold">No total: {countsText(overview.counts)}.</p>
      <ReviewSection overview={overview} />
      {overview.groups.map((group) => (
        <GroupSection key={group.type} group={group} />
      ))}
    </div>
  );
}
