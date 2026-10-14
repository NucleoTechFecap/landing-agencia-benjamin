/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : repository.ts
 Descrição    : Repositório de leitura pública do conteúdo (somente publicado) com cache por tags.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { seedSnapshot, siteSettings } from "@/content";
import { resolveCtaHref, type ResolvedLink } from "@/lib/domain/content/integrity";
import type {
  Area,
  CaseCategory,
  CaseStudy,
  ContentSnapshot,
  CtaPlacement,
  Service,
  SiteSettings,
} from "@/lib/domain/content/types";
import { isPubliclyVisible, visibleSorted } from "@/lib/domain/content/visibility";
import { CONTENT_TAGS } from "./cache-tags";

/*
 * Repositório de LEITURA PÚBLICA do conteúdo (ADR-0003). Regra de ouro: nada aqui
 * retorna item que não esteja publicado (RN-01 / TECH-04 I1).
 *
 * Fonte atual: conteúdo provisório versionado em content/. Quando as tabelas do CMS
 * estiverem publicadas (DB-03/DB-04/DB-05), somente `loadSnapshot()` muda para ler
 * do Supabase com a chave anônima (RLS só expõe `published`).
 */
async function loadSnapshot(): Promise<ContentSnapshot> {
  return seedSnapshot;
}

export interface CaseCard extends CaseStudy {
  categoryName: string;
  categorySlug: string;
}

export interface CaseDetail {
  item: CaseStudy;
  category: CaseCategory | null;
  services: Service[];
  areas: Area[];
}

export interface ServiceDetail {
  service: Service;
  areas: Area[];
  cases: CaseCard[];
}

export interface CtaLink {
  id: string;
  label: string;
  link: ResolvedLink;
}

export interface CaseFilters {
  category?: string;
  service?: string;
  area?: string;
  client?: string;
}

function toCaseCards(snapshot: ContentSnapshot, items: CaseStudy[], now: Date): CaseCard[] {
  return items.map((item) => {
    const category = snapshot.categories.find((entry) => entry.id === item.categoryId && isPubliclyVisible(entry, now));
    return { ...item, categoryName: category?.name ?? "", categorySlug: category?.slug ?? "" };
  });
}

export async function getSiteSettings(): Promise<SiteSettings> {
  "use cache";
  cacheTag(CONTENT_TAGS.all, CONTENT_TAGS.settings);
  cacheLife("hours");
  return siteSettings;
}

export async function listAreas(): Promise<Area[]> {
  "use cache";
  cacheTag(CONTENT_TAGS.all, CONTENT_TAGS.areas);
  cacheLife("hours");
  const snapshot = await loadSnapshot();
  return visibleSorted(snapshot.areas, (area) => area.name);
}

export async function listServices(options: { featuredOnly?: boolean } = {}): Promise<Service[]> {
  "use cache";
  cacheTag(CONTENT_TAGS.all, CONTENT_TAGS.services);
  cacheLife("hours");
  const snapshot = await loadSnapshot();
  const services = visibleSorted(snapshot.services, (service) => service.name);
  return options.featuredOnly ? services.filter((service) => service.featured) : services;
}

export async function getServiceDetail(slug: string): Promise<ServiceDetail | null> {
  "use cache";
  cacheTag(CONTENT_TAGS.all, CONTENT_TAGS.services, CONTENT_TAGS.service(slug), CONTENT_TAGS.cases);
  cacheLife("hours");
  const snapshot = await loadSnapshot();
  const now = new Date();
  const service = snapshot.services.find((item) => item.slug === slug && isPubliclyVisible(item, now));
  if (!service) return null;
  const areas = visibleSorted(
    snapshot.areas.filter((area) => service.areaIds.includes(area.id)),
    (area) => area.name,
    now,
  );
  const relatedCases = visibleSorted(
    snapshot.cases.filter((item) => item.serviceIds.includes(service.id)),
    (item) => item.title,
    now,
  );
  return { service, areas, cases: toCaseCards(snapshot, relatedCases, now) };
}

