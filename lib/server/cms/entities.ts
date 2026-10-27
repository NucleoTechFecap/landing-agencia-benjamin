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
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { z } from "zod";
import type { Resource } from "@/lib/domain/auth/rbac";
import { areaInputSchema, validateAreaForPublish, type AreaInput } from "@/lib/domain/content/area-schema";
import { serviceInputSchema, validateServiceForPublish, type ServiceInput } from "@/lib/domain/content/service-schema";
import type {
  Area,
  ContentEntityType,
  ContentSnapshot,
  MediaRef,
  Publishable,
  Service,
} from "@/lib/domain/content/types";
import type { EntityTable, LinkTable, Row } from "./store";

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
}

const draftControl = { status: "draft" as const, publishedAt: null, archivedAt: null, updatedAt: "" };

/** Ids da biblioteca de mídia → referência, para o merge resolver imagens escolhidas no form. */
export type MediaLookup = ReadonlyMap<string, MediaRef>;

export const AREA: EntityDefinition<AreaInput, Area> = {
  type: "area",
  resource: "area",
  table: "areas",
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
