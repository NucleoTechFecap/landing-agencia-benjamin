/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : blocks.ts
 Descrição    : Catálogo de tipos de bloco das páginas editáveis e validação do conteúdo.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 01/11/2026 Vinícius Nishimura Reis  Seção Nosso time como bloco opcional (SOB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { isValidExternalUrl, isValidInternalPath } from "./integrity";
import { aboutSchema, manifestoSchema } from "./settings-schema";

/*
 * Páginas do CMS (tabelas pages/blocks, DB-01). No MVP as rotas do site são fixas: uma
 * página cujo slug coincide com uma rota pública acrescenta blocos depois das seções fixas
 * daquela rota (ex.: "sobre" → /sobre). Páginas com outro slug ficam salvas, mas não têm
 * rota própria até existir uma decisão de produto sobre páginas livres.
 */
export const PAGE_ROUTES = {
  home: "/",
  sobre: "/sobre",
  areas: "/areas",
  servicos: "/servicos",
  cases: "/cases",
  contato: "/contato",
  privacidade: "/privacidade",
} as const;

export type RoutedPageSlug = keyof typeof PAGE_ROUTES;

/** Como cada rota aparece no painel. */
export const PAGE_ROUTE_LABELS: Readonly<Record<RoutedPageSlug, string>> = {
  home: "Home",
  sobre: "Sobre",
  areas: "Áreas de atuação",
  servicos: "Serviços",
  cases: "Cases",
  contato: "Contato",
  privacidade: "Privacidade",
};

export const ROUTED_PAGE_SLUGS = Object.keys(PAGE_ROUTES) as RoutedPageSlug[];

/** Rota pública em que a página aparece, ou `null` quando ela ainda não tem rota. */
export function pagePath(slug: string): string | null {
  return Object.hasOwn(PAGE_ROUTES, slug) ? PAGE_ROUTES[slug as RoutedPageSlug] : null;
}

const FILL_IN = "Preencha este campo.";
const text = (max: number) =>
  z.string({ error: FILL_IN }).trim().min(1, FILL_IN).max(max, `Use no máximo ${max} caracteres.`);
const optionalTitle = text(120).optional();

/** Storage do Supabase local (`npx supabase start`) é http; nos demais ambientes vale o https. */
const LOCAL_STORAGE = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/storage\/v1\/object\/public\//;

/** Caminho em /public (ex.: /brand/...) ou URL https do bucket de mídia. */
const mediaSrc = z
  .string()
  .max(500)
  .refine(
    (src) => (src.startsWith("/") && !src.startsWith("//")) || isValidExternalUrl(src) || LOCAL_STORAGE.test(src),
    "Imagem inválida.",
  );

/*
 * Conteúdo de cada tipo de bloco. Só texto puro e listas: o site nunca renderiza HTML
 * vindo do banco (evita XSS); quebras de parágrafo viram itens do array.
 */
export const BLOCK_SCHEMAS = {
  /** Título opcional e parágrafos. */
  "rich-text": z.object({
    title: optionalTitle,
    paragraphs: z.array(text(1200)).min(1, "Escreva ao menos um parágrafo.").max(12, "Use no máximo 12 parágrafos."),
  }),
  /** Lista de destaques (ex.: proposta de valor, diferenciais). */
  list: z.object({
    title: optionalTitle,
    items: z
      .array(z.object({ title: text(120), text: text(600).optional() }))
      .min(1, "Inclua ao menos um item.")
      .max(12, "Use no máximo 12 itens."),
  }),
  /** "Nosso time" (SOB-03). Foto exige autorização de uso de imagem da pessoa. */
  team: z.object({
    title: optionalTitle,
    members: z
      .array(
        z.object({
          name: text(80),
          role: text(80).optional(),
          photo: z.object({ src: mediaSrc, alt: text(160) }).optional(),
        }),
      )
      .min(1, "Inclua ao menos uma pessoa.")
      .max(40, "Use no máximo 40 pessoas."),
  }),
  /** Faixa de chamada para ação com destino interno conhecido ou link https. */
  cta: z.object({
    title: text(120),
    text: text(300).optional(),
    label: text(40),
    href: z
      .string()
      .max(500)
      .refine((href) => isValidInternalPath(href) || isValidExternalUrl(href), "Destino desconhecido ou sem https."),
  }),
  /*
   * Textos que têm seção fixa no site: publicados, tomam o lugar do valor de site_settings
   * (RF-01). Vivem em página para o editor (page:edit) poder alterar, com rascunho e publicação;
   * site_settings só aceita settings:edit e grava direto no ar.
   */
  manifesto: manifestoSchema.omit({ provisional: true }),
  about: aboutSchema.omit({ provisional: true }),
} as const;

export type BlockType = keyof typeof BLOCK_SCHEMAS;
export const BLOCK_TYPES = Object.keys(BLOCK_SCHEMAS) as BlockType[];

export type BlockContent<T extends BlockType> = z.infer<(typeof BLOCK_SCHEMAS)[T]>;

export type PageBlock = {
  [T in BlockType]: { id: string; type: T; content: BlockContent<T>; order: number };
}[BlockType];

/** Como cada tipo aparece no painel. */
export const BLOCK_LABELS: Readonly<Record<BlockType, string>> = {
  "rich-text": "Texto",
  list: "Lista de destaques",
  team: "Nosso time",
  cta: "Chamada para ação",
  manifesto: "Manifesto (topo da Home)",
  about: "Sobre a Benjamin",
};

/** Blocos que substituem uma seção fixa: só valem na página daquela seção, um por página. */
const SECTION_BLOCK_PAGES: Partial<Record<BlockType, RoutedPageSlug>> = { manifesto: "home", about: "sobre" };

export const isSectionBlock = (type: BlockType): boolean => Object.hasOwn(SECTION_BLOCK_PAGES, type);

/** Motivo para o tipo não poder entrar na página, ou `null` quando pode. */
export function blockRestriction(type: BlockType, slug: string, blocks: readonly PageBlock[]): string | null {
  const section = SECTION_BLOCK_PAGES[type];
  if (!section) return null;
  if (section !== slug) return `O bloco "${BLOCK_LABELS[type]}" só existe na página ${PAGE_ROUTE_LABELS[section]}.`;
  return blocks.some((block) => block.type === type) ? `Esta página já tem o bloco "${BLOCK_LABELS[type]}".` : null;
}

/** Tipos que ainda podem ser acrescentados à página. */
export const addableBlockTypes = (slug: string, blocks: readonly PageBlock[]): BlockType[] =>
  BLOCK_TYPES.filter((type) => blockRestriction(type, slug, blocks) === null);

export function isBlockType(value: unknown): value is BlockType {
  return typeof value === "string" && Object.hasOwn(BLOCK_SCHEMAS, value);
}

export type ParsedBlock = { ok: true; block: PageBlock } | { ok: false; problem: string };

/** Valida um bloco vindo do banco. Tipo desconhecido ou conteúdo inválido não é exibido. */
export function parseBlock(raw: { id: string; type: string; content: unknown; order: number }): ParsedBlock {
  if (!isBlockType(raw.type)) return { ok: false, problem: `Tipo de bloco desconhecido: ${raw.type}.` };
  const result = BLOCK_SCHEMAS[raw.type].safeParse(raw.content);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join(".") || issue.message).join(", ");
    return { ok: false, problem: `Bloco ${raw.type} inválido (${fields}).` };
  }
  return { ok: true, block: { id: raw.id, type: raw.type, content: result.data, order: raw.order } as PageBlock };
}
