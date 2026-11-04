/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : supabase-store.ts
 Descrição    : Implementação do store do CMS no Supabase com a sessão de quem edita (RLS).

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
 29/10/2026 Vinicius Binda             Leitura de public.slug_redirects (DB-08).
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 02/11/2026 Vinícius Nishimura Reis  Serviço e case gravados pelas funções do banco (TECH-13, #314).
 04/11/2026 Vinícius Nishimura Reis  Leitura e gravação da configuração institucional (ADM-10).
 04/11/2026 Vinícius Nishimura Reis  Editar texto alternativo e excluir arquivo sem uso da biblioteca (ADM-09).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
 04/11/2026 Vinícius Nishimura Reis  Conflito de versão também pelo código da DBX-04 (#372).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { siteSettings } from "@/content";
import type { ContentVersion } from "@/lib/domain/content/versions";
import {
  assembleAreasAndServices,
  assembleCasesAndCategories,
  assemblePages,
  toPage,
  toCta,
  toMediaMap,
  toMediaRef,
  toSiteSettings,
} from "../content/supabase/mappers";
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
} from "../content/supabase/rows";
import { AppError } from "../errors";
import { logger } from "../logger";
import type { CmsSnapshot, CmsStore, EntityTable, MediaAsset, MediaRow, SavedRow } from "./store";

interface PostgrestError {
  message: string;
  code?: string;
  details?: string;
}

/** Traduz o erro do PostgREST/Postgres para o código da aplicação (sem vazar detalhes). */
export function toCmsError(error: PostgrestError, context: { table: string; operation: string }): AppError {
  const internal = { ...context, code: error.code };
  switch (error.code) {
    case "23505":
      return new AppError("VALIDATION_FAILED", {
        message: "Já existe um item com este endereço (slug).",
        fieldErrors: { slug: ["Já existe um item com este endereço. Escolha outro."] },
        internal,
      });
    case "23503":
      return new AppError("CONFLICT", {
        message:
          context.operation === "save"
            ? "Uma área, serviço, categoria ou imagem escolhida não existe mais. Nada foi salvo: recarregue a página e confira."
            : "Este item está em uso por outro conteúdo (inclusive rascunhos) e não pode ser excluído.",
        internal,
      });
    case "23514":
      return new AppError("VALIDATION_FAILED", {
        message: "Algum campo está fora das regras de publicação. Revise e tente de novo.",
        internal,
      });
    case "42501":
      return new AppError("FORBIDDEN", { internal });
    // Versão desatualizada: 40001 nas funções de hoje, BJ002 nas que a DBX-04 (#372) redefine. Os dois valem.
    case "40001":
    case "BJ002":
      return new AppError("CONFLICT", { internal });
    case "P0002":
      return new AppError("NOT_FOUND", { internal });
    default:
      return new AppError("SERVICE_UNAVAILABLE", { internal, cause: error });
  }
}

type Result<T> = PromiseLike<{ data: T | null; error: PostgrestError | null }>;

async function run<T>(query: Result<T>, context: { table: string; operation: string }): Promise<T | null> {
  const { data, error } = await query;
  if (error) throw toCmsError(error, context);
  return data;
}

const VERSION_LIST_COLUMNS =
  "entity, entity_id, version, action, status, label, summary, restored_from, created_by, created_at";
const VERSION_COLUMNS = `${VERSION_LIST_COLUMNS}, snapshot`;

interface VersionRow {
  entity: ContentVersion["entity"];
  entity_id: string;
  version: number;
  action: ContentVersion["action"];
  status: ContentVersion["status"];
  label: string | null;
  summary: string | null;
  /** Só na leitura de uma versão: a lista mostra a linha do tempo, sem carregar o conteúdo de cada uma. */
  snapshot?: Record<string, unknown> | null;
  restored_from: number | null;
  created_by: string | null;
  created_at: string;
}

/** Nome de quem alterou. Falha aqui não esconde o histórico: a linha só fica sem o nome. */
async function withAuthors(client: SupabaseClient, rows: readonly VersionRow[]): Promise<ContentVersion[]> {
  const ids = [...new Set(rows.flatMap((row) => row.created_by ?? []))];
  const names = new Map<string, string | null>();
  if (ids.length) {
    const { data, error } = await client.rpc("content_version_authors", { p_ids: ids });
    if (error) logger.warn("cms.version.authors_failed", { code: error.code });
    for (const author of (data ?? []) as { id: string; full_name: string | null }[]) {
      names.set(author.id, author.full_name);
    }
  }
  return rows.map((row) => ({
    entity: row.entity,
    entityId: row.entity_id,
    version: row.version,
    action: row.action,
    status: row.status,
    label: row.label,
    summary: row.summary,
    snapshot: row.snapshot ?? null,
    restoredFrom: row.restored_from,
    authorId: row.created_by,
    authorName: row.created_by ? (names.get(row.created_by) ?? null) : null,
    createdAt: row.created_at,
  }));
}

const saved = (row: { id: string; updated_at: string }): SavedRow => ({ id: row.id, updatedAt: row.updated_at });

export function toMediaAsset(row: MediaAssetRow & { updated_at?: string }, supabaseUrl: string): MediaAsset {
  return {
    ...toMediaRef(row, supabaseUrl),
    id: row.id,
    path: row.path,
    mimeType: row.mime_type,
    decorative: row.decorative,
    updatedAt: row.updated_at ?? "",
  };
}

const MEDIA_ASSET_COLUMNS = `${COLUMNS.media_assets}, updated_at` as const;

/**
 * Store do CMS sobre o Supabase. Recebe o cliente com a sessão do usuário (createSessionClient):
 * as políticas "painel lê/cria rascunho/edita/exclui arquivados" do banco valem para cada
 * operação, além do requirePermission que a Server Action já fez.
 */
export function createSupabaseCmsStore(client: SupabaseClient, supabaseUrl: string): CmsStore {
  const all = async <T>(table: keyof typeof COLUMNS) =>
    (await run<T[]>(client.from(table).select(COLUMNS[table]), { table, operation: "select" })) ?? [];

  async function currentVersion(table: EntityTable, id: string): Promise<string | null> {
    const row = await run<{ updated_at: string }>(client.from(table).select("updated_at").eq("id", id).maybeSingle(), {
      table,
      operation: "select",
    });
    return row?.updated_at ?? null;
  }

  return {
    async snapshot(): Promise<CmsSnapshot> {
      const [areas, services, serviceAreas, categories, cases, caseServices, caseMedia, media, ctas, pages, blocks] =
        await Promise.all([
          all<AreaRow>("areas"),
          all<ServiceRow>("services"),
          all<ServiceAreaRow>("service_areas"),
          all<CategoryRow>("case_categories"),
          all<CaseRow>("cases"),
          all<CaseServiceRow>("case_services"),
          all<CaseMediaRow>("case_media"),
          all<MediaAssetRow>("media_assets"),
          all<CtaRow>("ctas"),
          all<PageRow>("pages"),
          all<BlockRow>("blocks"),
        ]);
      const mediaById = toMediaMap(media, supabaseUrl);
      const assembled = assemblePages(pages, blocks);
      if (assembled.problems.length) logger.warn("cms.page.blocks_skipped", { problems: assembled.problems });
      return {
        ...assembleAreasAndServices({ areas, services, service_areas: serviceAreas }, mediaById),
        ...assembleCasesAndCategories(
          { case_categories: categories, cases, case_services: caseServices, case_media: caseMedia },
          mediaById,
        ),
        ctas: ctas.map(toCta),
        pages: assembled.pages,
      };
    },

    async listMedia(): Promise<MediaAsset[]> {
      const rows =
        (await run<(MediaAssetRow & { created_at: string; updated_at: string })[]>(
          client
            .from("media_assets")
            .select(`${MEDIA_ASSET_COLUMNS}, created_at`)
            .order("created_at", { ascending: false }),
          { table: "media_assets", operation: "select" },
        )) ?? [];
      return rows.map((row) => toMediaAsset(row, supabaseUrl));
    },

    async retiredSlugs(entity) {
      const rows =
        (await run<{ old_slug: string; entity_id: string | null }[]>(
          client.from("slug_redirects").select("old_slug, entity_id").eq("entity_type", entity),
          { table: "slug_redirects", operation: "select" },
        )) ?? [];
      return rows.map((row) => ({ slug: row.old_slug, itemId: row.entity_id }));
    },

    async insertMedia(values: MediaRow): Promise<MediaAsset> {
      const row = await run<MediaAssetRow & { updated_at: string }>(
        client.from("media_assets").insert(values).select(MEDIA_ASSET_COLUMNS).single(),
        { table: "media_assets", operation: "insert" },
      );
      return toMediaAsset(row!, supabaseUrl);
    },

    async updateMedia(id, values, expectedUpdatedAt) {
      const context = { table: "media_assets", operation: "update" };
      const row = await run<MediaAssetRow & { updated_at: string }>(
        client
          .from("media_assets")
          .update(values)
          .eq("id", id)
          .eq("updated_at", expectedUpdatedAt)
          .select(MEDIA_ASSET_COLUMNS)
          .maybeSingle(),
        context,
      );
      if (row) return toMediaAsset(row, supabaseUrl);
      const current = await run<{ updated_at: string }>(
        client.from("media_assets").select("updated_at").eq("id", id).maybeSingle(),
        { ...context, operation: "select" },
      );
      if (!current) throw new AppError("NOT_FOUND");
      if (current.updated_at !== expectedUpdatedAt) throw new AppError("CONFLICT");
      logger.warn("cms.update.denied_by_rls", { table: "media_assets", id });
      throw new AppError("FORBIDDEN");
    },

    async removeMedia(id) {
      const context = { table: "media_assets", operation: "delete" };
      const rows = await run<{ id: string }[]>(client.from("media_assets").delete().eq("id", id).select("id"), context);
      if (rows?.length) return;
      const current = await run<{ id: string }>(client.from("media_assets").select("id").eq("id", id).maybeSingle(), {
        ...context,
        operation: "select",
      });
      if (!current) throw new AppError("NOT_FOUND");
      logger.warn("cms.delete.denied_by_rls", { table: "media_assets", id });
      throw new AppError("FORBIDDEN");
    },

    async insert(table, values) {
      const row = await run<{ id: string; updated_at: string }>(
        client.from(table).insert(values).select("id, updated_at").single(),
        { table, operation: "insert" },
      );
      return saved(row!);
    },

    async update(table, id, values, expectedUpdatedAt) {
      const row = await run<{ id: string; updated_at: string }>(
        client
          .from(table)
          .update(values)
          .eq("id", id)
          .eq("updated_at", expectedUpdatedAt)
          .select("id, updated_at")
          .maybeSingle(),
        { table, operation: "update" },
      );
      if (row) return saved(row);
      // Nenhuma linha: o item sumiu, mudou desde a leitura ou a RLS barrou a gravação.
      const version = await currentVersion(table, id);
      if (version === null) throw new AppError("NOT_FOUND");
      if (version !== expectedUpdatedAt) throw new AppError("CONFLICT");
      logger.warn("cms.update.denied_by_rls", { table, id });
      throw new AppError("FORBIDDEN");
    },

    async remove(table, id) {
      const rows = await run<{ id: string }[]>(client.from(table).delete().eq("id", id).select("id"), {
        table,
        operation: "delete",
      });
      if (rows?.length) return;
      if ((await currentVersion(table, id)) === null) throw new AppError("NOT_FOUND");
      // A política só exclui itens arquivados e com permissão de exclusão.
      throw new AppError("FORBIDDEN");
    },

    async saveWithRelations(relations, values, version) {
      const item = {
        p_id: version?.id ?? null,
        p_expected_updated_at: version?.expectedUpdatedAt ?? null,
        p_values: values,
      };
      const rows = await run<{ id: string; updated_at: string }[]>(
        relations.table === "services"
          ? client.rpc("save_service", { ...item, p_area_ids: relations.areaIds })
          : client.rpc("save_case", {
              ...item,
              p_service_ids: relations.serviceIds,
              p_gallery_ids: relations.galleryIds,
            }),
        { table: relations.table, operation: "save" },
      );
      return saved(rows![0]);
    },

    async insertBlock(values) {
      await run(client.from("blocks").insert(values), { table: "blocks", operation: "insert" });
    },

    async updateBlock(id, values) {
      const rows = await run<{ id: string }[]>(client.from("blocks").update(values).eq("id", id).select("id"), {
        table: "blocks",
        operation: "update",
      });
      if (!rows?.length) throw new AppError("NOT_FOUND");
    },

    async removeBlock(id) {
      const rows = await run<{ id: string }[]>(client.from("blocks").delete().eq("id", id).select("id"), {
        table: "blocks",
        operation: "delete",
      });
      if (!rows?.length) throw new AppError("NOT_FOUND");
    },

    async readSettings() {
      const row = await run<SiteSettingsRow & { updated_at: string }>(
        client.from("site_settings").select(`${COLUMNS.site_settings}, updated_at`).maybeSingle(),
        { table: "site_settings", operation: "select" },
      );
      if (!row) return null;
      const { settings, problems } = toSiteSettings(row, siteSettings);
      if (problems.length) logger.error("cms.settings.invalid_sections", { problems });
      return { settings, updatedAt: row.updated_at };
    },

    async readPage(id) {
      const [rows, blocks] = await Promise.all([
        run<PageRow[]>(client.from("pages").select(COLUMNS.pages).eq("id", id), {
          table: "pages",
          operation: "select",
        }),
        run<BlockRow[]>(client.from("blocks").select(COLUMNS.blocks).eq("page_id", id), {
          table: "blocks",
          operation: "select",
        }),
      ]);
      const [row] = rows ?? [];
      if (!row) return null;
      const { page, problems } = toPage(row, blocks ?? []);
      if (problems.length) logger.warn("cms.page.blocks_skipped", { problems });
      return page;
    },

    async savePageDocument(id, expectedUpdatedAt, document) {
      const rows = await run<{ id: string; updated_at: string }[]>(
        client.rpc("save_page_document", {
          p_id: id,
          p_expected_updated_at: expectedUpdatedAt,
          p_values: document.values,
          p_blocks: document.blocks,
        }),
        { table: "pages", operation: "save" },
      );
      return saved(rows![0]);
    },

    async insertVersion({ entity, entityId, action, status, label, summary, snapshot, restoredFrom }) {
      await run(
        client.from("content_versions").insert({
          entity,
          entity_id: entityId,
          action,
          status,
          label,
          summary: summary ?? null,
          snapshot,
          restored_from: restoredFrom ?? null,
          // O gatilho do banco sobrescreve: o valor aqui só satisfaz o `not null` antes dele.
          version: 1,
        }),
        { table: "content_versions", operation: "insert" },
      );
    },

    async countVersions(entity, entityId) {
      const { count, error } = await client
        .from("content_versions")
        .select("id", { count: "exact", head: true })
        .eq("entity", entity)
        .eq("entity_id", entityId);
      if (error) throw toCmsError(error, { table: "content_versions", operation: "select" });
      return count ?? 0;
    },

    async listVersions({ entity, entityId, limit }) {
      let query = client
        .from("content_versions")
        .select(VERSION_LIST_COLUMNS)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(limit);
      if (entity) query = query.eq("entity", entity);
      if (entityId) query = query.eq("entity_id", entityId);
      const rows = (await run<VersionRow[]>(query, { table: "content_versions", operation: "select" })) ?? [];
      return withAuthors(client, rows);
    },

    async readVersion(entity, entityId, version) {
      const rows =
        (await run<VersionRow[]>(
          client
            .from("content_versions")
            .select(VERSION_COLUMNS)
            .eq("entity", entity)
            .eq("entity_id", entityId)
            .eq("version", version),
          { table: "content_versions", operation: "select" },
        )) ?? [];
      const [found] = await withAuthors(client, rows);
      return found ?? null;
    },

    async saveSettings(values, expectedUpdatedAt) {
      const context = { table: "site_settings", operation: "save" };
      if (expectedUpdatedAt === null) {
        const { error } = await client.from("site_settings").insert(values);
        // Linha única: chave repetida quer dizer que outra pessoa criou a linha antes desta gravação.
        if (error?.code === "23505") throw new AppError("CONFLICT", { internal: { ...context, code: error.code } });
        if (error) throw toCmsError(error, context);
        return;
      }
      const row = await run<{ updated_at: string }>(
        client
          .from("site_settings")
          .update(values)
          .eq("id", true)
          .eq("updated_at", expectedUpdatedAt)
          .select("updated_at")
          .maybeSingle(),
        context,
      );
      if (row) return;
      // Nenhuma linha: mudou desde a leitura ou a RLS barrou a gravação.
      const current = await run<{ updated_at: string }>(
        client.from("site_settings").select("updated_at").maybeSingle(),
        context,
      );
      if (current?.updated_at !== expectedUpdatedAt) throw new AppError("CONFLICT");
      logger.warn("cms.update.denied_by_rls", { table: "site_settings" });
      throw new AppError("FORBIDDEN");
    },
  };
}
