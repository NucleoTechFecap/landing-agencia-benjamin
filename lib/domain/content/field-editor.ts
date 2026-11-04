/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : field-editor.ts
 Descrição    : Prepara os campos do catálogo para o formulário do painel, sem o que não pode ir ao navegador.

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

import { PAGE_CATALOG, type CatalogPage, type CatalogSlug } from "./catalog";
import { fieldDefault, type FieldDef, type ScalarFieldDef } from "./fields";
import type { Page, SiteSettings } from "./types";

/** Nome do campo que lista as seções escondidas. */
export const HIDDEN_SECTIONS_FIELD = "secoes-escondidas";

/** Definição do campo que pode ir ao navegador: sem funções. */
export type EditorFieldDef = Omit<FieldDef, "fromSettings">;

export interface EditorField {
  /** Nome no formulário: `secao.campo`. */
  name: string;
  def: FieldDef;
  /** O que está valendo hoje. */
  value: unknown;
  /** O padrão, para o botão de voltar ao texto original. */
  base: unknown;
}

export interface EditorSection {
  id: string;
  label: string;
  hint?: string;
  hideable: boolean;
  hidden: boolean;
  fields: EditorField[];
}

/** `fromSettings` é função: já foi resolvida em `value` e `base`, e não pode ir ao navegador. */
const serializable = (field: FieldDef): FieldDef => {
  const copy = { ...field } as FieldDef & { fromSettings?: unknown };
  delete copy.fromSettings;
  return copy;
};

/** Seções e campos de uma página do catálogo, com os valores atuais e os padrões. */
export function editorSections(slug: CatalogSlug, page: Pick<Page, "fields">, settings: SiteSettings): EditorSection[] {
  const catalog = PAGE_CATALOG[slug] as CatalogPage;
  const stored = page.fields?.values ?? {};
  return Object.entries(catalog.sections).map(([id, section]) => ({
    id,
    label: section.label,
    hint: section.hint,
    hideable: section.hideable === true,
    hidden: page.fields?.hidden.includes(id) ?? false,
    fields: Object.entries(section.fields).map(([fieldId, field]) => {
      const key = `${id}.${fieldId}`;
      const base = fieldDefault(field, settings);
      return {
        name: key,
        def: serializable(field),
        value: Object.hasOwn(stored, key) ? stored[key] : base,
        base,
      };
    }),
  }));
}

/** Campos de um bloco novo ou existente, sem padrão a restaurar. */
export function blockEditorFields(
  fields: Readonly<Record<string, FieldDef>>,
  prefix: string,
  content?: Readonly<Record<string, unknown>>,
): EditorField[] {
  return Object.entries(fields).map(([key, def]) => ({
    name: `${prefix}.${key}`,
    def: serializable(def),
    value: content?.[key] ?? def.default,
    base: undefined,
  }));
}

export type { ScalarFieldDef };
