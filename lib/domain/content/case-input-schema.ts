/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : case-input-schema.ts
 Descrição    : Formulário de case do CMS: mídia por id, links e equipe, com os limites do CASE-11.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
 26/10/2026 Vinícius Nishimura Reis  Veículo e data nos links de clipping (CASE-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { CASE_LIMITS, externalLinkSchema } from "./case-schema";
import { optionalText, orderField, slugField } from "./cms-schema";
import type { ExternalLink } from "./types";

const uuid = z.string().uuid("Seleção inválida.");
const optionalUuid = uuid.optional().or(z.literal("").transform(() => undefined));

/**
 * O que o formulário do case envia. Capa e galeria são ids da biblioteca de mídia; a regra
 * de publicação continua sendo `validateCaseForPublish` (case-schema.ts, CASE-11), aplicada
 * ao case montado com as imagens resolvidas.
 */
export const caseInputSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Informe o título.")
    .max(CASE_LIMITS.title, `Use no máximo ${CASE_LIMITS.title} caracteres.`),
  slug: slugField,
  client: optionalText(CASE_LIMITS.client),
  categoryId: optionalUuid,
  serviceIds: z.array(uuid).max(9, "No máximo 9 serviços.").default([]),
  deliveryType: optionalText(CASE_LIMITS.deliveryType),
  summary: optionalText(CASE_LIMITS.summary.max),
  challenge: optionalText(CASE_LIMITS.longText),
  solution: optionalText(CASE_LIMITS.longText),
  results: optionalText(CASE_LIMITS.longText),
  coverId: optionalUuid,
  galleryIds: z.array(uuid).max(CASE_LIMITS.gallery, `No máximo ${CASE_LIMITS.gallery} imagens.`).default([]),
  externalLinks: z
    .array(externalLinkSchema)
    .max(CASE_LIMITS.links, `No máximo ${CASE_LIMITS.links} links.`)
    .default([]),
  date: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use o formato AAAA-MM.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  team: z
    .array(z.string().trim().min(2).max(80))
    .max(CASE_LIMITS.team, `No máximo ${CASE_LIMITS.team} pessoas.`)
    .default([]),
  featured: z.boolean().default(false),
  order: orderField,
});

export type CaseInput = z.output<typeof caseInputSchema>;

export interface ParsedLinks {
  links: ExternalLink[];
  /** Linhas sem rótulo ou sem endereço. */
  invalid: string[];
}

/**
 * Uma linha por link: "Rótulo | https://endereço", com veículo e data opcionais para
 * clippings — "Rótulo | https://endereço | Veículo | AAAA-MM-DD" (CASE-10).
 */
export function parseLinkLines(lines: readonly string[]): ParsedLinks {
  const links: ExternalLink[] = [];
  const invalid: string[] = [];
  for (const line of lines) {
    const [label = "", url = "", source = "", date = ""] = line.split("|").map((part) => part.trim());
    if (!label || !url) {
      invalid.push(line);
      continue;
    }
    links.push({ label, url, ...(source ? { source } : {}), ...(date ? { date } : {}) });
  }
  return { links, invalid };
}

export function formatLinkLines(links: readonly ExternalLink[]): string {
  return links
    .map((link) => [link.label, link.url, link.source ?? "", link.date ?? ""].join(" | ").replace(/( \| )+$/, ""))
    .join("\n");
}
