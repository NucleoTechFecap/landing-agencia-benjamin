/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : case-schema.ts
 Descrição    : Esquemas de rascunho e publicação do case e validação para publicar.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (CASE-11).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { PUBLICATION_STATUSES } from "./publication-status";
import { SLUG_MAX_LENGTH, SLUG_MIN_LENGTH, SLUG_PATTERN } from "./slug";

/** Limites dos campos do case (CASE-11). */
export const CASE_LIMITS = {
  title: 120,
  client: 120,
  summary: { min: 30, max: 280 },
  longText: 4000,
  deliveryType: 60,
  gallery: 20,
  links: 10,
  team: 20,
  alt: 160,
} as const;

const slug = z
  .string()
  .trim()
  .min(SLUG_MIN_LENGTH, "Slug muito curto.")
  .max(SLUG_MAX_LENGTH, "Slug muito longo.")
  .regex(SLUG_PATTERN, "Use letras minúsculas, números e hífens.");

const optionalLongText = z.string().trim().max(CASE_LIMITS.longText).optional();

const media = z.object({
  src: z.string().min(1),
  alt: z.string().trim().min(1, "Descreva a imagem (texto alternativo).").max(CASE_LIMITS.alt),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const externalLink = z.object({
  label: z.string().trim().min(2).max(80),
  url: z.url({ protocol: /^https$/, error: "Use um link https." }),
});

/** Mês de referência AAAA-MM, não futuro. */
const referenceMonth = (now: Date) =>
  z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use o formato AAAA-MM.")
    .refine((value) => value <= now.toISOString().slice(0, 7), "A data não pode estar no futuro.");

/**
 * Rascunho: só título e slug são exigidos, para a equipe salvar o case aos poucos
 * enquanto o material da Benjamin não chega (CON-06…CON-08).
 */
export const caseDraftSchema = z.object({
  title: z.string().trim().min(2, "Informe o título.").max(CASE_LIMITS.title),
  slug,
  client: z.string().trim().max(CASE_LIMITS.client).optional(),
  categoryId: z.string().optional(),
  serviceIds: z.array(z.string()).max(9).default([]),
  deliveryType: z.string().trim().max(CASE_LIMITS.deliveryType).optional(),
  summary: z.string().trim().max(CASE_LIMITS.summary.max).optional(),
  challenge: optionalLongText,
  solution: optionalLongText,
  results: optionalLongText,
  cover: media.partial({ alt: true }).optional(),
  gallery: z
    .array(media.partial({ alt: true }))
    .max(CASE_LIMITS.gallery)
    .default([]),
  externalLinks: z.array(externalLink).max(CASE_LIMITS.links).default([]),
  date: z.string().optional(),
  team: z.array(z.string().trim().min(2).max(80)).max(CASE_LIMITS.team).default([]),
  featured: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
  status: z.enum(PUBLICATION_STATUSES).default("draft"),
});

/**
 * Publicação: exige o mínimo para o case fazer sentido no site — sem tornar obrigatórios
 * campos que nem todo trabalho tem (desafio/solução/resultados, data, equipe, galeria).
 */
export const casePublishSchema = (now: Date = new Date()) =>
  caseDraftSchema.extend({
    client: z.string().trim().min(2, "Informe o cliente.").max(CASE_LIMITS.client),
    categoryId: z.string().min(1, "Escolha a categoria."),
    serviceIds: z.array(z.string()).min(1, "Relacione ao menos um serviço.").max(9),
    summary: z
      .string()
      .trim()
      .min(CASE_LIMITS.summary.min, `Resumo com pelo menos ${CASE_LIMITS.summary.min} caracteres.`)
      .max(CASE_LIMITS.summary.max),
    cover: media,
    gallery: z.array(media).max(CASE_LIMITS.gallery).default([]),
    date: referenceMonth(now).optional(),
  });

export type CaseDraftInput = z.input<typeof caseDraftSchema>;

/** Lista de problemas que impedem a publicação (alimenta `validateForPublish` — TECH-04). */
export function validateCaseForPublish(input: unknown, now: Date = new Date()): string[] {
  const result = casePublishSchema(now).safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((issue) => {
    const field = issue.path.join(".");
    return field ? `${field}: ${issue.message}` : issue.message;
  });
}
