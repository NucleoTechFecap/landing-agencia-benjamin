/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : queries.ts
 Descrição    : Consultas públicas às tabelas do CMS no Supabase (somente conteúdo publicado).

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

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Area,
  CaseCategory,
  CaseStudy,
  Cta,
  MediaRef,
  Page,
  Service,
  SiteSettings,
} from "@/lib/domain/content/types";
import { AppError } from "../../errors";
import { logger } from "../../logger";
import { toArea, toCase, toCategory, toCta, toMediaRef, toPage, toService, toSiteSettings } from "./mappers";
import {
  COLUMNS,
  type AreaRow,
  type BlockRow,
  type CaseMediaRow,
  type CaseRow,
  type CaseServiceRow,
  type CategoryRow,
  type CtaRow,
  type MediaAssetRow,
  type PageRow,
  type ServiceAreaRow,
  type ServiceRow,
  type SiteSettingsRow,
} from "./rows";

/*
 * Sempre com o cliente anônimo (createPublicClient): a RLS só devolve itens publicados com
 * data já alcançada. O filtro `status = published` repetido aqui é a segunda barreira — se
 * um dia alguém passar um cliente com sessão do painel, rascunhos continuam fora do site.
 */

type QueryResult = PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>;

async function rows<T>(table: string, query: QueryResult): Promise<T[]> {
  const { data, error } = await query;
  if (error) {
    throw new AppError("SERVICE_UNAVAILABLE", {
      message: "Conteúdo indisponível no momento. Tente novamente em instantes.",
      internal: { table, code: error.code },
      cause: error,
    });
  }
  return (data ?? []) as T[];
}

/**
 * Mídia por id. A RLS de media_assets só devolve arquivos usados por conteúdo publicado:
 * imagem de rascunho fica de fora e o item aparece sem imagem.
 */
export async function fetchMedia(
  client: SupabaseClient,
  ids: readonly (string | null)[],
  supabaseUrl: string,
): Promise<Map<string, MediaRef>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();
  const data = await rows<MediaAssetRow>(
    "media_assets",
    client.from("media_assets").select(COLUMNS.media_assets).in("id", unique),
  );
  return new Map(data.map((row) => [row.id, toMediaRef(row, supabaseUrl)]));
}

/**
 * Áreas e serviços publicados com o vínculo N:M. service_areas só expõe pares em que os dois
 * lados estão publicados, então um serviço nunca aponta para área em rascunho.
 */
export async function fetchAreasAndServices(
  client: SupabaseClient,
  supabaseUrl: string,
): Promise<{ areas: Area[]; services: Service[] }> {
  const [areaRows, serviceRows, links] = await Promise.all([
    rows<AreaRow>("areas", client.from("areas").select(COLUMNS.areas).eq("status", "published")),
    rows<ServiceRow>("services", client.from("services").select(COLUMNS.services).eq("status", "published")),
    rows<ServiceAreaRow>("service_areas", client.from("service_areas").select(COLUMNS.service_areas)),
  ]);
  const images = await fetchMedia(
    client,
    serviceRows.map((row) => row.image_media_id),
    supabaseUrl,
  );
  const areaIdsByService = new Map<string, string[]>();
  for (const link of links) {
    areaIdsByService.set(link.service_id, [...(areaIdsByService.get(link.service_id) ?? []), link.area_id]);
  }
  return {
    areas: areaRows.map(toArea),
    services: serviceRows.map((row) =>
      toService(
        row,
        areaIdsByService.get(row.id) ?? [],
        row.image_media_id ? images.get(row.image_media_id) : undefined,
      ),
    ),
  };
}

/**
 * Categorias e cases publicados com serviços, capa e galeria. case_services só expõe pares
 * case × serviço publicados e case_media só a galeria de case publicado (RLS); a galeria
 * segue sort_order.
 */
