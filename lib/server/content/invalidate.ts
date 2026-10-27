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
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-09).
 26/10/2026 Vinícius Nishimura Reis  Tags e invalidação de páginas do CMS (DB-03).
 26/10/2026 Vinícius Nishimura Reis  Aquecimento da página de detalhe após invalidar (INT-02).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { revalidateTag, updateTag } from "next/cache";
import { after } from "next/server";
import { siteUrl } from "@/lib/config/public-env";
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
    case "page":
      tags.add(CONTENT_TAGS.pages);
      if (change.slug) tags.add(CONTENT_TAGS.page(change.slug));
      if (change.previousSlug) tags.add(CONTENT_TAGS.page(change.previousSlug));
      break;
  }
  return [...tags];
}

/**
 * Páginas de detalhe afetadas (rotas com pré-render parcial). No Next 16.4 a PRIMEIRA
 * requisição a uma delas depois da invalidação ainda é montada a partir do pré-render
 * anterior; a partir da segunda já vem a versão nova (medido no INT-02). Listas e API
 * atualizam na hora.
 */
export function detailPathsForChange(change: ContentChange): string[] {
  if (!change.slug) return [];
  if (change.entity === "service") return [`/servicos/${change.slug}`];
  if (change.entity === "case") return [`/cases/${change.slug}`];
  return [];
}

/**
 * Faz essa primeira requisição do lado do servidor, depois da resposta (after), para quem
 * publicou já ver a versão nova ao abrir o site. Falha aqui não afeta a operação.
 */
function warmDetailPages(change: ContentChange) {
  const paths = detailPathsForChange(change);
  if (!paths.length) return;
  after(async () => {
    await Promise.all(
      paths.map((path) =>
        fetch(`${siteUrl}${path}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).catch((error) =>
          logger.warn("content.cache.warm_failed", { path, error }),
        ),
      ),
    );
  });
}

/**
 * Para Server Actions do CMS: expira e recarrega na mesma requisição (read-your-writes) —
 * quem publica já vê o site atualizado na próxima navegação.
 */
export function invalidateContentFromAction(change: ContentChange): string[] {
  const tags = tagsForChange(change);
  tags.forEach((tag) => updateTag(tag));
  logger.info("content.cache.invalidated", { source: "action", entity: change.entity, tags });
  warmDetailPages(change);
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
  warmDetailPages(change);
  return tags;
}
