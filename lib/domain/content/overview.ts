/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : overview.ts
 Descrição    : Regras da visão geral dos conteúdos: o que precisa de revisão e em que ordem.

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
──────────────────────────────────────────────────────────────────────────────
*/

import type { PublicationStatus } from "./publication-status";
import type { ContentEntityType, Publishable } from "./types";
import { isPubliclyVisible } from "./visibility";

/** O que falta olhar em um item. Tudo vazio: nada a revisar. */
export interface ReviewNotes {
  /** Texto marcado como provisório: aguarda aprovação da Benjamin e bloqueia o go-live. */
  provisional: boolean;
  /** Pendências de publicação (mesma lista "Para publicar, falta" do formulário). */
  missing: string[];
  /** Só de item publicado: o site segue de pé, mas alguém precisa decidir o que fazer. */
  warnings: string[];
}

export interface OverviewItem extends Publishable {
  id: string;
  title: string;
  order: number;
  editHref: string;
  /** Nome do tipo de conteúdo, para identificar o item na fila de revisão. */
  groupLabel: string;
  /** O papel pode editar este tipo de conteúdo (a tela de edição confere de novo). */
  canEdit: boolean;
  notes: ReviewNotes;
}

export interface OverviewGroup {
  type: ContentEntityType;
  label: string;
  adminPath: string;
  items: OverviewItem[];
  counts: Record<PublicationStatus, number>;
}

export interface ContentOverview {
  groups: OverviewGroup[];
  /** Itens que precisam de revisão, de todos os grupos: o que já está no ar vem primeiro. */
  review: OverviewItem[];
  counts: Record<PublicationStatus, number>;
}

export const FUTURE_PUBLICATION_WARNING =
  "Marcado como publicado, mas a data de publicação ainda não chegou: o site não mostra este item.";

/**
 * Arquivado fica fora: saiu do site, não bloqueia o go-live e precisa ser restaurado para mudar.
 * Rascunho completo também não entra na fila, porque publicar é decisão de quem edita.
 */
export function reviewNotes(
  item: Pick<Publishable, "status" | "publishedAt" | "provisional">,
  found: { missing: readonly string[]; warnings: readonly string[] },
  now: Date,
): ReviewNotes {
  if (item.status === "archived") return { provisional: false, missing: [], warnings: [] };
  const published = item.status === "published";
  return {
    provisional: Boolean(item.provisional),
    missing: [...found.missing],
    warnings: published
      ? [...found.warnings, ...(isPubliclyVisible(item, now) ? [] : [FUTURE_PUBLICATION_WARNING])]
      : [],
  };
}

export function needsReview(notes: ReviewNotes): boolean {
  return notes.provisional || hasProblems(notes);
}

/** Falta algo além da aprovação do texto: precisa de ação de quem edita, antes do que é só provisório. */
export function hasProblems(notes: ReviewNotes): boolean {
  return notes.missing.length > 0 || notes.warnings.length > 0;
}

export function countByStatus(items: readonly Pick<Publishable, "status">[]): Record<PublicationStatus, number> {
  const counts: Record<PublicationStatus, number> = { draft: 0, published: 0, archived: 0 };
  for (const item of items) counts[item.status] += 1;
  return counts;
}

/** Junta os grupos e monta a fila de revisão: publicado antes de rascunho, mais recente primeiro. */
export function assembleOverview(groups: OverviewGroup[]): ContentOverview {
  const items = groups.flatMap((group) => group.items);
  const review = items
    .filter((item) => needsReview(item.notes))
    .sort(
      (a, b) =>
        Number(b.status === "published") - Number(a.status === "published") ||
        Date.parse(b.updatedAt) - Date.parse(a.updatedAt) ||
        a.title.localeCompare(b.title, "pt-BR"),
    );
  return { groups, review, counts: countByStatus(items) };
}
