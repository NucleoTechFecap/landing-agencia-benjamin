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
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-09).
 26/10/2026 Vinícius Nishimura Reis  Tags e invalidação de páginas do CMS (DB-03).
 26/10/2026 Vinícius Nishimura Reis  Aquecimento da página de detalhe após invalidar (INT-02).
 27/10/2026 Vinícius Nishimura Reis  Correções da revisão de segurança (TECH-13).
 01/11/2026 Vinícius Nishimura Reis  Segunda expiração contra regeneração em andamento (INT-03).
 04/11/2026 Vinícius Nishimura Reis  Segunda expiração em requisição própria, antes de aquecer (TECH-13, #369).
 12/11/2026 Codex                     Invalida artigos do blog (FUT-10).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { revalidateTag, updateTag } from "next/cache";
import { after } from "next/server";
import { siteUrl } from "@/lib/config/public-env";
import { getServerEnv } from "@/lib/config/server-env";
import type { ContentEntityType } from "@/lib/domain/content/types";
import { logger } from "../logger";
import { CONTENT_TAGS } from "./cache-tags";

export type ContentChangeEntity = ContentEntityType | "settings" | "blog";

/** Alteração de conteúdo que exige invalidar o cache público (TECH-09). */
export interface ContentChange {
  entity: ContentChangeEntity;
  /** Slug atual do item (serviço/case) — invalida a página de detalhe. */
  slug?: string;
  /** Slug anterior quando o slug mudou: a URL antiga também precisa sair do cache. */
  previousSlug?: string;
  /**
   * Outras páginas de detalhe que exibem o item (ex.: o case aparece na página dos serviços dele).
   * Entram no aquecimento, para ninguém ver o item antigo nelas (TECH-13).
   */
  relatedPaths?: string[];
}

/** Teto de páginas aquecidas por alteração, para uma edição não disparar dezenas de requisições. */
export const MAX_WARMED_PATHS = 12;

/** Dentro da meta de 5 s do ADR-0006 e folgado para uma regeneração em andamento terminar. */
export const SECOND_EXPIRATION_DELAY_MS = 3_000;

/**
 * Tags afetadas por uma alteração. Como listas e detalhes cruzam entidades (case mostra
 * serviços; serviço mostra cases; CTAs apontam para tudo), a regra é invalidar a lista da
 * entidade, os detalhes envolvidos e as listas que exibem relações com ela.
 */
export function tagsForChange(change: ContentChange): string[] {
  const tags = new Set<string>();
  switch (change.entity) {
    case "blog":
      tags.add(CONTENT_TAGS.blog);
      break;
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
  const own =
    change.slug && change.entity === "service"
      ? [`/servicos/${change.slug}`]
      : change.slug && change.entity === "case"
        ? [`/cases/${change.slug}`]
        : change.slug && change.entity === "blog"
          ? [`/blog/${change.slug}`]
          : [];
  return [...new Set([...own, ...(change.relatedPaths ?? [])])].slice(0, MAX_WARMED_PATHS);
}

/**
 * Faz essa primeira requisição do lado do servidor, depois da resposta (after), para quem
 * publicou já ver a versão nova ao abrir o site. Falha aqui não afeta a operação.
 */
function warmDetailPages(change: ContentChange) {
  const paths = detailPathsForChange(change);
  if (!paths.length) return;
  after(() => warmPaths(paths));
}

async function warmPaths(paths: string[]) {
  await Promise.all(
    paths.map((path) =>
      fetch(`${siteUrl}${path}`, { cache: "no-store", signal: AbortSignal.timeout(5000) }).catch((error) =>
        logger.warn("content.cache.warm_failed", { path, error }),
      ),
    ),
  );
}

/** Quanto esperar a resposta da requisição que faz a segunda expiração. */
const SECOND_PASS_TIMEOUT_MS = 5_000;

/**
 * Segunda expiração em requisição própria. Dentro de after(), revalidateTag só vale no fim da fila, e o
 * aquecimento leria o cache ainda não expirado. Num Route Handler, ela vale antes de a resposta sair e
 * o aquecimento vem depois (TECH-13, #369). Devolve false quando não deu para fazer assim.
 */
async function expireInOwnRequest(change: ContentChange): Promise<boolean> {
  const secret = getServerEnv().CONTENT_REVALIDATE_SECRET;
  if (!secret) return false;
  const { entity, slug, previousSlug } = change;
  const response = await fetch(`${siteUrl}/api/internal/revalidate`, {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(SECOND_PASS_TIMEOUT_MS),
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify({
      entity,
      slug,
      previousSlug,
      relatedPaths: detailPathsForChange(change),
      secondPass: true,
    }),
  });
  if (!response.ok) logger.warn("content.cache.second_pass_refused", { entity, status: response.status });
  return response.ok;
}

/**
 * Uma regeneração em andamento durante a gravação lê o dado antigo e grava o resultado depois da
 * invalidação: o site ficaria com a versão velha até o fim do cacheLife (ADR-0006). Expirar de novo
 * depois desse prazo descarta o resultado atrasado. Falha aqui não afeta a operação já concluída.
 */
function expireAgainLater(change: ContentChange, tags: string[]) {
  after(async () => {
    await new Promise((resolve) => setTimeout(resolve, SECOND_EXPIRATION_DELAY_MS));
    const done = await expireInOwnRequest(change).catch((error) => {
      logger.warn("content.cache.second_pass_request_failed", { entity: change.entity, error });
      return false;
    });
    if (done) return;
    // Sem o segredo ou sem resposta: ainda expira aqui, mesmo sem a garantia de ordem do aquecimento.
    try {
      tags.forEach((tag) => revalidateTag(tag, { expire: 0 }));
      logger.info("content.cache.invalidated", { source: "second-pass", entity: change.entity, tags });
    } catch (error) {
      logger.warn("content.cache.second_pass_failed", { entity: change.entity, error });
      return;
    }
    await warmPaths(detailPathsForChange(change));
  });
}

/** Segunda expiração pedida por `expireInOwnRequest`: expira e aquece, sem agendar outra. */
export function expireSecondPass(change: ContentChange): string[] {
  const tags = tagsForChange(change);
  tags.forEach((tag) => revalidateTag(tag, { expire: 0 }));
  logger.info("content.cache.invalidated", { source: "second-pass-request", entity: change.entity, tags });
  warmDetailPages(change);
  return tags;
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
  expireAgainLater(change, tags);
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
  expireAgainLater(change, tags);
  return tags;
}
