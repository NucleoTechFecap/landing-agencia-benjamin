/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : memory-store.ts
 Descrição    : Store do CMS em memória para testar as regras sem banco.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Biblioteca de mídia no store e opções de imagem (ADM-06).
 26/10/2026 Vinícius Nishimura Reis  Categorias, cases, galeria e envio de mídia (ADM-08).
 29/10/2026 Vinicius Binda             Imita o trigger track_slug: endereços antigos e reservados (DB-08).
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 02/11/2026 Vinícius Nishimura Reis  Gravação de item com relações, como no banco (TECH-13, #314).
 04/11/2026 Vinícius Nishimura Reis  Editar texto alternativo e excluir arquivo sem uso da biblioteca (ADM-09).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import {
  assembleAreasAndServices,
  assembleCasesAndCategories,
  assemblePages,
  toCta,
  toMediaMap,
} from "../content/supabase/mappers";
import type {
  AreaRow,
  BlockRow,
  CaseMediaRow,
  CaseRow,
  CaseServiceRow,
  CategoryRow,
  CtaRow,
  MediaAssetRow,
  PageRow,
  ServiceAreaRow,
  ServiceRow,
} from "../content/supabase/rows";
import { AppError } from "../errors";
import type { CmsSnapshot, CmsStore, EntityTable, RedirectEntity, Row } from "./store";
import { toMediaAsset } from "./supabase-store";

/** Valores padrão das colunas, como no banco (default da migration). */
const DEFAULTS: Record<EntityTable, Row> = {
  areas: { summary: null, description: null, highlights: [], icon: null, sort_order: 0 },
  services: {
    summary: null,
    description: null,
    examples: [],
    icon: null,
    image_media_id: null,
    featured: false,
    sort_order: 0,
  },
  case_categories: { description: null, sort_order: 0 },
  cases: {
    client_name: null,
    category_id: null,
    delivery_type: null,
    summary: null,
    challenge: null,
    solution: null,
    results: null,
    cover_media_id: null,
    external_links: [],
    reference_month: null,
    team: [],
    featured: false,
    sort_order: 0,
  },
  ctas: {
    target_path: null,
    target_url: null,
    target_service_id: null,
    target_case_id: null,
    target_area_id: null,
    sort_order: 0,
  },
  pages: { description: null },
};

export interface MemoryTables {
  areas: AreaRow[];
  services: ServiceRow[];
  service_areas: ServiceAreaRow[];
  case_categories: CategoryRow[];
  cases: CaseRow[];
  case_services: CaseServiceRow[];
  case_media: CaseMediaRow[];
  media_assets: (MediaAssetRow & { updated_at?: string })[];
  ctas: CtaRow[];
  pages: PageRow[];
  blocks: BlockRow[];
  slug_redirects: SlugRedirectRow[];
}

export interface SlugRedirectRow {
  entity_type: RedirectEntity;
  old_slug: string;
  entity_id: string | null;
}

const REDIRECT_ENTITY: Partial<Record<EntityTable, RedirectEntity>> = { services: "service", cases: "case" };

/**
 * Imita o banco no que importa para as regras do CMS: slug único por tabela, endereços antigos
 * e reservados (trigger track_slug, DB-08), versão otimista por `updated_at`, vínculos em
 * cascata e categoria em uso bloqueando a exclusão. Não simula RLS — isso é coberto pelos
 * testes pgTAP e de integração com o Supabase local.
 */
export function createMemoryCmsStore(seed: Partial<MemoryTables> = {}) {
  const tables: MemoryTables = {
    areas: [],
    services: [],
    service_areas: [],
    case_categories: [],
    cases: [],
    case_services: [],
    case_media: [],
    media_assets: [],
    ctas: [],
    pages: [],
    blocks: [],
    slug_redirects: [],
    ...structuredClone(seed),
  };
  let clock = Date.parse("2026-10-26T12:00:00.000Z");
  const tick = () => new Date((clock += 1000)).toISOString();
  const rowsOf = (table: EntityTable) => tables[table] as unknown as Row[];
  const find = (table: EntityTable, id: string) => rowsOf(table).find((row) => row.id === id);

  function assertUniqueSlug(table: EntityTable, values: Row, id?: string) {
    if (!("slug" in values)) return;
    if (rowsOf(table).some((row) => row.slug === values.slug && row.id !== id)) {
      throw new AppError("VALIDATION_FAILED", {
        message: "Já existe um item com este endereço (slug).",
        fieldErrors: { slug: ["Já existe um item com este endereço. Escolha outro."] },
      });
    }
  }

  /** Mesmas regras do trigger track_slug: endereço de outro item é recusado; o antigo fica registrado. */
  function trackSlug(table: EntityTable, values: Row, id: string, current?: Row) {
    const entity = REDIRECT_ENTITY[table];
    if (!entity || !("slug" in values) || values.slug === current?.slug) return;
    const redirects = tables.slug_redirects;
    if (redirects.some((row) => row.entity_type === entity && row.old_slug === values.slug && row.entity_id !== id)) {
      throw new AppError("VALIDATION_FAILED", {
        message: "Já existe um item com este endereço (slug).",
        fieldErrors: { slug: ["Já existe um item com este endereço. Escolha outro."] },
      });
    }
    tables.slug_redirects = redirects.filter((row) => !(row.entity_type === entity && row.old_slug === values.slug));
    if (current?.published_at) {
      tables.slug_redirects.push({ entity_type: entity, old_slug: current.slug as string, entity_id: id });
    }
  }

  /** Item excluído que já foi ao ar: o endereço atual e os antigos ficam reservados. */
  function reserveSlugs(table: EntityTable, row: Row) {
    const entity = REDIRECT_ENTITY[table];
    if (!entity || !row.published_at) return;
    tables.slug_redirects = [
      ...tables.slug_redirects
        .filter((redirect) => !(redirect.entity_type === entity && redirect.old_slug === row.slug))
        .map((redirect) =>
          redirect.entity_type === entity && redirect.entity_id === row.id
            ? { ...redirect, entity_id: null }
            : redirect,
        ),
      { entity_type: entity, old_slug: row.slug as string, entity_id: null },
    ];
  }

  const store: CmsStore = {
    async snapshot(): Promise<CmsSnapshot> {
      const media = toMediaMap(tables.media_assets, "https://projeto.supabase.co");
      return structuredClone({
        ...assembleAreasAndServices(tables, media),
        ...assembleCasesAndCategories(tables, media),
        ctas: tables.ctas.map(toCta),
        pages: assemblePages(tables.pages, tables.blocks).pages,
      });
    },

    async listMedia() {
      return tables.media_assets.map((row) => toMediaAsset(row, "https://projeto.supabase.co"));
    },

    async insertMedia(values) {
      if (tables.media_assets.some((row) => row.path === values.path)) {
        throw new AppError("CONFLICT", { message: "Arquivo já registrado." });
      }
      const row = { ...values, id: crypto.randomUUID(), updated_at: tick() };
      tables.media_assets.push(row);
      return toMediaAsset(row, "https://projeto.supabase.co");
    },

    async updateMedia(id, values, expectedUpdatedAt) {
      const row = tables.media_assets.find((item) => item.id === id);
      if (!row) throw new AppError("NOT_FOUND");
      if ((row.updated_at ?? "") !== expectedUpdatedAt) throw new AppError("CONFLICT");
      Object.assign(row, values, { updated_at: tick() });
      return toMediaAsset(row, "https://projeto.supabase.co");
    },

    async removeMedia(id) {
      const index = tables.media_assets.findIndex((item) => item.id === id);
      if (index < 0) throw new AppError("NOT_FOUND");
      // FK restrict do banco: capa, galeria e imagem de serviço. A foto do time não tem FK.
      const referenced =
        tables.services.some((item) => item.image_media_id === id) ||
        tables.cases.some((item) => item.cover_media_id === id) ||
        tables.case_media.some((link) => link.media_id === id);
      if (referenced) throw new AppError("CONFLICT", { message: "Este item está em uso e não pode ser excluído." });
      tables.media_assets.splice(index, 1);
    },

    async retiredSlugs(entity) {
      return tables.slug_redirects
        .filter((row) => row.entity_type === entity)
        .map((row) => ({ slug: row.old_slug, itemId: row.entity_id }));
    },

    async insert(table, values) {
      assertUniqueSlug(table, values);
      const id = crypto.randomUUID();
      trackSlug(table, values, id);
      const now = tick();
      const row: Row = {
        ...DEFAULTS[table],
        status: "draft",
        provisional: false,
        published_at: null,
        archived_at: null,
        ...values,
        id,
        created_at: now,
        updated_at: now,
      };
      rowsOf(table).push(row);
      return { id: row.id as string, updatedAt: now };
    },

    async update(table, id, values, expectedUpdatedAt) {
      const row = find(table, id);
      if (!row) throw new AppError("NOT_FOUND");
      if (row.updated_at !== expectedUpdatedAt) throw new AppError("CONFLICT");
      assertUniqueSlug(table, values, id);
      trackSlug(table, values, id, row);
      Object.assign(row, values, { updated_at: tick() });
      return { id, updatedAt: row.updated_at as string };
    },

    async remove(table, id) {
      const row = find(table, id);
      if (!row) throw new AppError("NOT_FOUND");
      if (table === "case_categories" && tables.cases.some((item) => item.category_id === id)) {
        throw new AppError("CONFLICT", {
          message: "Este item está em uso por outro conteúdo e não pode ser excluído.",
        });
      }
      reserveSlugs(table, row);
      (tables[table] as unknown as Row[]).splice(
        rowsOf(table).findIndex((row) => row.id === id),
        1,
      );
      tables.service_areas = tables.service_areas.filter((link) => link.service_id !== id && link.area_id !== id);
      tables.case_services = tables.case_services.filter((link) => link.case_id !== id && link.service_id !== id);
      tables.case_media = tables.case_media.filter((link) => link.case_id !== id);
      tables.blocks = tables.blocks.filter((block) => block.page_id !== id);
    },

    async saveWithRelations(relations, values, version) {
      const saved = version
        ? await store.update(relations.table, version.id, values, version.expectedUpdatedAt)
        : await store.insert(relations.table, values);
      if (relations.table === "services") {
        tables.service_areas = [
          ...tables.service_areas.filter((link) => link.service_id !== saved.id),
          ...relations.areaIds.map((areaId) => ({ service_id: saved.id, area_id: areaId })),
        ];
      } else {
        tables.case_services = [
          ...tables.case_services.filter((link) => link.case_id !== saved.id),
          ...relations.serviceIds.map((serviceId) => ({ case_id: saved.id, service_id: serviceId })),
        ];
        tables.case_media = [
          ...tables.case_media.filter((link) => link.case_id !== saved.id),
          ...relations.galleryIds.map((mediaId, index) => ({
            case_id: saved.id,
            media_id: mediaId,
            sort_order: index,
          })),
        ];
      }
      return saved;
    },

    async insertBlock(values) {
      tables.blocks.push({ ...values, id: crypto.randomUUID() });
    },

    async updateBlock(id, values) {
      const block = tables.blocks.find((row) => row.id === id);
      if (!block) throw new AppError("NOT_FOUND");
      Object.assign(block, values);
    },

    async removeBlock(id) {
      if (!tables.blocks.some((row) => row.id === id)) throw new AppError("NOT_FOUND");
      tables.blocks = tables.blocks.filter((row) => row.id !== id);
    },
  };

  return { store, tables };
}
