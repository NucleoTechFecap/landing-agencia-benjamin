/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : entities.ts
 Descrição    : Definição de cada tipo de conteúdo editável no painel (tabela, permissões, validação e mapeamento).

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
 26/10/2026 Vinícius Nishimura Reis  Entidade de serviço e regras já cobertas (ADM-06).
 26/10/2026 Vinícius Nishimura Reis  Categorias, cases, galeria e envio de mídia (ADM-08).
 26/10/2026 Vinícius Nishimura Reis  Slug em branco gerado pelo servidor, sem preenchimento no navegador (TECH-12).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { z } from "zod";
import type { Resource } from "@/lib/domain/auth/rbac";
import { areaInputSchema, validateAreaForPublish, type AreaInput } from "@/lib/domain/content/area-schema";
import { caseInputSchema, type CaseInput } from "@/lib/domain/content/case-input-schema";
import { validateCaseForPublish } from "@/lib/domain/content/case-schema";
import { categoryInputSchema, type CategoryInput } from "@/lib/domain/content/category-schema";
import { serviceInputSchema, validateServiceForPublish, type ServiceInput } from "@/lib/domain/content/service-schema";
import type {
  Area,
  CaseCategory,
  CaseStudy,
  ContentEntityType,
  ContentSnapshot,
  MediaRef,
  Publishable,
  Service,
} from "@/lib/domain/content/types";
import type { CmsStore, EntityTable, LinkTable, Row } from "./store";

/** Item editável: publicável e com endereço próprio. */
export type CmsItem = Publishable & { id: string; slug: string };

/**
 * Tudo que a camada de serviço precisa saber sobre um tipo de conteúdo. Cada entidade nova
 * do painel (serviço, categoria, case) é uma definição destas — as regras de publicação,
 * integridade, auditoria e cache ficam num lugar só (content-service.ts).
 */
export interface EntityDefinition<I extends { slug: string }, T extends CmsItem> {
  type: ContentEntityType;
  resource: Resource;
  table: EntityTable;
  /** Campo do formulário usado para gerar o slug quando ele vem em branco. */
  slugSource: "name" | "title";
  /** Coleção correspondente no snapshot de conteúdo. */
  key: Exclude<keyof ContentSnapshot, "ctas">;
  /** Para mensagens: "a área", "o serviço". */
  noun: { singular: string; article: "a" | "o" };
  /** Caminho do painel (lista) e da página pública do item. */
  adminPath: string;
  publicPath(item: T): string;
  inputSchema: z.ZodType<I, unknown>;
  list(snapshot: ContentSnapshot): T[];
  /** Colunas do banco a partir do formulário validado (sem campos de controle). */
  toValues(input: I): Row;
  /**
   * Item como ficaria depois do save — usado para validar publicação e integridade.
   * `media` resolve ids da biblioteca (ex.: imagem do serviço) para a validação de `alt` (R12).
   */
  merge(current: T | undefined, input: I, id: string, media: ReadonlyMap<string, MediaRef>): T;
  /** Campos obrigatórios para publicar (TECH-05 §5). */
  validateForPublish(item: T): string[];
  /** Regras de integridade já cobertas pela validação acima (não repetir a mensagem). */
  coveredRules?: readonly string[];
  /** Vínculos N:M editados no mesmo formulário (ex.: áreas do serviço). */
  links?: {
    table: LinkTable;
    ownerColumn: string;
    otherColumn: string;
    of(item: T): string[];
    from(input: I): string[];
  };
  /** Impede a exclusão definitiva quando o banco recusaria (FK restrict), com mensagem clara. */
  deleteBlockers?(item: T, snapshot: ContentSnapshot): string[];
  /** Relações gravadas depois do item (ex.: galeria ordenada do case). */
  afterSave?(store: CmsStore, id: string, input: I): Promise<void>;
}

const draftControl = { status: "draft" as const, publishedAt: null, archivedAt: null, updatedAt: "" };

/** Ids da biblioteca de mídia → referência, para o merge resolver imagens escolhidas no form. */
export type MediaLookup = ReadonlyMap<string, MediaRef>;

export const AREA: EntityDefinition<AreaInput, Area> = {
  type: "area",
  resource: "area",
  table: "areas",
  slugSource: "name",
  key: "areas",
  noun: { singular: "área", article: "a" },
  adminPath: "/admin/areas",
  publicPath: (area) => `/areas#${area.slug}`,
  inputSchema: areaInputSchema,
  list: (snapshot) => snapshot.areas,
  toValues: (input) => ({
    slug: input.slug,
    name: input.name,
    summary: input.summary ?? null,
    description: input.description ?? null,
    highlights: input.highlights,
    icon: input.icon ?? null,
    sort_order: input.order,
  }),
  merge: (current, input, id) => ({
    ...(current ?? { ...draftControl, id }),
    slug: input.slug,
    name: input.name,
    summary: input.summary ?? "",
    description: input.description ?? "",
    highlights: input.highlights,
    icon: input.icon,
    order: input.order,
  }),
  validateForPublish: (area) => validateAreaForPublish(area),
};

