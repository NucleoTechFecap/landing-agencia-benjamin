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
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Biblioteca de mídia no store e opções de imagem (ADM-06).
 26/10/2026 Vinícius Nishimura Reis  Categorias, cases, galeria e envio de mídia (ADM-08).
 28/10/2026 Vinícius Nishimura Reis  Usa RPCs para salvar item e relações atomicamente (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentSnapshot } from "@/lib/domain/content/types";
import {
  assembleAreasAndServices,
  assembleCasesAndCategories,
  toCta,
  toMediaMap,
  toMediaRef,
} from "../content/supabase/mappers";
import {
  COLUMNS,
  type AreaRow,
  type CaseMediaRow,
  type CaseRow,
  type CaseServiceRow,
  type CategoryRow,
  type CtaRow,
  type MediaAssetRow,
  type ServiceAreaRow,
  type ServiceRow,
} from "../content/supabase/rows";
import { AppError } from "../errors";
import { logger } from "../logger";
import type { AtomicSave, CmsStore, EntityTable, MediaAsset, MediaRow, SavedRow } from "./store";

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
        message: "Este item está em uso por outro conteúdo (inclusive rascunhos) e não pode ser excluído.",
        internal,
      });
    case "23514":
      return new AppError("VALIDATION_FAILED", {
        message: "Algum campo está fora das regras de publicação. Revise e tente de novo.",
        internal,
      });
    case "40001":
      return new AppError("CONFLICT", {
        message: "O conteúdo foi alterado por outra pessoa. Recarregue e tente de novo.",
        internal,
      });
    case "42501":
      return new AppError("FORBIDDEN", { internal });
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

export function toMediaAsset(row: MediaAssetRow, supabaseUrl: string): MediaAsset {
  return { ...toMediaRef(row, supabaseUrl), id: row.id, mimeType: row.mime_type, decorative: row.decorative };
}

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
    async snapshot(): Promise<ContentSnapshot> {
      const [areas, services, serviceAreas, categories, cases, caseServices, caseMedia, media, ctas] =
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
        ]);
      const mediaById = toMediaMap(media, supabaseUrl);
      return {
        ...assembleAreasAndServices({ areas, services, service_areas: serviceAreas }, mediaById),
        ...assembleCasesAndCategories(
          { case_categories: categories, cases, case_services: caseServices, case_media: caseMedia },
          mediaById,
        ),
        ctas: ctas.map(toCta),
      };
    },

    async listMedia(): Promise<MediaAsset[]> {
      const rows =
        (await run<(MediaAssetRow & { created_at: string })[]>(
          client
            .from("media_assets")
            .select(`${COLUMNS.media_assets}, created_at`)
            .order("created_at", { ascending: false }),
          { table: "media_assets", operation: "select" },
        )) ?? [];
      return rows.map((row) => toMediaAsset(row, supabaseUrl));
    },

    async saveAtomic(input: AtomicSave): Promise<SavedRow> {
      const common = {
        p_id: input.id ?? null,
        p_expected_updated_at: input.expectedUpdatedAt ?? null,
        p_values: input.values,
      };
      let functionName: string;
      let args: Record<string, unknown>;
      switch (input.table) {
        case "areas":
          functionName = "save_area";
          args = common;
          break;
        case "case_categories":
          functionName = "save_category";
          args = common;
          break;
        case "services":
          functionName = "save_service";
          args = { ...common, p_area_ids: input.serviceAreaIds ?? [] };
          break;
        case "cases":
          functionName = "save_case";
          args = {
            ...common,
            p_service_ids: input.caseServiceIds ?? [],
            p_gallery_ids: input.caseGalleryIds ?? [],
          };
          break;
        case "ctas": {
          const row = input.id
            ? await run<{ id: string; updated_at: string }>(
                client
                  .from("ctas")
                  .update(input.values)
                  .eq("id", input.id)
                  .eq("updated_at", input.expectedUpdatedAt!)
                  .select("id, updated_at")
                  .single(),
                { table: "ctas", operation: "update" },
              )
            : await run<{ id: string; updated_at: string }>(
                client
                  .from("ctas")
                  .insert({ ...input.values, status: "draft" })
                  .select("id, updated_at")
                  .single(),
                { table: "ctas", operation: "insert" },
              );
          return saved(row!);
        }
      }

      const rows = await run<{ id: string; updated_at: string }[]>(client.rpc(functionName, args), {
        table: input.table,
        operation: "save",
      });
      if (!rows?.[0]) throw new AppError("INTERNAL_ERROR", { message: "O banco não devolveu a versão salva." });
      return saved(rows[0]);
    },

    async insertMedia(values: MediaRow): Promise<MediaAsset> {
      const row = await run<MediaAssetRow>(
        client.from("media_assets").insert(values).select(COLUMNS.media_assets).single(),
        { table: "media_assets", operation: "insert" },
      );
      return toMediaAsset(row!, supabaseUrl);
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
  };
}
