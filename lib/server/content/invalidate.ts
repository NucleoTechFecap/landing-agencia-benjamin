/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : invalidate.ts
 Descrição    : Mapeia alterações de conteúdo em tags e invalida o cache público.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-09).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { revalidateTag, updateTag } from "next/cache";
import type { ContentEntityType } from "@/lib/domain/content/types";
import { logger } from "../logger";
import { CONTENT_TAGS } from "./cache-tags";

export type ContentChangeEntity = ContentEntityType | "settings";

/** Alteração de conteúdo que exige invalidar o cache público (TECH-09). */
export interface ContentChange {
  entity: ContentChangeEntity;
  /** Slug atual do item (serviço/case) — invalida a página de detalhe. */
  slug?: string;
  /** Slug anterior quando o slug mudou: a URL antiga também precisa sair do cache. */
  previousSlug?: string;
}

/**
 * Tags afetadas por uma alteração. Como listas e detalhes cruzam entidades (case mostra
 * serviços; serviço mostra cases; CTAs apontam para tudo), a regra é invalidar a lista da
 * entidade, os detalhes envolvidos e as listas que exibem relações com ela.
 */
export function tagsForChange(change: ContentChange): string[] {
  const tags = new Set<string>();
  switch (change.entity) {
    case "settings":
      tags.add(CONTENT_TAGS.settings);
      break;
    case "area":
      tags.add(CONTENT_TAGS.areas).add(CONTENT_TAGS.services).add(CONTENT_TAGS.ctas);
      break;
    case "service":
      tags.add(CONTENT_TAGS.services).add(CONTENT_TAGS.cases).add(CONTENT_TAGS.ctas);
      if (change.slug) tags.add(CONTENT_TAGS.service(change.slug));
      if (change.previousSlug) tags.add(CONTENT_TAGS.service(change.previousSlug));
      break;
    case "category":
      tags.add(CONTENT_TAGS.categories).add(CONTENT_TAGS.cases);
      break;
    case "case":
      tags.add(CONTENT_TAGS.cases).add(CONTENT_TAGS.services).add(CONTENT_TAGS.ctas);
      if (change.slug) tags.add(CONTENT_TAGS.case(change.slug));
      if (change.previousSlug) tags.add(CONTENT_TAGS.case(change.previousSlug));
      break;
    case "cta":
      tags.add(CONTENT_TAGS.ctas);
      break;
  }
  return [...tags];
}

/**
 * Para Server Actions do CMS: expira e recarrega na mesma requisição (read-your-writes) —
 * quem publica já vê o site atualizado na próxima navegação.
 */
export function invalidateContentFromAction(change: ContentChange): string[] {
  const tags = tagsForChange(change);
  tags.forEach((tag) => updateTag(tag));
  logger.info("content.cache.invalidated", { source: "action", entity: change.entity, tags });
  return tags;
}

/**
 * Para Route Handlers (webhook do banco, rotina, operação manual): `updateTag` só existe
 * em Server Actions, então marcamos como expirado imediatamente com `{ expire: 0 }`.
 */
export function invalidateContentFromRoute(change: ContentChange): string[] {
  const tags = tagsForChange(change);
  tags.forEach((tag) => revalidateTag(tag, { expire: 0 }));
  logger.info("content.cache.invalidated", { source: "route", entity: change.entity, tags });
  return tags;
}
