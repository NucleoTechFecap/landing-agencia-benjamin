/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : versions.ts
 Descrição    : Histórico de versões: tipos, rótulos e comparação campo a campo entre duas versões.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Resource } from "@/lib/domain/auth/rbac";
import type { PublicationStatus } from "./publication-status";

export const VERSION_ENTITIES = ["area", "service", "category", "case", "cta", "page", "settings", "theme"] as const;
export type VersionEntity = (typeof VERSION_ENTITIES)[number];

export const isVersionEntity = (value: string): value is VersionEntity =>
  (VERSION_ENTITIES as readonly string[]).includes(value);

/** Configuração e aparência são uma linha só no banco: o id do histórico é fixo. */
export const SINGLE_ENTITY_ID = "site";

export const VERSION_ENTITY_LABELS: Readonly<Record<VersionEntity, string>> = {
  area: "Área",
  service: "Serviço",
  category: "Categoria",
  case: "Case",
  cta: "Chamada para ação",
  page: "Página",
  settings: "Configurações",
  theme: "Aparência",
};

const RESOURCES: Readonly<Record<VersionEntity, Resource>> = {
  area: "area",
  service: "service",
  category: "category",
  case: "case",
  cta: "cta",
  page: "page",
  settings: "settings",
  theme: "settings",
};

export const versionResource = (entity: VersionEntity): Resource => RESOURCES[entity];

const ITEM_PATHS: Readonly<Record<VersionEntity, (id: string) => string>> = {
  area: (id) => `/admin/areas/${id}`,
  service: (id) => `/admin/servicos/${id}`,
  category: (id) => `/admin/categorias/${id}`,
  case: (id) => `/admin/cases/${id}`,
  cta: (id) => `/admin/ctas/${id}`,
  page: (id) => `/admin/paginas/${id}`,
  settings: () => "/admin/configuracoes",
  theme: () => "/admin/aparencia",
};

/** Onde o item é editado no painel. */
export const versionItemPath = (entity: VersionEntity, id: string): string => ITEM_PATHS[entity](id);

export const historyPath = (entity: VersionEntity, id: string, version?: number): string =>
  `/admin/historico/${entity}/${id}${version ? `/${version}` : ""}`;

export const VERSION_ACTIONS = [
  "baseline",
  "created",
  "updated",
  "published",
  "unpublished",
  "archived",
  "unarchived",
  "deleted",
  "version_restored",
] as const;
export type VersionAction = (typeof VERSION_ACTIONS)[number];

export const VERSION_ACTION_LABELS: Readonly<Record<VersionAction, string>> = {
  baseline: "Como estava antes da primeira edição",
  created: "Criado",
  updated: "Editado",
  published: "Publicado",
  unpublished: "Despublicado",
  archived: "Arquivado",
  unarchived: "Restaurado do arquivo",
  deleted: "Excluído",
  version_restored: "Versão anterior restaurada",
};

/** Mudança de estado não tem conteúdo próprio: não há o que restaurar nessa linha. */
export const hasSnapshot = (action: VersionAction): boolean =>
  !["published", "unpublished", "archived", "unarchived", "deleted"].includes(action);

export interface ContentVersion {
  entity: VersionEntity;
  entityId: string;
  version: number;
  action: VersionAction;
  status: PublicationStatus | null;
  label: string | null;
  summary: string | null;
  snapshot: Record<string, unknown> | null;
  restoredFrom: number | null;
  authorId: string | null;
  /** Nome de quem alterou; `null` quando a conta foi removida. */
  authorName: string | null;
  createdAt: string;
}

/** Campos de controle não são conteúdo: não entram na versão nem na comparação. */
const CONTROL_FIELDS = new Set(["id", "status", "publishedAt", "archivedAt", "updatedAt"]);

/**
 * Item sem os campos de controle: é o que fica guardado na versão. O id de cada bloco muda a cada
 * restauração e não é conteúdo: guardá-lo faria toda comparação acusar diferença.
 */