export const SERVICE: EntityDefinition<ServiceInput, Service> = {
  type: "service",
  resource: "service",
  table: "services",
  slugSource: "name",
  key: "services",
  noun: { singular: "serviço", article: "o" },
  adminPath: "/admin/servicos",
  publicPath: (service) => `/servicos/${service.slug}`,
  inputSchema: serviceInputSchema,
  list: (snapshot) => snapshot.services,
  toValues: (input) => ({
    slug: input.slug,
    name: input.name,
    summary: input.summary ?? null,
    description: input.description ?? null,
    examples: input.examples,
    icon: input.icon ?? null,
    image_media_id: input.imageId ?? null,
    featured: input.featured,
    sort_order: input.order,
  }),
  merge: (current, input, id, media) => ({
    ...(current ?? { ...draftControl, id }),
    slug: input.slug,
    name: input.name,
    summary: input.summary ?? "",
    description: input.description ?? "",
    examples: input.examples,
    areaIds: input.areaIds,
    icon: input.icon,
    image: input.imageId ? media.get(input.imageId) : undefined,
    featured: input.featured,
    order: input.order,
  }),
  validateForPublish: (service) => validateServiceForPublish({ ...service, imageId: service.image?.id }),
  coveredRules: ["R03"],
  links: {
    table: "service_areas",
    ownerColumn: "service_id",
    otherColumn: "area_id",
    of: (service) => service.areaIds,
    from: (input) => input.areaIds,
  },
};

export const CATEGORY: EntityDefinition<CategoryInput, CaseCategory> = {
  type: "category",
  resource: "category",
  table: "case_categories",
  slugSource: "name",
  key: "categories",
  noun: { singular: "categoria", article: "a" },
  adminPath: "/admin/categorias",
  publicPath: (category) => `/cases?categoria=${category.slug}`,
  inputSchema: categoryInputSchema,
  list: (snapshot) => snapshot.categories,
  toValues: (input) => ({
    slug: input.slug,
    name: input.name,
    description: input.description ?? null,
    sort_order: input.order,
  }),
  merge: (current, input, id) => ({
    ...(current ?? { ...draftControl, id }),
    slug: input.slug,
    name: input.name,
    description: input.description ?? "",
    order: input.order,
  }),
  // Nome e slug já são exigidos pelo próprio formulário (TECH-05 §5).
  validateForPublish: () => [],
  deleteBlockers: (category, snapshot) => {
    const using = snapshot.cases.filter((item) => item.categoryId === category.id);
    return using.length
      ? [
          `${using.length} case(s) usam esta categoria (inclusive rascunhos e arquivados): ${using.map((item) => item.title).join(", ")}.`,
        ]
      : [];
  },
};

const CASE_FIELD_LABELS: Record<string, string> = {
  client: "Cliente",
  categoryId: "Categoria",
  serviceIds: "Serviços",
  summary: "Resumo",
  cover: "Capa",
  "cover.alt": "Capa",
  gallery: "Galeria",
  date: "Mês de referência",
};

/** Mensagens do CASE-11 ("campo: problema") com o nome do campo como aparece no painel. */
function labeled(problems: string[]): string[] {
  return problems.map((problem) => {
    const [field, ...rest] = problem.split(": ");
    const label = CASE_FIELD_LABELS[field] ?? (field.startsWith("gallery") ? "Galeria" : undefined);
    return label && rest.length ? `${label}: ${rest.join(": ")}` : problem;
  });
}

export const CASE: EntityDefinition<CaseInput, CaseStudy> = {
  type: "case",
  resource: "case",
  table: "cases",
  slugSource: "title",
  key: "cases",
  noun: { singular: "case", article: "o" },
  adminPath: "/admin/cases",
  publicPath: (item) => `/cases/${item.slug}`,
  inputSchema: caseInputSchema,
  list: (snapshot) => snapshot.cases,
  toValues: (input) => ({
    slug: input.slug,
    title: input.title,
    client_name: input.client ?? null,
    category_id: input.categoryId ?? null,
    delivery_type: input.deliveryType ?? null,
    summary: input.summary ?? null,
    challenge: input.challenge ?? null,
    solution: input.solution ?? null,
    results: input.results ?? null,
    cover_media_id: input.coverId ?? null,
    external_links: input.externalLinks,
    reference_month: input.date ? `${input.date}-01` : null,
    team: input.team,
    featured: input.featured,
    sort_order: input.order,
  }),
  merge: (current, input, id, media) => ({
    ...(current ?? { ...draftControl, id }),
    slug: input.slug,
    title: input.title,
    client: input.client ?? "",
    categoryId: input.categoryId ?? "",
    serviceIds: input.serviceIds,
    deliveryType: input.deliveryType,
    summary: input.summary ?? "",
    challenge: input.challenge,
    solution: input.solution,
    results: input.results,
    cover: input.coverId ? media.get(input.coverId) : undefined,
    gallery: input.galleryIds.map((mediaId) => media.get(mediaId)).filter((item): item is MediaRef => Boolean(item)),
    externalLinks: input.externalLinks,
    date: input.date,
    team: input.team,
    featured: input.featured,
    order: input.order,
  }),
  validateForPublish: (item) =>
    labeled(
      validateCaseForPublish({
        ...item,
        client: item.client || undefined,
        categoryId: item.categoryId || undefined,
        summary: item.summary || undefined,
      }),
    ),
  links: {
    table: "case_services",
    ownerColumn: "case_id",
    otherColumn: "service_id",
    of: (item) => item.serviceIds,
    from: (input) => input.serviceIds,
  },
  afterSave: (store, id, input) => store.syncGallery(id, input.galleryIds),
};
