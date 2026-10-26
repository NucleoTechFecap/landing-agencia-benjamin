/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : mappers.ts
 Descrição    : Converte as linhas do banco do CMS nos tipos de domínio usados pelo site.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { parseBlock, type PageBlock } from "@/lib/domain/content/blocks";
import { parseSettingsSections } from "@/lib/domain/content/settings-schema";
import type { Cta, CtaTarget, Page, Publishable, SiteSettings } from "@/lib/domain/content/types";
import type { BlockRow, CtaRow, PageRow, PublishableRow, SiteSettingsRow } from "./rows";

/** Funções puras (sem I/O): testadas sem banco em mappers.test.ts. */

export function toPublishable(row: PublishableRow): Publishable {
  return {
    status: row.status,
    publishedAt: row.published_at,
    archivedAt: row.archived_at,
    updatedAt: row.updated_at,
    provisional: row.provisional,
  };
}

/**
 * Destino do CTA a partir das colunas target_*. Quando o item apontado é excluído, a FK
 * vira null (on delete set null): o id fica vazio e resolveCtaHref cai no fallback (R04).
 */
export function toCtaTarget(row: CtaRow): CtaTarget {
  switch (row.target_kind) {
    case "internal":
      return { kind: "internal", path: row.target_path ?? "/" };
    case "external":
      return { kind: "external", url: row.target_url ?? "" };
    case "service":
      return { kind: "service", serviceId: row.target_service_id ?? "" };
    case "case":
      return { kind: "case", caseId: row.target_case_id ?? "" };
    case "area":
      return { kind: "area", areaId: row.target_area_id ?? "" };
    case "contact":
      return row.target_service_id ? { kind: "contact", serviceId: row.target_service_id } : { kind: "contact" };
  }
}

export function toCta(row: CtaRow): Cta {
  return {
    ...toPublishable(row),
    id: row.id,
    label: row.label,
    target: toCtaTarget(row),
    placement: row.placement,
    order: row.sort_order,
  };
}

/**
 * Página com os blocos válidos em ordem. Bloco de tipo desconhecido ou com conteúdo fora
 * do catálogo é descartado (o restante da página continua no ar) e reportado em `problems`.
 */
export function toPage(row: PageRow, blocks: readonly BlockRow[]): { page: Page; problems: string[] } {
  const problems: string[] = [];
  const parsed: PageBlock[] = [];
  for (const block of [...blocks].sort((a, b) => a.sort_order - b.sort_order)) {
    const result = parseBlock({ id: block.id, type: block.type, content: block.content, order: block.sort_order });
    if (result.ok) parsed.push(result.block);
    else problems.push(result.problem);
  }
  return {
    page: {
      ...toPublishable(row),
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description ?? undefined,
      blocks: parsed,
    },
    problems,
  };
}

/** Configuração institucional do banco; seções jsonb inválidas usam o valor de referência. */
export function toSiteSettings(
  row: SiteSettingsRow,
  fallback: SiteSettings,
): { settings: SiteSettings; problems: string[] } {
  const { sections, problems } = parseSettingsSections(row, fallback);
  return {
    settings: {
      name: row.name,
      shortName: row.short_name,
      tagline: row.tagline,
      description: row.description,
      ...sections,
      keywords: row.keywords ?? [],
    },
    problems,
  };
}
