/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : visibility.ts
 Descrição    : Regra única de visibilidade pública e ordenação de conteúdo publicado.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-05).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Publishable } from "./types";

/**
 * Regra única de visibilidade pública (RN-01): somente itens publicados cuja data de
 * publicação já passou. Rascunhos e arquivados nunca aparecem no site nem na API.
 */
export function isPubliclyVisible(item: Pick<Publishable, "status" | "publishedAt">, now: Date = new Date()): boolean {
  if (item.status !== "published" || !item.publishedAt) return false;
  const publishedAt = Date.parse(item.publishedAt);
  return Number.isFinite(publishedAt) && publishedAt <= now.getTime();
}

/** Filtra e ordena itens visíveis por `order` e, em empate, por nome/título. */
export function visibleSorted<T extends Pick<Publishable, "status" | "publishedAt"> & { order: number }>(
  items: readonly T[],
  label: (item: T) => string,
  now: Date = new Date(),
): T[] {
  return items
    .filter((item) => isPubliclyVisible(item, now))
    .sort((a, b) => a.order - b.order || label(a).localeCompare(label(b), "pt-BR"));
}
