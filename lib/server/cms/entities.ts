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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Entidade de serviço e regras já cobertas (ADM-06).
 26/10/2026 Vinícius Nishimura Reis  Categorias, cases, galeria e envio de mídia (ADM-08).
 26/10/2026 Vinícius Nishimura Reis  Slug em branco gerado pelo servidor, sem preenchimento no navegador (TECH-12).
 27/10/2026 Vinícius Nishimura Reis  Correções da revisão de segurança (TECH-13).
 29/10/2026 Vinicius Binda             Serviço e case com endereço antigo redirecionando (DB-08).
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 02/11/2026 Vinícius Nishimura Reis  Relações entram na gravação em transação (TECH-13, #314).
 04/11/2026 Vinícius Nishimura Reis  Entidade de CTA, que não tem endereço próprio (ADM-11).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { z } from "zod";
import type { Resource } from "@/lib/domain/auth/rbac";
import { areaInputSchema, validateAreaForPublish, type AreaInput } from "@/lib/domain/content/area-schema";
import { caseInputSchema, type CaseInput } from "@/lib/domain/content/case-input-schema";
import { validateCaseForPublish } from "@/lib/domain/content/case-schema";
import { categoryInputSchema, type CategoryInput } from "@/lib/domain/content/category-schema";
import { ctaInputSchema, validateCtaForPublish, type CtaInput } from "@/lib/domain/content/cta-schema";
import { serviceInputSchema, validateServiceForPublish, type ServiceInput } from "@/lib/domain/content/service-schema";
import { pagePath } from "@/lib/domain/content/blocks";
import { pageInputSchema, type PageInput } from "@/lib/domain/content/page-schema";
import { isPubliclyVisible } from "@/lib/domain/content/visibility";
import type {
  Area,
  CaseCategory,
  CaseStudy,
  ContentEntityType,
  ContentSnapshot,
  Cta,
  MediaRef,
  Page,
  Publishable,
  Service,
} from "@/lib/domain/content/types";
import { ctaTargetColumns } from "../content/supabase/mappers";
import type { CmsSnapshot, EntityTable, ItemRelations, RedirectEntity, Row } from "./store";

/** Item editável: publicável. O endereço só existe nos tipos com página própria (CTA não tem). */
export type CmsItem = Publishable & { id: string; slug?: string };

/**
 * Tudo que a camada de serviço precisa saber sobre um tipo de conteúdo. Cada entidade nova
 * do painel (serviço, categoria, case) é uma definição destas — as regras de publicação,
 * integridade, auditoria e cache ficam num lugar só (content-service.ts).
 */
export interface EntityDefinition<I extends { slug?: string }, T extends CmsItem> {
  type: ContentEntityType;
  resource: Resource;
  table: EntityTable;
  /** Campo do formulário usado para gerar o slug quando ele vem em branco. Sem ele, o tipo não tem endereço. */
  slugSource?: "name" | "title";
  /**
   * Tipo com página própria (DB-08): depois de publicado o slug pode mudar, e o banco registra
   * o antigo em public.slug_redirects (301). Sem ele, o slug fica fixo após a primeira publicação.
   */
  redirectEntity?: RedirectEntity;
  /** Coleção correspondente no snapshot de conteúdo. */
  key: keyof CmsSnapshot;
  /** Para mensagens: "a área", "o serviço". */
  noun: { singular: string; article: "a" | "o" };
  /** Caminho do painel (lista) e da página pública do item. */
  adminPath: string;
  publicPath(item: T): string;
  inputSchema: z.ZodType<I, unknown>;
  list(snapshot: CmsSnapshot): T[];
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
  /**
   * Relações editadas no mesmo formulário (ex.: áreas do serviço, galeria do case): o banco as
   * grava na mesma transação do item. Sem elas, o item é uma linha só e já é atômico.
   */
  relations?(input: I): ItemRelations;
  /** Impede a exclusão definitiva quando o banco recusaria (FK restrict), com mensagem clara. */
  deleteBlockers?(item: T, snapshot: ContentSnapshot): string[];
  /**
   * Outras páginas de detalhe do site que exibem o item (ex.: o case aparece na página dos
   * serviços dele). São aquecidas junto depois de invalidar o cache (ADR-0006, TECH-13).
   */
  relatedPaths?(item: T, snapshot: ContentSnapshot, now: Date): string[];
}

/** Itens que o visitante vê agora: só eles têm página pública para aquecer. */
const live = <U extends Publishable>(items: U[], now: Date) => items.filter((entry) => isPubliclyVisible(entry, now));

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
  relatedPaths: (area, snapshot, now) =>
    live(snapshot.services, now)
      .filter((service) => service.areaIds.includes(area.id))
      .map((service) => `/servicos/${service.slug}`),
};

