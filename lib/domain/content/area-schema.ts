/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : area-schema.ts
 Descrição    : Validação de rascunho e publicação da área de atuação no CMS.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import {
  iconField,
  nameField,
  optionalText,
  orderField,
  publishProblemsOf,
  requiredText,
  shortList,
  slugField,
} from "./cms-schema";

/** Limites da área (TECH-05 §5; colunas de public.areas). */
export const AREA_LIMITS = { summary: 200, description: 4000, highlights: 12, highlight: 80 } as const;

/** Rascunho: nome e slug bastam para salvar; o restante pode vir depois. */
export const areaInputSchema = z.object({
  name: nameField("o nome da área"),
  slug: slugField,
  summary: optionalText(AREA_LIMITS.summary),
  description: optionalText(AREA_LIMITS.description),
  highlights: shortList(AREA_LIMITS.highlights, AREA_LIMITS.highlight),
  icon: iconField,
  order: orderField,
});

export type AreaInput = z.output<typeof areaInputSchema>;

const areaPublishSchema = areaInputSchema.extend({
  summary: requiredText("Escreva um resumo (mínimo de 10 caracteres).", 10, AREA_LIMITS.summary),
  description: requiredText("Escreva a descrição (mínimo de 20 caracteres).", 20, AREA_LIMITS.description),
});

export const AREA_FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  slug: "Endereço (slug)",
  summary: "Resumo",
  description: "Descrição",
  highlights: "Destaques",
  icon: "Ícone",
  order: "Ordem",
};

/** O que falta para publicar a área (vazio = pode publicar). */
export function validateAreaForPublish(area: { [K in keyof AreaInput]?: unknown }): string[] {
  const result = areaPublishSchema.safeParse({
    ...area,
    summary: area.summary || undefined,
    description: area.description || undefined,
  });
  return result.success ? [] : publishProblemsOf(result.error, AREA_FIELD_LABELS);
}
