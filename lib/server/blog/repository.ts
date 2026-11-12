/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : repository.ts
 Descrição    : Leitura pública e administrativa de artigos.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Repositório do blog (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { getContentSource } from "@/lib/server/content/sources";
import { createPublicClient, createSessionClient } from "@/lib/server/supabase/server";
import { AppError } from "@/lib/server/errors";
import { CONTENT_TAGS } from "@/lib/server/content/cache-tags";
import { publicEnv } from "@/lib/config/public-env";
import { toMediaRef } from "@/lib/server/content/supabase/mappers";
import type { MediaAssetRow } from "@/lib/server/content/supabase/rows";
import type { BlogArticle } from "@/lib/domain/blog/article";
import type { SupabaseClient } from "@supabase/supabase-js";

const COLUMNS =
  "id,slug,title,summary,author,topic,cover_media_id,paragraphs,status,published_at,archived_at,updated_at,cover:media_assets(id,path,mime_type,width,height,alt_text,decorative)";

function mapArticle(raw: unknown): BlogArticle {
  const { cover, ...article } = raw as BlogArticle & { cover: MediaAssetRow | null };
  return { ...article, ...(cover ? { cover: toMediaRef(cover, publicEnv.NEXT_PUBLIC_SUPABASE_URL!) } : {}) };
}

async function fetchArticles(client: SupabaseClient, publicOnly: boolean): Promise<BlogArticle[]> {
  const articles: BlogArticle[] = [];
  const batchSize = 500;
  const now = new Date().toISOString();
  for (let offset = 0; ; offset += batchSize) {
    let query = client.from("blog_articles").select(COLUMNS);
    if (publicOnly) query = query.eq("status", "published").lte("published_at", now);
    const { data, error } = await query
      .order(publicOnly ? "published_at" : "updated_at", { ascending: false })
      .order("id")
      .range(offset, offset + batchSize - 1);
    if (error) throw new AppError("SERVICE_UNAVAILABLE");
    articles.push(...(data ?? []).map(mapArticle));
    if (!data || data.length < batchSize) return articles;
  }
}

export async function listArticles(): Promise<BlogArticle[]> {
  "use cache";
  cacheTag(CONTENT_TAGS.blog);
  cacheLife("hours");
  if (getContentSource().name === "local") return [];
  return fetchArticles(createPublicClient(), true);
}

export async function getArticle(slug: string): Promise<BlogArticle | null> {
  return (await listArticles()).find((article) => article.slug === slug) ?? null;
}

/** Somente chamar depois da guarda de permissão do painel. */
export async function listAdminArticles(): Promise<BlogArticle[]> {
  return fetchArticles(await createSessionClient(), false);
}
