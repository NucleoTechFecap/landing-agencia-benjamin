/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : published-slugs.ts
 Descrição    : Resolve o endereço de serviço/case: atual, 301 para o slug atual ou 404 real no proxy.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 29/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 26/10/2026 Vinícius Nishimura Reis  Parâmetro estático para banco vazio (DB-03).
 26/10/2026 Vinícius Nishimura Reis  Áreas e serviços do Supabase e checagem de slug do proxy (DB-04).
 29/10/2026 Vinicius Binda             Endereço antigo e maiúsculas com 301 para o slug atual (DB-08).
──────────────────────────────────────────────────────────────────────────────
*/

import { isValidSlug } from "@/lib/domain/content/slug";
import { getContentSource, type DetailRoute } from "./sources";

export type { DetailRoute };

/**
 * Slug impossível (falha em isValidSlug) usado quando não há nada publicado: com Cache
 * Components, `generateStaticParams` precisa devolver ao menos um parâmetro, senão o build
 * quebra com o banco vazio. A página responde 404 para ele (proxy e notFound()).
 */
export const PLACEHOLDER_SLUG = "__sem-conteudo__";

export function toStaticParams(slugs: readonly string[]): { slug: string }[] {
  return (slugs.length ? slugs : [PLACEHOLDER_SLUG]).map((slug) => ({ slug }));
}

/**
 * O que fazer com o endereço pedido (DB-08): servir (`current`), redirecionar com 301 para o
 * slug atual (`moved`: endereço antigo ou com maiúsculas) ou responder 404 (`missing`).
 */
export type SlugResolution = { status: "current" } | { status: "moved"; slug: string } | { status: "missing" };

/**
 * Verificação leve usada pelo proxy para responder 404 ou 301 de verdade (RF-18) antes do
 * streaming começar — depois dele o status já foi enviado como 200 — e pela API. Consulta a
 * fonte ativa: content/ ou o Supabase (`resolve_public_slug`, com RLS). Maiúsculas viram
 * minúsculas antes da consulta: `/cases/Meridiano` vai direto ao endereço atual, num só 301.
 */
export async function resolveDetailSlug(
  route: DetailRoute,
  slug: string,
  now: Date = new Date(),
): Promise<SlugResolution> {
  const lower = slug.toLowerCase();
  if (!isValidSlug(lower)) return { status: "missing" };
  const current = await getContentSource().currentSlug(route, lower, now);
  if (!current) return { status: "missing" };
  return current === slug ? { status: "current" } : { status: "moved", slug: current };
}
