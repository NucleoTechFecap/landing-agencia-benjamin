/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : cms-table.tsx
 Descrição    : Tabela de itens do CMS com estado, ordem, atualização e seção de arquivados.

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

import Link from "next/link";
import type { ReactNode } from "react";
import type { Publishable } from "@/lib/domain/content/types";
import { StatusBadge } from "./status-badge";

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function formatDateTime(iso: string): string {
  const time = Date.parse(iso);
  return Number.isFinite(time) ? dateTime.format(time) : "—";
}

export interface CmsRow extends Publishable {
  id: string;
  title: string;
  order: number;
  /** Colunas extras específicas da entidade (ex.: nº de serviços). */
  extra?: ReactNode;
}

/**
 * Lista do CMS: ativos (rascunho e publicado) em ordem e arquivados à parte, recolhidos.
 * O título é o link de edição; o estado aparece em texto (não só cor).
 */
export function CmsTable({
  rows,
  basePath,
  extraHeader,
  empty,
}: {
  rows: CmsRow[];
  basePath: string;
  extraHeader?: string;
  empty: ReactNode;
}) {
  const sorted = [...rows].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "pt-BR"));
  const active = sorted.filter((row) => row.status !== "archived");
  const archived = sorted.filter((row) => row.status === "archived");
  if (!rows.length)
    return (
      <div className="rounded-3xl border-2 border-dashed border-benja-noite/25 bg-white p-8 text-center">{empty}</div>
    );
  return (
    <div className="space-y-6">
      <Table rows={active} basePath={basePath} extraHeader={extraHeader} caption="Itens ativos" />
      {archived.length ? (
        <details className="rounded-3xl border-2 border-benja-noite/15 bg-white p-4">
          <summary className="cursor-pointer font-bold">Arquivados ({archived.length})</summary>
          <div className="mt-4">
            <Table rows={archived} basePath={basePath} extraHeader={extraHeader} caption="Itens arquivados" />
          </div>
        </details>
      ) : null}
    </div>
  );
}

function Table({
  rows,
  basePath,
  extraHeader,
  caption,
}: {
  rows: CmsRow[];
  basePath: string;
  extraHeader?: string;
  caption: string;
}) {
  if (!rows.length) return <p className="text-sm text-benja-grafite/80">Nenhum item ativo.</p>;
  return (
    <div className="overflow-x-auto rounded-3xl border-2 border-benja-noite/15 bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b-2 border-benja-noite/10 text-xs tracking-wider text-benja-grafite/80 uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">
              Ordem
            </th>
            <th scope="col" className="px-4 py-3">
              Nome
            </th>
            {extraHeader ? (
              <th scope="col" className="px-4 py-3">
                {extraHeader}
              </th>
            ) : null}
            <th scope="col" className="px-4 py-3">
              Estado
            </th>
            <th scope="col" className="px-4 py-3">
              Atualizado em
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-benja-noite/5 last:border-0">
              <td className="px-4 py-3 tabular-nums">{row.order}</td>
              <td className="px-4 py-3 font-semibold">
                <Link href={`${basePath}/${row.id}`} className="text-benja-verde underline-offset-4 hover:underline">
                  {row.title}
                </Link>
              </td>
              {extraHeader ? <td className="px-4 py-3">{row.extra}</td> : null}
              <td className="px-4 py-3">
                <StatusBadge status={row.status} provisional={row.provisional} />
              </td>
              <td className="px-4 py-3 text-benja-grafite/80">{formatDateTime(row.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
