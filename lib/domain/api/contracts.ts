/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : contracts.ts
 Descrição    : Contrato da API pública: envelopes, paginação, validação de query e DTOs.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-02).
 26/10/2026 Vinícius Nishimura Reis  DTOs de página e CTA (DB-03).
 26/10/2026 Vinícius Nishimura Reis  Detalhe de área com serviços (DB-04).
 26/10/2026 Vinícius Nishimura Reis  Veículo e data nos links de clipping (CASE-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { pagePath, type PageBlock } from "../content/blocks";
import { SLUG_PATTERN } from "../content/slug";
import type {
  Area,
  CaseCategory,
  CaseStudy,
  CtaPlacement,
  MediaRef,
  Page,
  Service,
  SiteSettings,
} from "../content/types";

/** Versão do contrato público. Mudança incompatível = nova versão (/api/v2) — TECH-11. */
export const API_VERSION = "v1";

export const PAGE_SIZE = { default: 12, max: 50 } as const;

const slugParam = z.string().regex(SLUG_PATTERN, "Slug inválido.").max(80);

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, "page deve ser ≥ 1.").default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGE_SIZE.max, `pageSize deve ser ≤ ${PAGE_SIZE.max}.`)
    .default(PAGE_SIZE.default),
});

export const caseQuerySchema = paginationSchema.extend({
  category: slugParam.optional(),
  service: slugParam.optional(),
  area: slugParam.optional(),
  client: z.string().trim().min(1).max(120).optional(),
});

export const serviceQuerySchema = z.object({
  featured: z.enum(["true", "false"]).optional(),
});

export const CTA_PLACEMENTS = [
  "home-hero",
  "home-highlight",
  "footer",
  "service-detail",
  "case-detail",
] as const satisfies readonly CtaPlacement[];

export const ctaQuerySchema = z.object({
  placement: z.enum(CTA_PLACEMENTS, { error: "placement desconhecido." }),
});

export type CaseQuery = z.infer<typeof caseQuerySchema>;

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Envelope de sucesso: sempre `data`, opcionalmente `meta`. */
export interface ApiSuccess<T> {
  data: T;
  meta?: PageMeta;
}

/** Envelope de erro (códigos em ADR-0004). */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
    fieldErrors?: Record<string, string[]>;
  };
}

export function paginate<T>(items: readonly T[], page: number, pageSize: number): ApiSuccess<T[]> {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), meta: { page, pageSize, total, totalPages } };
}

/** Converte `URLSearchParams` em objeto simples (último valor vence). */
export function searchParamsToObject(params: URLSearchParams): Record<string, string> {
  return Object.fromEntries(params.entries());
}

export function zodFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) (fieldErrors[String(issue.path[0] ?? "query")] ??= []).push(issue.message);
  return fieldErrors;
}

/* ─────────────── DTOs públicos (sem IDs internos, status ou campos de controle) ─────────────── */

