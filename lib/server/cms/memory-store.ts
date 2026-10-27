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
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Biblioteca de mídia no store e opções de imagem (ADM-06).
 26/10/2026 Vinícius Nishimura Reis  Categorias, cases, galeria e envio de mídia (ADM-08).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { ContentSnapshot } from "@/lib/domain/content/types";
import { assembleAreasAndServices, assembleCasesAndCategories, toCta, toMediaMap } from "../content/supabase/mappers";
import type {
  AreaRow,
  CaseMediaRow,
  CaseRow,
  CaseServiceRow,
  CategoryRow,
  CtaRow,
  MediaAssetRow,
  ServiceAreaRow,
  ServiceRow,
} from "../content/supabase/rows";
import { AppError } from "../errors";
import type { CmsStore, EntityTable, Row } from "./store";
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
};

export interface MemoryTables {
  areas: AreaRow[];
  services: ServiceRow[];
  service_areas: ServiceAreaRow[];
  case_categories: CategoryRow[];
  cases: CaseRow[];
  case_services: CaseServiceRow[];
  case_media: CaseMediaRow[];
  media_assets: MediaAssetRow[];
  ctas: CtaRow[];
}

/**
 * Imita o banco no que importa para as regras do CMS: slug único por tabela, versão otimista
 * por `updated_at`, vínculos em cascata e categoria em uso bloqueando a exclusão. Não simula
 * RLS — isso é coberto pelos testes pgTAP e de integração com o Supabase local.
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

  const store: CmsStore = {
    async snapshot(): Promise<ContentSnapshot> {
      const media = toMediaMap(tables.media_assets, "https://projeto.supabase.co");
      return structuredClone({
        ...assembleAreasAndServices(tables, media),
        ...assembleCasesAndCategories(tables, media),
        ctas: tables.ctas.map(toCta),
      });
    },

    async listMedia() {
      return tables.media_assets.map((row) => toMediaAsset(row, "https://projeto.supabase.co"));
    },

    async insertMedia(values) {
      if (tables.media_assets.some((row) => row.path === values.path)) {
        throw new AppError("CONFLICT", { message: "Arquivo já registrado." });
      }
      const row = { ...values, id: crypto.randomUUID() };
      tables.media_assets.push(row);
      return toMediaAsset(row, "https://projeto.supabase.co");
    },

    async syncGallery(caseId, mediaIds) {
      tables.case_media = [
        ...tables.case_media.filter((link) => link.case_id !== caseId),
        ...mediaIds.map((mediaId, index) => ({ case_id: caseId, media_id: mediaId, sort_order: index })),
      ];
    },

    async insert(table, values) {
      assertUniqueSlug(table, values);
      const now = tick();
      const row: Row = {
        ...DEFAULTS[table],
        status: "draft",
        provisional: false,
        published_at: null,
        archived_at: null,
        ...values,
        id: crypto.randomUUID(),
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
      Object.assign(row, values, { updated_at: tick() });
      return { id, updatedAt: row.updated_at as string };
    },

    async remove(table, id) {
      if (!find(table, id)) throw new AppError("NOT_FOUND");
      if (table === "case_categories" && tables.cases.some((item) => item.category_id === id)) {
        throw new AppError("CONFLICT", {
          message: "Este item está em uso por outro conteúdo e não pode ser excluído.",
        });
      }
      (tables[table] as unknown as Row[]).splice(
        rowsOf(table).findIndex((row) => row.id === id),
        1,
      );
      tables.service_areas = tables.service_areas.filter((link) => link.service_id !== id && link.area_id !== id);
      tables.case_services = tables.case_services.filter((link) => link.case_id !== id && link.service_id !== id);
      tables.case_media = tables.case_media.filter((link) => link.case_id !== id);
    },

    async syncLinks({ table, ownerColumn, ownerId, otherColumn, next }) {
      const links = tables[table] as unknown as Row[];
      const kept = links.filter((link) => link[ownerColumn] !== ownerId);
      const added = next.map((otherId) => ({ [ownerColumn]: ownerId, [otherColumn]: otherId }));
      (tables as unknown as Record<string, Row[]>)[table] = [...kept, ...added];
    },
  };

  return { store, tables };
}
