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
 26/10/2026 Vinícius Nishimura Reis  Áreas, serviços, vínculos e mídia do CMS (DB-04).
 26/10/2026 Vinícius Nishimura Reis  Categorias, cases, vínculos e galeria do CMS (DB-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { parseBlock, type PageBlock } from "@/lib/domain/content/blocks";
import { parseSettingsSections } from "@/lib/domain/content/settings-schema";
import type {
  Area,
  CaseCategory,
  CaseStudy,
  Cta,
  CtaTarget,
  ExternalLink,
  MediaRef,
  Page,
  Publishable,
  Service,
  SiteSettings,
} from "@/lib/domain/content/types";
import { publicMediaUrl } from "@/lib/domain/media/policy";
import type {
  AreaRow,
  BlockRow,
  CaseRow,
  CategoryRow,
  CtaRow,
  MediaAssetRow,
  PageRow,
  PublishableRow,
  ServiceRow,
  SiteSettingsRow,
} from "./rows";

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
 * Mídia da biblioteca: arquivo versionado em /public (caminho começando com "/") ou objeto
 * do bucket "media", que vira URL pública do Storage. Imagem decorativa tem alt vazio.
 */
export function toMediaRef(row: MediaAssetRow, supabaseUrl: string): MediaRef {
  return {
    src: row.path.startsWith("/") ? row.path : publicMediaUrl(supabaseUrl, row.path),
    alt: row.decorative ? "" : (row.alt_text ?? ""),
    width: row.width ?? undefined,
    height: row.height ?? undefined,
  };
}

/*
 * summary/description são opcionais no banco para o rascunho poder ser salvo aos poucos; a
 * constraint *_publish_fields garante que item publicado os tenha. Por isso o `?? ""` só
 * entra em ação para o painel, nunca no que o visitante vê.
 */
export function toArea(row: AreaRow): Area {
  return {
    ...toPublishable(row),
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary ?? "",
    description: row.description ?? "",
    highlights: row.highlights,
    icon: row.icon ?? undefined,
    order: row.sort_order,
  };
}

export function toService(row: ServiceRow, areaIds: string[], image?: MediaRef): Service {
  return {
    ...toPublishable(row),
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary ?? "",
    description: row.description ?? "",
    areaIds,
    examples: row.examples,
    icon: row.icon ?? undefined,
    image,
    featured: row.featured,
    order: row.sort_order,
  };
}

export function toCategory(row: CategoryRow): CaseCategory {
  return {
    ...toPublishable(row),
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    order: row.sort_order,
  };
}

/** Links externos válidos (label + url https); qualquer outra coisa no jsonb é ignorada. */
export function toExternalLinks(value: unknown): ExternalLink[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (link): link is ExternalLink =>
      typeof link === "object" &&
      link !== null &&
      typeof link.label === "string" &&
      typeof link.url === "string" &&
      link.url.startsWith("https://"),
  );
}

/**
 * Case com serviços, capa e galeria já resolvidos. `reference_month` (AAAA-MM-01) vira o
 * mês AAAA-MM do domínio; cliente e categoria vazios só acontecem em rascunho (a
 * constraint cases_publish_fields exige os dois para publicar).
 */
export function toCase(
  row: CaseRow,
  relations: { serviceIds: string[]; cover?: MediaRef; gallery: MediaRef[] },
): CaseStudy {
  return {
    ...toPublishable(row),
    id: row.id,
    slug: row.slug,
    title: row.title,
    client: row.client_name ?? "",
    categoryId: row.category_id ?? "",
    serviceIds: relations.serviceIds,
    deliveryType: row.delivery_type ?? undefined,
    summary: row.summary ?? "",
    challenge: row.challenge ?? undefined,
    solution: row.solution ?? undefined,
    results: row.results ?? undefined,
    cover: relations.cover,
    gallery: relations.gallery,
    externalLinks: toExternalLinks(row.external_links),
    date: row.reference_month?.slice(0, 7),
    team: row.team,
    featured: row.featured,
    order: row.sort_order,
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
