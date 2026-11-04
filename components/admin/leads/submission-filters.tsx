/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : submission-filters.tsx
 Descrição    : Filtros da lista de envios por tipo, status e categoria.

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

import Form from "next/form";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  INBOX_PATH,
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_LABELS,
  categoryOptions,
  inboxHref,
  type InboxQuery,
} from "@/lib/domain/forms/inbox";
import { SUBMISSION_KIND_LABELS, type SubmissionKind } from "@/lib/domain/forms/schemas";

const control =
  "mt-1.5 w-full rounded-2xl border-2 border-benja-noite bg-white px-4 py-2.5 text-sm text-benja-noite focus:border-benja-azul focus:ring-4 focus:ring-benja-azul";

function Filter({
  name,
  label,
  value,
  children,
}: {
  name: string;
  label: string;
  value?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={`filtro-${name}`} className="text-sm font-bold text-benja-noite">
        {label}
      </label>
      <select id={`filtro-${name}`} name={name} defaultValue={value ?? ""} className={control}>
        {children}
      </select>
    </div>
  );
}

/**
 * Filtros em GET, com link compartilhável e sem JavaScript obrigatório. Só há opções de lista
 * fechada: nome e e-mail nunca entram na URL (TECH-08). A `key` recoloca os valores ao limpar.
 */
export function SubmissionFilters({
  query,
  kinds,
  services,
}: {
  query: InboxQuery;
  kinds: readonly SubmissionKind[];
  services: readonly { slug: string; name: string }[];
}) {
  return (
    <Form
      key={inboxHref(query)}
      action={INBOX_PATH}
      prefetch={false}
      role="search"
      aria-label="Filtrar envios"
      className="mb-6 grid items-end gap-4 rounded-3xl border-2 border-benja-noite/15 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Filter name="tipo" label="Tipo" value={query.kind}>
        <option value="">Todos</option>
        {kinds.map((kind) => (
          <option key={kind} value={kind}>
            {SUBMISSION_KIND_LABELS[kind]}
          </option>
        ))}
      </Filter>
      <Filter name="status" label="Status" value={query.status}>
        <option value="">Todos</option>
        {SUBMISSION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {SUBMISSION_STATUS_LABELS[status]}
          </option>
        ))}
      </Filter>
      <Filter name="categoria" label="Categoria" value={query.category}>
        <option value="">Todas</option>
        {categoryOptions(kinds, services).map((group) => (
          <optgroup key={group.kind} label={group.label}>
            {group.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </optgroup>
        ))}
      </Filter>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          className="rounded-full bg-benja-verde px-5 py-2.5 text-sm font-bold text-benja-nyanza transition hover:bg-benja-noite"
        >
          Filtrar
        </button>
        <Link href={INBOX_PATH} prefetch={false} className="text-sm font-semibold underline underline-offset-4">
          Limpar
        </Link>
      </div>
    </Form>
  );
}