export const SERVICE: EntityDefinition<ServiceInput, Service> = {
  type: "service",
  resource: "service",
  table: "services",
  slugSource: "name",
  redirectEntity: "service",
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
  relations: (input) => ({ table: "services", areaIds: input.areaIds }),
  relatedPaths: (service, snapshot, now) =>
    live(snapshot.cases, now)
      .filter((item) => item.serviceIds.includes(service.id))
      .map((item) => `/cases/${item.slug}`),
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
  relatedPaths: (category, snapshot, now) =>
    live(snapshot.cases, now)
      .filter((item) => item.categoryId === category.id)
      .map((item) => `/cases/${item.slug}`),
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
  redirectEntity: "case",
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
  relations: (input) => ({ table: "cases", serviceIds: input.serviceIds, galleryIds: input.galleryIds }),
  // A página do serviço lista os cases dele; a do case mostra os relacionados da mesma categoria.
  relatedPaths: (item, snapshot, now) => [
    ...live(snapshot.services, now)
      .filter((service) => item.serviceIds.includes(service.id))
      .map((service) => `/servicos/${service.slug}`),
    ...live(snapshot.cases, now)
      .filter((other) => other.id !== item.id && other.categoryId === item.categoryId)
      .map((other) => `/cases/${other.slug}`),
  ],
};

/**
 * Página do CMS (ADM-05). O conteúdo mora nos blocos, gravados em page-blocks.ts; aqui ficam só
 * os dados da página. Publicada, ela aparece na rota do mesmo slug (PAGE_ROUTES); o slug fica
 * fixo depois da primeira publicação, como nas demais entidades sem redirecionamento.
 */
export const PAGE: EntityDefinition<PageInput, Page> = {
  type: "page",
  resource: "page",
  table: "pages",
  slugSource: "title",
  key: "pages",
  noun: { singular: "página", article: "a" },
  adminPath: "/admin/paginas",
  publicPath: (page) => pagePath(page.slug) ?? "/",
  inputSchema: pageInputSchema,
  list: (snapshot) => snapshot.pages,
  toValues: (input) => ({
    slug: input.slug,
    title: input.title,
    description: input.description ?? null,
    provisional: input.provisional,
  }),
  merge: (current, input, id) => ({
    ...(current ?? { ...draftControl, id, blocks: [] }),
    slug: input.slug,
    title: input.title,
    description: input.description,
    provisional: input.provisional,
  }),
  validateForPublish: (page) => (page.blocks.length ? [] : ["Inclua ao menos um bloco de conteúdo."]),
};

/**
 * Botão de chamada para ação (ADM-11). Não tem endereço próprio: `publicPath` é só a página em que
 * ele aparece. A alteração invalida a tag de CTAs, que as páginas leem por `listCtas`.
 */
export const CTA: EntityDefinition<CtaInput, Cta> = {
  type: "cta",
  resource: "cta",
  table: "ctas",
  key: "ctas",
  noun: { singular: "CTA", article: "o" },
  adminPath: "/admin/ctas",
  publicPath: (cta) =>
    cta.placement === "service-detail" ? "/servicos" : cta.placement === "case-detail" ? "/cases" : "/",
  inputSchema: ctaInputSchema,
  list: (snapshot) => snapshot.ctas,
  toValues: (input) => ({
    label: input.label,
    placement: input.placement,
    sort_order: input.order,
    ...ctaTargetColumns(input.target),
  }),
  merge: (current, input, id) => ({
    ...(current ?? { ...draftControl, id }),
    label: input.label,
    placement: input.placement,
    target: input.target,
    order: input.order,
  }),
  validateForPublish: (cta) => validateCtaForPublish(cta),
};
