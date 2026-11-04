/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : index.ts
 Descrição    : Catálogo de campos editáveis por página e leitura dos valores que o site mostra.

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
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import { fieldDefault, fieldSchema, sameFieldValue, type FieldDef } from "../fields";
import type { Page, SiteSettings } from "../types";
import type { CatalogPage, CatalogSection, ResolvedPage } from "./define";
import { AREAS } from "./areas";
import { CASES } from "./cases";
import { CONTATO } from "./contato";
import { FEEDBACK } from "./feedback";
import { FORMULARIOS } from "./formularios";
import { GERAL } from "./geral";
import { HOME } from "./home";
import { MODELO_CASE } from "./modelo-case";
import { MODELO_SERVICO } from "./modelo-servico";
import { PRIVACIDADE } from "./privacidade";
import { SERVICOS } from "./servicos";
import { SOBRE } from "./sobre";

export type { CatalogPage, CatalogSection, ResolvedPage } from "./define";

/**
 * Tudo o que tem lugar fixo no site, por página. O texto de hoje é o valor padrão: sem nada gravado,
 * o site continua exatamente igual, e cada campo editado grava só a diferença.
 */
export const PAGE_CATALOG = {
  home: HOME,
  sobre: SOBRE,
  areas: AREAS,
  servicos: SERVICOS,
  cases: CASES,
  contato: CONTATO,
  feedback: FEEDBACK,
  privacidade: PRIVACIDADE,
  "modelo-servico": MODELO_SERVICO,
  "modelo-case": MODELO_CASE,
  "site-geral": GERAL,
  "site-formularios": FORMULARIOS,
} as const satisfies Record<string, CatalogPage>;

export type CatalogSlug = keyof typeof PAGE_CATALOG;

export const CATALOG_SLUGS = Object.keys(PAGE_CATALOG) as CatalogSlug[];

export const isCatalogSlug = (slug: string): slug is CatalogSlug => Object.hasOwn(PAGE_CATALOG, slug);

/** O que uma página guarda: só os campos que divergem do padrão e as seções escondidas. */
export interface PageFieldsData {
  values: Record<string, unknown>;
  hidden: string[];
}

export const EMPTY_PAGE_FIELDS: PageFieldsData = { values: {}, hidden: [] };

const catalogOf = (slug: string): CatalogPage | undefined =>
  isCatalogSlug(slug) ? (PAGE_CATALOG[slug] as CatalogPage) : undefined;

/** `secao.campo` → definição do campo. */
function fieldAt(page: CatalogPage, key: string): { section: CatalogSection; field: FieldDef } | undefined {
  const [sectionId, fieldId] = key.split(".");
  const section = page.sections[sectionId];
  const field = section?.fields[fieldId];
  return section && field ? { section, field } : undefined;
}

/**
 * Valor gravado no banco. Campo desconhecido ou inválido (o catálogo mudou, ou a linha foi editada à
 * mão) sai e volta em `problems`: a página segue com o padrão daquele campo, sem cair.
 */
export function parsePageFields(slug: string, raw: unknown): { fields: PageFieldsData; problems: string[] } {
  const page = catalogOf(slug);
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as { values?: unknown; hidden?: unknown };
  if (!page) return { fields: EMPTY_PAGE_FIELDS, problems: [] };
  const problems: string[] = [];
  const values: Record<string, unknown> = {};
  const stored = typeof source.values === "object" && source.values !== null ? source.values : {};
  for (const [key, value] of Object.entries(stored)) {
    const found = fieldAt(page, key);
    if (!found) {
      problems.push(`${key}: campo desconhecido`);
      continue;
    }
    const parsed = fieldSchema(found.field).safeParse(value);
    if (parsed.success) values[key] = parsed.data;
    else problems.push(`${key}: ${parsed.error.issues.map((issue) => issue.message).join(", ")}`);
  }
  const hidden = Array.isArray(source.hidden)
    ? source.hidden.filter((id): id is string => typeof id === "string" && page.sections[id]?.hideable === true)
    : [];
  return { fields: { values, hidden }, problems };
}

/**
 * Valores de uma página, prontos para o site: o que foi gravado por cima do padrão. A página vem de
 * getPage, então só chega aqui o que está publicado. Campos que vêm da configuração institucional
 * precisam de `settings`.
 */
export function pageFields<S extends CatalogSlug>(
  slug: S,
  page: Pick<Page, "fields"> | null | undefined,
  settings?: SiteSettings,
): ResolvedPage<(typeof PAGE_CATALOG)[S]> {
  const catalog = PAGE_CATALOG[slug] as CatalogPage;
  const values = page?.fields?.values ?? {};
  const resolved: Record<string, Record<string, unknown>> = {};
  for (const [sectionId, section] of Object.entries(catalog.sections)) {
    resolved[sectionId] = {};
    for (const [fieldId, field] of Object.entries(section.fields)) {
      const key = `${sectionId}.${fieldId}`;
      resolved[sectionId][fieldId] = Object.hasOwn(values, key) ? values[key] : fieldDefault(field, settings);
    }
  }
  return resolved as ResolvedPage<(typeof PAGE_CATALOG)[S]>;
}

/** A seção foi escondida no painel? */
export const isSectionHidden = (page: Pick<Page, "fields"> | null | undefined, section: string): boolean =>
  page?.fields?.hidden.includes(section) ?? false;

/** Só o que difere do padrão entra no banco: voltar ao texto original apaga a linha. */
export function diffFromDefaults(
  slug: string,
  values: Readonly<Record<string, unknown>>,
  settings?: SiteSettings,
): Record<string, unknown> {
  const page = catalogOf(slug);
  if (!page) return {};
  const different: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    const found = fieldAt(page, key);
    if (found && !sameFieldValue(found.field, value, fieldDefault(found.field, settings))) different[key] = value;
  }
  return different;
}

/** Nome do campo para o histórico: "Abertura: Título". */
export function catalogFieldLabel(slug: string, path: string): string | undefined {
  const page = catalogOf(slug);
  const key = path.startsWith("fields.values.") ? path.slice("fields.values.".length) : undefined;
  if (!page || !key) return undefined;
  const found = fieldAt(page, key);
  return found ? `${found.section.label}: ${found.field.label}` : undefined;
}
