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
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Cta, Page, SiteSettings } from "@/lib/domain/content/types";
import { AppError } from "../../errors";
import { logger } from "../../logger";
import { toCta, toPage, toSiteSettings } from "./mappers";
import { COLUMNS, type BlockRow, type CmsTable, type CtaRow, type PageRow, type SiteSettingsRow } from "./rows";

/*
 * Sempre com o cliente anônimo (createPublicClient): a RLS só devolve itens publicados com
 * data já alcançada. O filtro `status = published` repetido aqui é a segunda barreira — se
 * um dia alguém passar um cliente com sessão do painel, rascunhos continuam fora do site.
 */

type QueryResult = PromiseLike<{ data: unknown; error: { message: string; code?: string } | null }>;

async function rows<T>(table: CmsTable, query: QueryResult): Promise<T[]> {
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
