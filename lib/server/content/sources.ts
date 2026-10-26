/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : sources.ts
 Descrição    : Fontes do conteúdo público (content/ provisório ou Supabase) e escolha da fonte ativa.

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
import { seedSnapshot, siteSettings } from "@/content";
import { isSupabaseConfigured } from "@/lib/config/public-env";
import { getServerEnv } from "@/lib/config/server-env";
import type { ContentSnapshot, Page, SiteSettings } from "@/lib/domain/content/types";
import { createPublicClient } from "../supabase/server";
import { fetchCtas, fetchPage, fetchSiteSettings } from "./supabase/queries";

export type ContentSourceName = "local" | "supabase";

/** Operações de leitura que toda fonte de conteúdo oferece ao repositório público. */
export interface ContentSource {
  name: ContentSourceName;
  snapshot(): Promise<ContentSnapshot>;
  settings(): Promise<SiteSettings>;
  page(slug: string): Promise<Page | null>;
}

/** Conteúdo provisório versionado em content/ (desenvolvimento, testes e fallback). */
export const localSource: ContentSource = {
  name: "local",
  snapshot: async () => seedSnapshot,
  settings: async () => siteSettings,
  // Páginas só existem no CMS: sem banco, as rotas exibem apenas as seções fixas.
  page: async () => null,
};

/**
 * Tabelas do CMS lidas com a chave anônima. Nesta etapa (DB-03) o snapshot traz os CTAs;
 * áreas e serviços entram no DB-04 e categorias e cases no DB-05.
 */
export const supabaseSource: ContentSource = {
  name: "supabase",
  async snapshot() {
    const ctas = await fetchCtas(createPublicClient());
    return { areas: [], services: [], categories: [], cases: [], ctas };
  },
  settings: () => fetchSiteSettings(createPublicClient(), siteSettings),
  page: (slug) => fetchPage(createPublicClient(), slug),
};

/**
 * Decide a fonte. Sem CONTENT_SOURCE vale "local". Pedir "supabase" sem o projeto
 * configurado é erro de configuração: o site não pode cair em silêncio no conteúdo
 * provisório achando que lê o CMS.
 */
export function resolveContentSource(
  requested: ContentSourceName | undefined,
  supabaseConfigured: boolean,
): ContentSourceName {
  const source = requested ?? "local";
  if (source === "supabase" && !supabaseConfigured) {
    throw new Error("CONTENT_SOURCE=supabase exige NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return source;
}

export function getContentSource(): ContentSource {
  const name = resolveContentSource(getServerEnv().CONTENT_SOURCE, isSupabaseConfigured);
  return name === "supabase" ? supabaseSource : localSource;
}
