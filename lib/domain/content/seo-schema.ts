/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : seo-schema.ts
 Descrição    : SEO e Open Graph editáveis de páginas, serviços e cases.

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
import { imageValueSchema, type ImageValue } from "./fields";

const optional = (max: number) => z.string().trim().max(max, `Use no máximo ${max} caracteres.`).optional();

/** Limites do que os buscadores costumam mostrar: passar deles só gera aviso, nunca erro. */
export const SEO_RECOMMENDED = { title: 60, description: 160 } as const;

export const seoSchema = z.object({
  title: optional(120),
  description: optional(300),
  keywords: z.array(z.string().trim().min(1).max(60)).max(20, "Use no máximo 20 palavras-chave.").optional(),
  /** Pede aos buscadores para não listar a página. */
  noindex: z.boolean().optional(),
  ogTitle: optional(120),
  ogDescription: optional(300),
  ogImage: imageValueSchema.optional(),
});

export type SeoData = z.output<typeof seoSchema>;

export const EMPTY_SEO: SeoData = {};

const present = (value: string | undefined) => value?.trim() || undefined;

/** Tira os campos em branco: o que não foi preenchido segue o padrão da página. */
export function compactSeo(seo: SeoData): SeoData {
  const keywords = seo.keywords?.filter(Boolean);
  return Object.fromEntries(
    Object.entries({
      title: present(seo.title),
      description: present(seo.description),
      keywords: keywords?.length ? keywords : undefined,
      noindex: seo.noindex || undefined,
      ogTitle: present(seo.ogTitle),
      ogDescription: present(seo.ogDescription),
      ogImage: seo.ogImage,
    }).filter(([, value]) => value !== undefined),
  ) as SeoData;
}

/** Valor gravado no banco: inválido vira vazio, para um SEO quebrado nunca derrubar a página. */
export function parseSeo(raw: unknown): { seo: SeoData; problems: string[] } {
  const result = seoSchema.safeParse(raw ?? {});
  if (result.success) return { seo: compactSeo(result.data), problems: [] };
  return { seo: EMPTY_SEO, problems: result.error.issues.map((issue) => issue.path.join(".") || issue.message) };
}

export const parseKeywords = (value: string): string[] =>
  value
    .split(/[,\n]/)
    .map((keyword) => keyword.trim())
    .filter(Boolean);

export interface SeoFormInput {
  title: string;
  description: string;
  keywords: string;
  noindex: boolean;
  ogTitle: string;
  ogDescription: string;
  /** Imagem escolhida na biblioteca; `undefined` usa a imagem padrão de compartilhamento. */
  ogImage?: ImageValue;
}

export function seoFromForm(input: SeoFormInput) {
  return seoSchema.safeParse({
    title: input.title,
    description: input.description,
    keywords: parseKeywords(input.keywords),
    noindex: input.noindex,
    ogTitle: input.ogTitle,
    ogDescription: input.ogDescription,
    ...(input.ogImage ? { ogImage: input.ogImage } : {}),
  });
}

export interface PublicSeoBase {
  title: string;
  description: string;
  keywords?: readonly string[];
}

/** O que a página publica: o que foi preenchido no painel, por cima do padrão da rota. */
export function effectiveSeo(base: PublicSeoBase, seo: SeoData = EMPTY_SEO) {
  const title = seo.title ?? base.title;
  const description = seo.description ?? base.description;
  return {
    title,
    description,
    keywords: seo.keywords ?? base.keywords ?? [],
    noindex: seo.noindex ?? false,
    ogTitle: seo.ogTitle ?? title,
    ogDescription: seo.ogDescription ?? description,
    ogImage: seo.ogImage,
  };
}
