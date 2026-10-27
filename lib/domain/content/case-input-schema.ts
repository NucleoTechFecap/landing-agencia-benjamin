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
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { CASE_LIMITS } from "./case-schema";
import { optionalText, orderField, slugField } from "./cms-schema";

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
    .array(
      z.object({
        label: z.string().trim().min(2, "Dê um nome ao link.").max(80),
        url: z.url({ protocol: /^https$/, error: "Use um link https." }),
      }),
    )
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
  links: { label: string; url: string }[];
  /** Linhas que não seguem "Rótulo | https://…". */
  invalid: string[];
}

/** Uma linha por link, no formato "Rótulo | https://endereço". */
export function parseLinkLines(lines: readonly string[]): ParsedLinks {
  const links: ParsedLinks["links"] = [];
  const invalid: string[] = [];
  for (const line of lines) {
    const [label, ...rest] = line.split("|");
    const url = rest.join("|").trim();
    if (label?.trim() && url) links.push({ label: label.trim(), url });
    else invalid.push(line);
  }
  return { links, invalid };
}

export function formatLinkLines(links: readonly { label: string; url: string }[]): string {
  return links.map((link) => `${link.label} | ${link.url}`).join("\n");
}
