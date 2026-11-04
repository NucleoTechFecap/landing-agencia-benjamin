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
 02/11/2026 Vinicius Binda             Erros de transição e de integridade de publicação do banco (DBX-04).
 04/11/2026 Vinícius Nishimura Reis  Leitura e gravação da configuração institucional (ADM-10).
 04/11/2026 Vinícius Nishimura Reis  Editar texto alternativo e excluir arquivo sem uso da biblioteca (ADM-09).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { siteSettings } from "@/content";
import {
  assembleAreasAndServices,
  assembleCasesAndCategories,
  assemblePages,
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
    case "BJ002":
      return new AppError("CONFLICT", { internal });
    case "P0002":
      return new AppError("NOT_FOUND", { internal });
    case "BJ001":
      return new AppError("INVALID_TRANSITION", { internal });
    case "BJ003":
      return new AppError("CONFLICT", {
        message:
          "Esta alteração deixaria conteúdo publicado sem área, categoria, serviço ou texto alternativo. Nada foi salvo: recarregue a página e confira.",
        internal,
      });
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