export interface MediaDTO {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface AreaDTO {
  slug: string;
  name: string;
  summary: string;
  description: string;
  highlights: string[];
  icon?: string;
  url: string;
}

export interface AreaDetailDTO extends AreaDTO {
  services: { slug: string; name: string; summary: string; url: string }[];
}

export interface ServiceDTO {
  slug: string;
  name: string;
  summary: string;
  description: string;
  examples: string[];
  areas: string[];
  featured: boolean;
  icon?: string;
  image?: MediaDTO;
  url: string;
}

export interface CategoryDTO {
  slug: string;
  name: string;
  description: string;
}

export interface CaseCardDTO {
  slug: string;
  title: string;
  client: string;
  category: { slug: string; name: string } | null;
  deliveryType?: string;
  summary: string;
  cover?: MediaDTO;
  date?: string;
  featured: boolean;
  url: string;
}

export interface CaseDetailDTO extends CaseCardDTO {
  challenge?: string;
  solution?: string;
  results?: string;
  gallery: MediaDTO[];
  /** `source` (veículo) e `date` (AAAA-MM-DD) só nos links que os têm — clippings (CASE-10). */
  externalLinks: { label: string; url: string; source?: string; date?: string }[];
  team: string[];
  services: { slug: string; name: string; url: string }[];
  areas: { slug: string; name: string }[];
  publishedAt: string | null;
}

/** Bloco de página: o mesmo conteúdo validado pelo catálogo (lib/domain/content/blocks.ts). */
export type PageBlockDTO = Omit<PageBlock, "id" | "order">;

export interface PageDTO {
  slug: string;
  title: string;
  description?: string;
  /** Rota pública em que os blocos aparecem; `null` quando a página ainda não tem rota. */
  path: string | null;
  blocks: PageBlockDTO[];
}

export interface CtaDTO {
  label: string;
  href: string;
  external: boolean;
}

export interface SiteSettingsDTO {
  name: string;
  tagline: string;
  description: string;
  contact: SiteSettings["contact"];
  socials: SiteSettings["socials"];
}

const media = (ref?: MediaRef): MediaDTO | undefined =>
  ref ? { src: ref.src, alt: ref.alt, width: ref.width, height: ref.height } : undefined;

export function toAreaDTO(area: Area): AreaDTO {
  return {
    slug: area.slug,
    name: area.name,
    summary: area.summary,
    description: area.description,
    highlights: area.highlights,
    icon: area.icon,
    url: `/areas#${area.slug}`,
  };
}

export function toAreaDetailDTO(detail: { area: Area; services: Service[] }): AreaDetailDTO {
  return {
    ...toAreaDTO(detail.area),
    services: detail.services.map((service) => ({
      slug: service.slug,
      name: service.name,
      summary: service.summary,
      url: `/servicos/${service.slug}`,
    })),
  };
}

export function toServiceDTO(service: Service, areas: readonly Area[]): ServiceDTO {
  return {
    slug: service.slug,
    name: service.name,
    summary: service.summary,
    description: service.description,
    examples: service.examples,
    areas: areas.filter((area) => service.areaIds.includes(area.id)).map((area) => area.slug),
    featured: service.featured,
    icon: service.icon,
    image: media(service.image),
    url: `/servicos/${service.slug}`,
  };
}

export function toCategoryDTO(category: CaseCategory): CategoryDTO {
  return { slug: category.slug, name: category.name, description: category.description };
}

export function toCaseCardDTO(item: CaseStudy & { categoryName?: string; categorySlug?: string }): CaseCardDTO {
  return {
    slug: item.slug,
    title: item.title,
    client: item.client,
    category: item.categorySlug ? { slug: item.categorySlug, name: item.categoryName ?? "" } : null,
    deliveryType: item.deliveryType,
    summary: item.summary,
    cover: media(item.cover),
    date: item.date,
    featured: item.featured,
    url: `/cases/${item.slug}`,
  };
}

export function toCaseDetailDTO(detail: {
  item: CaseStudy;
  category: CaseCategory | null;
  services: Service[];
  areas: Area[];
}): CaseDetailDTO {
  const { item } = detail;
  return {
    ...toCaseCardDTO({ ...item, categoryName: detail.category?.name, categorySlug: detail.category?.slug }),
    challenge: item.challenge,
    solution: item.solution,
    results: item.results,
    gallery: item.gallery.map((ref) => media(ref)!),
    externalLinks: item.externalLinks,
    team: item.team,
    services: detail.services.map((service) => ({
      slug: service.slug,
      name: service.name,
      url: `/servicos/${service.slug}`,
    })),
    areas: detail.areas.map((area) => ({ slug: area.slug, name: area.name })),
    publishedAt: item.publishedAt,
  };
}

export function toPageDTO(page: Page): PageDTO {
  return {
    slug: page.slug,
    title: page.title,
    description: page.description,
    path: pagePath(page.slug),
    blocks: page.blocks.map(({ type, content }) => ({ type, content }) as PageBlockDTO),
  };
}

export function toCtaDTO(cta: { label: string; link: { href: string; external: boolean } }): CtaDTO {
  return { label: cta.label, href: cta.link.href, external: cta.link.external };
}

export function toSiteSettingsDTO(settings: SiteSettings): SiteSettingsDTO {
  return {
    name: settings.name,
    tagline: settings.tagline,
    description: settings.description,
    contact: settings.contact,
    socials: settings.socials,
  };
}