export function toSnapshot(item: object): Record<string, unknown> {
  const content = Object.entries(item).filter(([key]) => !CONTROL_FIELDS.has(key));
  return Object.fromEntries(
    content.map(([key, value]) =>
      key === "blocks" && Array.isArray(value)
        ? [key, value.map(({ type, content: blockContent }) => ({ type, content: blockContent }))]
        : [key, value],
    ),
  );
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isEmpty = (value: unknown) => value === undefined || value === null || value === "";

/** Nome do item por trás de um id, para a comparação não mostrar código. */
export type NameLookup = (id: string) => string | undefined;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Imagem vira o endereço, e lista de texto, uma linha por item: é o que a pessoa reconhece na tela. */
function display(value: unknown, nameOf?: NameLookup): string {
  if (isEmpty(value)) return "";
  if (Array.isArray(value)) return value.map((item) => display(item, nameOf)).join("\n");
  if (isPlainObject(value)) {
    if (typeof value.src === "string") return String(value.alt || value.src);
    if (typeof value.label === "string" && typeof value.href === "string") return `${value.label} → ${value.href}`;
    return Object.values(value)
      .map((item) => display(item, nameOf))
      .filter(Boolean)
      .join(" · ");
  }
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "string" && UUID.test(value)) return nameOf?.(value) ?? "Item que não existe mais";
  return String(value);
}

/** Imagem, link e ícone são um valor só, como na tela. */
const isLeafObject = (value: Record<string, unknown>) =>
  typeof value.src === "string" ||
  (typeof value.label === "string" && "href" in value) ||
  (typeof value.name === "string" && "color" in value);

/** Achata em caminho → valor. Lista conta como um valor só: a comparação fica legível. */
function flatten(value: unknown, path: string, into: Map<string, unknown>) {
  if (!isPlainObject(value) || isLeafObject(value)) {
    if (!isEmpty(value) && !(Array.isArray(value) && value.length === 0)) into.set(path, value);
    return;
  }
  for (const [key, child] of Object.entries(value)) flatten(child, path ? `${path}.${key}` : key, into);
}

export interface VersionChange {
  path: string;
  before: string;
  after: string;
}

/** O que muda de uma versão para a outra, campo a campo. Só entra campo que mudou de verdade. */
export function diffSnapshots(before: object | null, after: object | null, nameOf?: NameLookup): VersionChange[] {
  const left = new Map<string, unknown>();
  const right = new Map<string, unknown>();
  flatten(before ?? {}, "", left);
  flatten(after ?? {}, "", right);
  const changes: VersionChange[] = [];
  for (const path of [...new Set([...left.keys(), ...right.keys()])]) {
    const [a, b] = [left.get(path), right.get(path)];
    if (JSON.stringify(a) === JSON.stringify(b)) continue;
    const [beforeText, afterText] = [display(a, nameOf), display(b, nameOf)];
    if (beforeText !== afterText) changes.push({ path, before: beforeText, after: afterText });
  }
  return changes;
}

const FIELD_LABELS: Readonly<Record<string, string>> = {
  title: "Título",
  name: "Nome",
  slug: "Endereço",
  description: "Descrição",
  summary: "Resumo",
  provisional: "Texto provisório",
  examples: "Exemplos",
  highlights: "Itens de atuação",
  icon: "Ícone",
  image: "Imagem",
  cover: "Capa",
  gallery: "Galeria",
  featured: "Destaque na Home",
  order: "Ordem",
  client: "Cliente",
  challenge: "Desafio",
  solution: "Solução",
  results: "Resultados",
  team: "Equipe",
  date: "Mês de referência",
  deliveryType: "Tipo de entrega",
  externalLinks: "Links externos",
  categoryId: "Categoria",
  serviceIds: "Serviços",
  areaIds: "Áreas",
  label: "Texto do botão",
  target: "Destino",
  placement: "Local",
  blocks: "Blocos da página",
  tagline: "Slogan",
  contact: "Contato",
  socials: "Redes sociais",
  "seo.title": "SEO: título",
  "seo.description": "SEO: descrição",
  "seo.keywords": "SEO: palavras-chave",
  "seo.noindex": "SEO: fora dos buscadores",
  "seo.ogTitle": "Compartilhamento: título",
  "seo.ogDescription": "Compartilhamento: descrição",
  "seo.ogImage": "Compartilhamento: imagem",
  "fields.hidden": "Seções escondidas",
  fontBody: "Fonte do texto",
  fontHeading: "Fonte dos títulos",
};

/** Nome do campo como a pessoa conhece; `lookup` resolve os campos de catálogo e aparência. */
export function changeLabel(path: string, lookup?: (path: string) => string | undefined): string {
  return lookup?.(path) ?? FIELD_LABELS[path] ?? path;
}
