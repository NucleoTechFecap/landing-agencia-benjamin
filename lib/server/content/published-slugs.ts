/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : published-slugs.ts
 Descrição    : Verifica se um slug de serviço/case está publicado (404 real no proxy).

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import { seedSnapshot } from "@/content";
import { isValidSlug } from "@/lib/domain/content/slug";
import { isPubliclyVisible } from "@/lib/domain/content/visibility";

export type DetailRoute = "servicos" | "cases";

/**
 * Verificação leve usada pelo proxy para responder 404 de verdade (RF-18) antes do
 * streaming começar — depois dele o status já foi enviado como 200.
 * Fonte atual: conteúdo versionado. Ao ligar o CMS (DB-04/DB-05), trocar por consulta
 * anônima ao Supabase (`select slug ... where status = 'published'`).
 */
export async function publishedSlugExists(route: DetailRoute, slug: string, now: Date = new Date()): Promise<boolean> {
  if (!isValidSlug(slug)) return false;
  const items = route === "servicos" ? seedSnapshot.services : seedSnapshot.cases;
  return items.some((item) => item.slug === slug && isPubliclyVisible(item, now));
}