export async function fetchCasesAndCategories(
  client: SupabaseClient,
  supabaseUrl: string,
): Promise<{ categories: CaseCategory[]; cases: CaseStudy[] }> {
  const [categoryRows, caseRows, serviceLinks, galleryLinks] = await Promise.all([
    rows<CategoryRow>(
      "case_categories",
      client.from("case_categories").select(COLUMNS.case_categories).eq("status", "published"),
    ),
    rows<CaseRow>("cases", client.from("cases").select(COLUMNS.cases).eq("status", "published")),
    rows<CaseServiceRow>("case_services", client.from("case_services").select(COLUMNS.case_services)),
    rows<CaseMediaRow>("case_media", client.from("case_media").select(COLUMNS.case_media).order("sort_order")),
  ]);
  const media = await fetchMedia(
    client,
    [...caseRows.map((row) => row.cover_media_id), ...galleryLinks.map((link) => link.media_id)],
    supabaseUrl,
  );
  const group = <T extends { case_id: string }>(links: T[]) => {
    const byCase = new Map<string, T[]>();
    for (const link of links) byCase.set(link.case_id, [...(byCase.get(link.case_id) ?? []), link]);
    return byCase;
  };
  const servicesByCase = group(serviceLinks);
  const galleryByCase = group([...galleryLinks].sort((a, b) => a.sort_order - b.sort_order));
  return {
    categories: categoryRows.map(toCategory),
    cases: caseRows.map((row) =>
      toCase(row, {
        serviceIds: (servicesByCase.get(row.id) ?? []).map((link) => link.service_id),
        cover: row.cover_media_id ? media.get(row.cover_media_id) : undefined,
        gallery: (galleryByCase.get(row.id) ?? [])
          .map((link) => media.get(link.media_id))
          .filter((item): item is MediaRef => Boolean(item)),
      }),
    ),
  };
}

/**
 * Consulta leve usada pelo proxy (404 real para slug inexistente). Se o banco não responder,
 * deixa a requisição seguir (fail open): a própria página ainda chama notFound(), e um
 * problema de rede não pode transformar todo o portfólio em 404.
 */
export async function isSlugPublished(
  client: SupabaseClient,
  table: "services" | "cases",
  slug: string,
): Promise<boolean> {
  try {
    const found = await rows<{ slug: string }>(
      table,
      client.from(table).select("slug").eq("slug", slug).eq("status", "published").limit(1),
    );
    return found.length > 0;
  } catch (error) {
    logger.warn("content.slug_check.failed", { table, error });
    return true;
  }
}

export async function fetchCtas(client: SupabaseClient): Promise<Cta[]> {
  const data = await rows<CtaRow>("ctas", client.from("ctas").select(COLUMNS.ctas).eq("status", "published"));
  return data.map(toCta);
}

/** Página publicada pelo slug, com os blocos em ordem; `null` se não existir ou não estiver publicada. */
export async function fetchPage(client: SupabaseClient, slug: string): Promise<Page | null> {
  const [row] = await rows<PageRow>(
    "pages",
    client.from("pages").select(COLUMNS.pages).eq("slug", slug).eq("status", "published").limit(1),
  );
  if (!row) return null;
  const blocks = await rows<BlockRow>(
    "blocks",
    client.from("blocks").select(COLUMNS.blocks).eq("page_id", row.id).order("sort_order"),
  );
  const { page, problems } = toPage(row, blocks);
  if (problems.length) logger.warn("content.page.blocks_skipped", { slug, problems });
  return page;
}

/**
 * Configuração institucional (linha única). Sem linha no banco — ambiente recém-criado —
 * vale a configuração versionada, para cabeçalho, rodapé e SEO continuarem funcionando.
 */
export async function fetchSiteSettings(client: SupabaseClient, fallback: SiteSettings): Promise<SiteSettings> {
  const [row] = await rows<SiteSettingsRow>(
    "site_settings",
    client.from("site_settings").select(COLUMNS.site_settings).limit(1),
  );
  if (!row) {
    logger.warn("content.settings.missing", { fallback: "content/site.ts" });
    return fallback;
  }
  const { settings, problems } = toSiteSettings(row, fallback);
  if (problems.length) logger.error("content.settings.invalid_sections", { problems });
  return settings;
}
