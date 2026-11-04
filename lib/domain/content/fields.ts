/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : fields.ts
 Descrição    : Tipos de campo editável (texto, link, imagem, ícone, cor, lista), com validação e leitura de formulário.

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

import { z } from "zod";
import { MEDIA_BUCKET } from "@/lib/domain/media/policy";
import { BRAND_ICONS, BRAND_ICON_COLORS, type BrandIconColor, type BrandIconName } from "./icons";
import { isValidExternalUrl } from "./integrity";
import { SECTION_TONE_NAMES, type SectionToneName } from "./tones";
import type { SiteSettings } from "./types";

/*
 * Todo conteúdo que o painel edita sem tela própria (textos fixos das páginas, blocos novos) é
 * descrito por estes campos. Só texto puro: o site nunca renderiza HTML vindo do banco. Link só com
 * destino seguro e imagem só da biblioteca: é a validação daqui que impede `javascript:` e host externo.
 */

export interface LinkValue {
  label: string;
  href: string;
}

export interface IconValue {
  name: BrandIconName;
  color: BrandIconColor;
}

export interface ImageValue {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

interface FieldBase {
  label: string;
  hint?: string;
}

export interface TextFieldDef extends FieldBase {
  kind: "text";
  default: string;
  max: number;
  /** Mais de uma linha no formulário. */
  rows?: number;
  /** Em branco, o site não mostra o texto. Sem isso, o campo é obrigatório. */
  optional?: boolean;
  /** O padrão vem da configuração institucional (manifesto e Sobre), não do código. */
  fromSettings?: (settings: SiteSettings) => string;
  /** O texto é um destino de link: passa pela mesma regra dos botões. */
  format?: "href";
}

export interface LinesFieldDef extends FieldBase {
  kind: "lines";
  default: readonly string[];
  max: number;
  maxItems: number;
  rows?: number;
  optional?: boolean;
  fromSettings?: (settings: SiteSettings) => readonly string[];
}

export interface LinkFieldDef extends FieldBase {
  kind: "link";
  default: LinkValue | null;
  optional?: boolean;
}

export interface ImageFieldDef extends FieldBase {
  kind: "image";
  default: ImageValue | null;
  optional?: boolean;
}

export interface IconFieldDef extends FieldBase {
  kind: "icon";
  default: IconValue | null;
  /** Em branco, o site não mostra ícone. */
  optional?: boolean;
}

export interface ToneFieldDef extends FieldBase {
  kind: "tone";
  default: SectionToneName;
}

export interface ChoiceFieldDef<V extends string = string> extends FieldBase {
  kind: "choice";
  default: V;
  options: readonly { value: V; label: string }[];
}

export type ScalarFieldDef =
  TextFieldDef | LinesFieldDef | LinkFieldDef | ImageFieldDef | IconFieldDef | ToneFieldDef | ChoiceFieldDef;

export interface ListFieldDef<
  I extends Record<string, ScalarFieldDef> = Record<string, ScalarFieldDef>,
> extends FieldBase {
  kind: "list";
  item: I;
  default: readonly ItemValue<I>[];
  /** Como cada linha se chama no formulário: "Etapa", "Item". */
  itemLabel: string;
  minItems: number;
  maxItems: number;
}

export type FieldDef = ScalarFieldDef | ListFieldDef;

export type FieldValue<F> = F extends TextFieldDef
  ? string
  : F extends LinesFieldDef
    ? string[]
    : F extends LinkFieldDef
      ? F extends { optional: true }
        ? LinkValue | null
        : LinkValue
      : F extends ImageFieldDef
        ? F extends { optional: true }
          ? ImageValue | null
          : ImageValue
        : F extends IconFieldDef
          ? F extends { optional: true }
            ? IconValue | null
            : IconValue
          : F extends ToneFieldDef
            ? SectionToneName
            : F extends ChoiceFieldDef<infer V>
              ? V
              : F extends ListFieldDef<infer I>
                ? ItemValue<I>[]
                : never;

export type ItemValue<I extends Record<string, ScalarFieldDef>> = { [K in keyof I]: FieldValue<I[K]> };

/** Valores de um grupo de campos, como um bloco os guarda. */
export type FieldsValue<F extends Readonly<Record<string, FieldDef>>> = { [K in keyof F]: FieldValue<F[K]> };

/* ─── Construtores usados nos catálogos ─── */

type TextOptions = Partial<Pick<TextFieldDef, "max" | "rows" | "hint" | "format">>;

export const text = (label: string, value: string, options: TextOptions = {}): TextFieldDef => ({
  kind: "text",
  label,
  default: value,
  max: options.rows ? 1200 : 160,
  ...options,
});

/** Texto que pode ficar em branco: nesse caso, o site não mostra. */
export const optionalText = (label: string, value: string, options: TextOptions = {}) =>
  ({ ...text(label, value, options), optional: true }) as TextFieldDef & { optional: true };

/** Parágrafo: mais de uma linha no formulário. */
export const longText = (label: string, value: string, options: TextOptions = {}): TextFieldDef =>
  text(label, value, { rows: 3, ...options });

export const lines = (
  label: string,
  value: readonly string[],
  options: Partial<Pick<LinesFieldDef, "max" | "maxItems" | "rows" | "hint" | "optional" | "fromSettings">> = {},
): LinesFieldDef => ({ kind: "lines", label, default: value, max: 1200, maxItems: 12, rows: 6, ...options });

export const link = (
  label: string,
  value: LinkValue,
  options: Partial<Pick<LinkFieldDef, "hint">> = {},
): LinkFieldDef & { default: LinkValue } => ({ kind: "link", label, default: value, ...options });

export const optionalLink = (
  label: string,
  value: LinkValue | null,
  options: Partial<Pick<LinkFieldDef, "hint">> = {},
): LinkFieldDef & { optional: true } => ({ kind: "link", label, default: value, optional: true, ...options });

export const image = (
  label: string,
  value: ImageValue,
  options: Partial<Pick<ImageFieldDef, "hint">> = {},
): ImageFieldDef & { default: ImageValue } => ({ kind: "image", label, default: value, ...options });

/** Imagem obrigatória sem padrão: a de um bloco novo, escolhida na biblioteca. */
export const requiredImage = (label: string, options: Partial<Pick<ImageFieldDef, "hint">> = {}) =>
  ({ kind: "image", label, default: null, ...options }) as ImageFieldDef & { default: ImageValue };

export const optionalImage = (
  label: string,
  value: ImageValue | null,
  options: Partial<Pick<ImageFieldDef, "hint">> = {},
): ImageFieldDef & { optional: true } => ({ kind: "image", label, default: value, optional: true, ...options });

export const icon = (
  label: string,
  name: BrandIconName,
  color: BrandIconColor = "verde",
): IconFieldDef & { default: IconValue } => ({ kind: "icon", label, default: { name, color } });

export const optionalIcon = (label: string): IconFieldDef & { optional: true } => ({
  kind: "icon",
  label,
  default: null,
  optional: true,
});

export const tone = (label: string, value: SectionToneName): ToneFieldDef => ({ kind: "tone", label, default: value });

export const choice = <const V extends string>(
  label: string,
  value: V,
  options: readonly { value: V; label: string }[],
): ChoiceFieldDef<V> => ({ kind: "choice", label, default: value, options });

export const list = <const I extends Record<string, ScalarFieldDef>>(
  label: string,
  item: I,
  value: readonly ItemValue<I>[],
  options: { itemLabel: string; minItems?: number; maxItems?: number; hint?: string },
): ListFieldDef<I> => ({
  kind: "list",
  label,
  item,
  default: value,
  itemLabel: options.itemLabel,
  minItems: options.minItems ?? 0,
  maxItems: options.maxItems ?? 12,
  ...(options.hint ? { hint: options.hint } : {}),
});

/* ─── Destinos e imagens aceitos ─── */

const SAFE_INTERNAL_PATH = /^\/(?!\/)[A-Za-z0-9\-._~/%?=&#+]*$/;
/** O painel e a API existem, mas não são destino de botão do site. */
const CLOSED_PATHS = /^\/(admin|api)(\/|\?|#|$)/;
const SAFE_CONTACT_LINK = /^(mailto:[^\s<>"']+@[^\s<>"']+|tel:\+?[0-9 ().-]{8,20})$/;

/** Destino de link ou botão: página do site, https, e-mail ou telefone. `javascript:` nunca passa. */
export function isValidLinkHref(href: string): boolean {
  if (SAFE_INTERNAL_PATH.test(href)) return !CLOSED_PATHS.test(href);
  if (SAFE_CONTACT_LINK.test(href)) return true;
  return isValidExternalUrl(href) && URL.canParse(href) && !new URL(href).username && !new URL(href).password;
}

/** O site abre em nova aba tudo o que sai dele; e-mail e telefone continuam na mesma aba. */
export const isExternalHref = (href: string): boolean => /^https?:/.test(href);

/** Storage do Supabase local (`npx supabase start`) é http; nos demais ambientes vale o https. */
const BUCKET_PATH = `/storage/v1/object/public/${MEDIA_BUCKET}/`;

/** URL do bucket de mídia: https ou o Storage local. O host do projeto não entra: a regra é de domínio. */
function isBucketUrl(src: string): boolean {
  if (!URL.canParse(src)) return false;
  const url = new URL(src);
  const allowedOrigin = url.protocol === "https:" || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(url.origin);
  return allowedOrigin && url.pathname.startsWith(BUCKET_PATH) && !url.pathname.includes("..");
}

/** Caminho em /public (ex.: /brand/...) ou URL do bucket de mídia. */
export const mediaSrc = z
  .string()
  .max(500)
  .refine((src) => (src.startsWith("/") && !src.startsWith("//")) || isBucketUrl(src), "Imagem inválida.");

const FILL_IN = "Preencha este campo.";
const BAD_HREF = "Use uma página do site (/contato), um link https, mailto: ou tel:.";

export const imageValueSchema = z.object({
  src: mediaSrc,
  alt: z.string().trim().max(160, "Use no máximo 160 caracteres."),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const requiredImageSchema = imageValueSchema.nullable().refine((value) => value !== null, "Escolha uma imagem.");

export const linkValueSchema = z.object({
  label: z.string({ error: FILL_IN }).trim().min(1, FILL_IN).max(60, "Use no máximo 60 caracteres."),
  href: z
    .string({ error: FILL_IN })
    .trim()
    .min(1, FILL_IN)
    .max(500, "Use no máximo 500 caracteres.")
    .refine(isValidLinkHref, BAD_HREF),
});

/** Regra de um campo: o que o painel aceita é exatamente o que o site aceita exibir. */
export function fieldSchema(field: FieldDef): z.ZodType {
  switch (field.kind) {
    case "text": {
      const base = z.string({ error: FILL_IN }).trim().max(field.max, `Use no máximo ${field.max} caracteres.`);
      const filled = field.optional ? base : base.min(1, FILL_IN);
      return field.format === "href" ? filled.refine((value) => !value || isValidLinkHref(value), BAD_HREF) : filled;
    }
    case "lines": {
      const item = z.string().trim().min(1).max(field.max, `Cada linha aceita até ${field.max} caracteres.`);
      const base = z.array(item).max(field.maxItems, `Use no máximo ${field.maxItems} linhas.`);
      return field.optional ? base : base.min(1, FILL_IN);
    }
    case "link":
      return field.optional ? linkValueSchema.nullable() : linkValueSchema;
    case "image":
      return field.optional ? imageValueSchema.nullable() : requiredImageSchema;
    case "icon": {
      const value = z.object({ name: z.enum(BRAND_ICONS), color: z.enum(BRAND_ICON_COLORS) });
      return field.optional ? value.nullable() : value;
    }
    case "tone":
      return z.enum(SECTION_TONE_NAMES);
    case "choice":
      return z.enum(field.options.map((option) => option.value) as [string, ...string[]]);
    case "list":
      return z
        .array(z.object(Object.fromEntries(Object.entries(field.item).map(([key, def]) => [key, fieldSchema(def)]))))
        .min(field.minItems, `Inclua ao menos ${field.minItems}.`)
        .max(field.maxItems, `Use no máximo ${field.maxItems}.`);
  }
}

/** Schema de um grupo de campos (conteúdo de um bloco). */
export function fieldsSchema<const F extends Readonly<Record<string, FieldDef>>>(fields: F) {
  return z.object(
    Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, fieldSchema(field)])),
  ) as unknown as z.ZodType<FieldsValue<F>>;
}

/** Valor padrão do campo, já resolvendo o que vem da configuração institucional. */
export function fieldDefault(field: FieldDef, settings?: SiteSettings): unknown {
  if ((field.kind === "text" || field.kind === "lines") && field.fromSettings && settings) {
    return field.fromSettings(settings);
  }
  return field.default;
}

/** JSON com as chaves em ordem: `{ href, label }` e `{ label, href }` são o mesmo conteúdo. */
export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    typeof item === "object" && item !== null && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item,
  );
}

/** Dois valores são o mesmo conteúdo? Na imagem só importa o endereço: o texto alternativo vem da biblioteca. */
export function sameFieldValue(field: FieldDef, a: unknown, b: unknown): boolean {
  if (field.kind === "image") {
    const src = (value: unknown) => (value as ImageValue | null)?.src ?? null;
    return src(a) === src(b);
  }
  return stableJson(a) === stableJson(b);
}

/* ─── Leitura do formulário ─── */

export type FormEntries = ReadonlyMap<string, string>;

/** Campos nomeados pelo caminho: `hero.titulo`, `hero.botao.label`, `etapas.0.titulo`. */
export function entriesFromForm(form: Iterable<[string, FormDataEntryValue]>): FormEntries {
  const entries = new Map<string, string>();
  for (const [key, value] of form) if (typeof value === "string") entries.set(key, value);
  return entries;
}

export interface FieldReadContext {
  /** Imagem escolhida pelo id da biblioteca; `undefined` se não existir mais. */
  media(id: string): ImageValue | undefined;
}

/** Ordem de escolha do seletor de imagem: padrão, nenhuma ou um id da biblioteca. */
export const IMAGE_DEFAULT = "";
export const IMAGE_NONE = "__sem-imagem__";

/** Id que o seletor manda para manter a imagem atual quando ela já não é escolhida pela lista. */
export const IMAGE_KEEP = "__manter__";

export type ReadResult = { ok: true; value: unknown } | { ok: false; message: string };

const splitLines = (value: string) =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

function readScalar(
  field: ScalarFieldDef,
  name: string,
  entries: FormEntries,
  context: FieldReadContext,
  fallback: unknown,
  current?: unknown,
): ReadResult {
  const raw = entries.get(name) ?? "";
  switch (field.kind) {
    case "text":
      return { ok: true, value: raw };
    case "lines":
      return { ok: true, value: splitLines(raw) };
    case "link": {
      const label = (entries.get(`${name}.label`) ?? "").trim();
      const href = (entries.get(`${name}.href`) ?? "").trim();
      if (field.optional && !label && !href) return { ok: true, value: null };
      return { ok: true, value: { label, href } };
    }
    case "image": {
      if (raw === IMAGE_NONE) return { ok: true, value: null };
      if (raw === IMAGE_DEFAULT) return { ok: true, value: fallback };
      if (raw === IMAGE_KEEP) return { ok: true, value: current ?? fallback };
      const chosen = context.media(raw);
      return chosen ? { ok: true, value: chosen } : { ok: false, message: "Esta imagem não está mais na biblioteca." };
    }
    case "icon": {
      const iconName = entries.get(`${name}.name`) ?? "";
      if (field.optional && !iconName) return { ok: true, value: null };
      return { ok: true, value: { name: iconName, color: entries.get(`${name}.color`) ?? "" } };
    }
    case "tone":
    case "choice":
      return { ok: true, value: raw };
  }
}

/** Índices das linhas de uma lista, na ordem da tela. Apagar uma linha deixa buraco: o que vale é a ordem. */
export function listRowIndexes(name: string, entries: FormEntries): number[] {
  const prefix = `${name}.`;
  const indexes = new Set<number>();
  for (const key of entries.keys()) {
    if (!key.startsWith(prefix)) continue;
    const segment = key.slice(prefix.length).split(".")[0];
    if (/^\d+$/.test(segment)) indexes.add(Number(segment));
  }
  return [...indexes].sort((a, b) => a - b);
}

export type FieldErrors = Record<string, string[]>;

/** Mensagens do Zod no nome do campo do formulário. */
function issuesToErrors(name: string, error: z.ZodError, errors: FieldErrors) {
  for (const issue of error.issues) {
    const path = [name, ...issue.path].join(".");
    (errors[path] ??= []).push(issue.message);
  }
}

export interface ReadFieldsResult {
  values: Record<string, unknown>;
  errors: FieldErrors;
}

/**
 * Lê e valida um grupo de campos do formulário. `prefix` é o nome do grupo (`hero`) ou vazio.
 * `fallbackOf` diz o que vale quando a imagem fica no padrão, e `currentOf`, o valor gravado hoje.
 */
export function readFields(
  fields: Readonly<Record<string, FieldDef>>,
  entries: FormEntries,
  context: FieldReadContext,
  prefix = "",
  fallbackOf: (key: string, field: FieldDef) => unknown = (_key, field) => field.default,
  currentOf: (key: string) => unknown = () => undefined,
): ReadFieldsResult {
  const values: Record<string, unknown> = {};
  const errors: FieldErrors = {};
  for (const [key, field] of Object.entries(fields)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (field.kind === "list") {
      const rows: Record<string, unknown>[] = [];
      for (const index of listRowIndexes(name, entries)) {
        const row: Record<string, unknown> = {};
        for (const [itemKey, itemField] of Object.entries(field.item)) {
          const itemName = `${name}.${index}.${itemKey}`;
          const read = readScalar(itemField, itemName, entries, context, itemField.default);
          if (read.ok) row[itemKey] = read.value;
          else errors[itemName] = [read.message];
        }
        rows.push(row);
      }
      const parsed = fieldSchema(field).safeParse(rows);
      if (parsed.success) values[key] = parsed.data;
      else issuesToErrors(name, parsed.error, errors);
      continue;
    }
    const read = readScalar(field, name, entries, context, fallbackOf(key, field), currentOf(key));
    if (!read.ok) {
      errors[name] = [read.message];
      continue;
    }
    const parsed = fieldSchema(field).safeParse(read.value);
    if (parsed.success) values[key] = parsed.data;
    else issuesToErrors(name, parsed.error, errors);
  }
  return { values, errors };
}

/** Troca `{chave}` no texto: "{total} cases encontrados". Chave sem valor continua visível, para a revisão notar. */
export function fillText(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{([a-z]+)\}/g, (whole, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : whole,
  );
}
