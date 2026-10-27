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
 26/10/2026 Vinícius Nishimura Reis  Áreas e serviços do Supabase e checagem de slug do proxy (DB-04).
 26/10/2026 Vinícius Nishimura Reis  Categorias, cases, vínculos e galeria do CMS (DB-05).
 26/10/2026 Vinícius Nishimura Reis  CMS como fonte padrão com Supabase; provisório recusado em hml/prd (INT-02).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { seedSnapshot, siteSettings } from "@/content";
import { isSupabaseConfigured, publicEnv, siteEnvironment, type SiteEnvironment } from "@/lib/config/public-env";
import { getServerEnv } from "@/lib/config/server-env";
import type { ContentSnapshot, Page, SiteSettings } from "@/lib/domain/content/types";
import { isPubliclyVisible } from "@/lib/domain/content/visibility";
import { createPublicClient } from "../supabase/server";
import {
  fetchAreasAndServices,
  fetchCasesAndCategories,
  fetchCtas,
  fetchPage,
  fetchSiteSettings,
  isSlugPublished,
} from "./supabase/queries";

export type ContentSourceName = "local" | "supabase";

/** Rotas de detalhe protegidas pelo proxy com 404 real. */
export type DetailRoute = "servicos" | "cases";

/** Operações de leitura que toda fonte de conteúdo oferece ao repositório público. */
export interface ContentSource {
  name: ContentSourceName;
  snapshot(): Promise<ContentSnapshot>;
  settings(): Promise<SiteSettings>;
  page(slug: string): Promise<Page | null>;
  /** Existe item publicado com este slug? (proxy — 404 real antes do streaming). */
  slugExists(route: DetailRoute, slug: string, now?: Date): Promise<boolean>;
}

/** Conteúdo provisório versionado em content/ (desenvolvimento, testes e fallback). */
export const localSource: ContentSource = {
  name: "local",
  snapshot: async () => seedSnapshot,
  settings: async () => siteSettings,
  // Páginas só existem no CMS: sem banco, as rotas exibem apenas as seções fixas.
  page: async () => null,
  async slugExists(route, slug, now = new Date()) {
    const items = route === "servicos" ? seedSnapshot.services : seedSnapshot.cases;
    return items.some((item) => item.slug === slug && isPubliclyVisible(item, now));
  },
};

/**
 * Tabelas do CMS lidas com a chave anônima: CTAs (DB-03), áreas e serviços (DB-04),
 * categorias e cases com galeria (DB-05). As consultas rodam em paralelo.
 */
export const supabaseSource: ContentSource = {
  name: "supabase",
  async snapshot() {
    const client = createPublicClient();
    const supabaseUrl = publicEnv.NEXT_PUBLIC_SUPABASE_URL!;
    const [{ areas, services }, { categories, cases }, ctas] = await Promise.all([
      fetchAreasAndServices(client, supabaseUrl),
      fetchCasesAndCategories(client, supabaseUrl),
      fetchCtas(client),
    ]);
    return { areas, services, categories, cases, ctas };
  },
  settings: () => fetchSiteSettings(createPublicClient(), siteSettings),
  page: (slug) => fetchPage(createPublicClient(), slug),
  slugExists: (route, slug) => isSlugPublished(createPublicClient(), route === "servicos" ? "services" : "cases", slug),
};

/**
 * Decide a fonte (INT-02): com o Supabase configurado o site mostra o que foi publicado no
 * CMS; sem ele, o conteúdo provisório de content/. CONTENT_SOURCE força uma das duas em
 * desenvolvimento. Pedir "supabase" sem o projeto configurado é erro, e em homologação e
 * produção o conteúdo só pode vir do CMS: o site nunca cai em silêncio no provisório.
 */
export function resolveContentSource(
  requested: ContentSourceName | undefined,
  supabaseConfigured: boolean,
  environment: SiteEnvironment = "development",
): ContentSourceName {
  const source = requested ?? (supabaseConfigured ? "supabase" : "local");
  if (source === "supabase" && !supabaseConfigured) {
    throw new Error("CONTENT_SOURCE=supabase exige NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  if (source === "local" && (environment === "production" || environment === "homologation")) {
    throw new Error(
      `Em ${environment} o conteúdo público vem do CMS: configure o Supabase e não use CONTENT_SOURCE=local.`,
    );
  }
  return source;
}

export function getContentSource(): ContentSource {
  const name = resolveContentSource(getServerEnv().CONTENT_SOURCE, isSupabaseConfigured, siteEnvironment);
  return name === "supabase" ? supabaseSource : localSource;
}