export async function listCategories(): Promise<CaseCategory[]> {
  "use cache";
  cacheTag(CONTENT_TAGS.all, CONTENT_TAGS.categories);
  cacheLife("hours");
  const snapshot = await loadSnapshot();
  return visibleSorted(snapshot.categories, (category) => category.name);
}

/** Lista cases publicados aplicando filtros por slug (categoria, serviço, área) e cliente. */
export async function listCases(filters: CaseFilters = {}): Promise<CaseCard[]> {
  "use cache";
  cacheTag(CONTENT_TAGS.all, CONTENT_TAGS.cases, CONTENT_TAGS.categories, CONTENT_TAGS.services);
  cacheLife("hours");
  const snapshot = await loadSnapshot();
  const now = new Date();
  const serviceBySlug = new Map(snapshot.services.map((service) => [service.slug, service]));
  const areaBySlug = new Map(snapshot.areas.map((area) => [area.slug, area]));
  const categoryBySlug = new Map(snapshot.categories.map((category) => [category.slug, category]));

  const filtered = snapshot.cases.filter((item) => {
    if (filters.category && categoryBySlug.get(filters.category)?.id !== item.categoryId) return false;
    if (filters.service) {
      const service = serviceBySlug.get(filters.service);
      if (!service || !item.serviceIds.includes(service.id)) return false;
    }
    if (filters.area) {
      const area = areaBySlug.get(filters.area);
      const caseAreaIds = snapshot.services
        .filter((service) => item.serviceIds.includes(service.id))
        .flatMap((service) => service.areaIds);
      if (!area || !caseAreaIds.includes(area.id)) return false;
    }
    if (filters.client && item.client.toLocaleLowerCase("pt-BR") !== filters.client.toLocaleLowerCase("pt-BR")) {
      return false;
    }
    return true;
  });
  return toCaseCards(snapshot, visibleSorted(filtered, (item) => item.title, now), now);
}

export async function listFeaturedCases(limit = 6): Promise<CaseCard[]> {
  const cases = await listCases();
  return cases.filter((item) => item.featured).slice(0, limit);
}

export async function getCaseDetail(slug: string): Promise<CaseDetail | null> {
  "use cache";
  cacheTag(CONTENT_TAGS.all, CONTENT_TAGS.cases, CONTENT_TAGS.case(slug), CONTENT_TAGS.services);
  cacheLife("hours");
  const snapshot = await loadSnapshot();
  const now = new Date();
  const item = snapshot.cases.find((entry) => entry.slug === slug && isPubliclyVisible(entry, now));
  if (!item) return null;
  const services = visibleSorted(
    snapshot.services.filter((service) => item.serviceIds.includes(service.id)),
    (service) => service.name,
    now,
  );
  const areaIds = new Set(services.flatMap((service) => service.areaIds));
  return {
    item,
    category: snapshot.categories.find((category) => category.id === item.categoryId && isPubliclyVisible(category, now)) ?? null,
    services,
    areas: visibleSorted(
      snapshot.areas.filter((area) => areaIds.has(area.id)),
      (area) => area.name,
      now,
    ),
  };
}

/** CTAs publicados de um local da página, já com o link resolvido (fallback incluído). */
export async function listCtas(placement: CtaPlacement): Promise<CtaLink[]> {
  "use cache";
  cacheTag(CONTENT_TAGS.all, CONTENT_TAGS.ctas, CONTENT_TAGS.services, CONTENT_TAGS.cases, CONTENT_TAGS.areas);
  cacheLife("hours");
  const snapshot = await loadSnapshot();
  const now = new Date();
  return visibleSorted(
    snapshot.ctas.filter((cta) => cta.placement === placement),
    (cta) => cta.label,
    now,
  ).map((cta) => ({ id: cta.id, label: cta.label, link: resolveCtaHref(cta.target, snapshot, now) }));
}

/** Slugs publicados para `generateStaticParams` e sitemap. */
export async function listPublishedSlugs(): Promise<{ services: string[]; cases: string[] }> {
  const [services, cases] = await Promise.all([listServices(), listCases()]);
  return { services: services.map((service) => service.slug), cases: cases.map((item) => item.slug) };
}
