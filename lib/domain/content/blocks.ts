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
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { isValidExternalUrl, isValidInternalPath } from "./integrity";

/*
 * Páginas do CMS (tabelas pages/blocks, DB-01). No MVP as rotas do site são fixas: uma
 * página cujo slug coincide com uma rota pública acrescenta blocos depois das seções fixas
 * daquela rota (ex.: "sobre" → /sobre). Páginas com outro slug ficam salvas, mas não têm
 * rota própria até existir uma decisão de produto sobre páginas livres.
 */
export const PAGE_ROUTES = {
  sobre: "/sobre",
  areas: "/areas",
  servicos: "/servicos",
  cases: "/cases",
  contato: "/contato",
  privacidade: "/privacidade",
} as const;

export type RoutedPageSlug = keyof typeof PAGE_ROUTES;

/** Rota pública em que a página aparece, ou `null` quando ela ainda não tem rota. */
export function pagePath(slug: string): string | null {
  return Object.hasOwn(PAGE_ROUTES, slug) ? PAGE_ROUTES[slug as RoutedPageSlug] : null;
}

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalTitle = text(120).optional();

/** Caminho em /public (ex.: /brand/...) ou URL https do bucket de mídia. */
const mediaSrc = z
  .string()
  .max(500)
  .refine((src) => (src.startsWith("/") && !src.startsWith("//")) || isValidExternalUrl(src), "Imagem inválida.");

/*
 * Conteúdo de cada tipo de bloco. Só texto puro e listas: o site nunca renderiza HTML
 * vindo do banco (evita XSS); quebras de parágrafo viram itens do array.
 */
export const BLOCK_SCHEMAS = {
  /** Título opcional e parágrafos. */
  "rich-text": z.object({
    title: optionalTitle,
    paragraphs: z.array(text(1200)).min(1).max(12),
  }),
  /** Lista de destaques (ex.: proposta de valor, diferenciais). */
  list: z.object({
    title: optionalTitle,
    items: z
      .array(z.object({ title: text(120), text: text(600).optional() }))
      .min(1)
      .max(12),
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
      .min(1)
      .max(40),
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
} as const;

export type BlockType = keyof typeof BLOCK_SCHEMAS;
export const BLOCK_TYPES = Object.keys(BLOCK_SCHEMAS) as BlockType[];

export type BlockContent<T extends BlockType> = z.infer<(typeof BLOCK_SCHEMAS)[T]>;

export type PageBlock = {
  [T in BlockType]: { id: string; type: T; content: BlockContent<T>; order: number };
}[BlockType];

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
