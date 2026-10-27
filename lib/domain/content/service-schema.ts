/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : service-schema.ts
 Descrição    : Validação de rascunho e publicação do serviço no CMS.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-06).
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

/** Limites do serviço (TECH-05 §5; colunas de public.services). */
export const SERVICE_LIMITS = { summary: 200, description: 4000, examples: 12, example: 120, areas: 6 } as const;

const uuid = z.string().uuid("Seleção inválida.");

/** Rascunho: nome e slug bastam para salvar. */
export const serviceInputSchema = z.object({
  name: nameField("o nome do serviço"),
  slug: slugField,
  summary: optionalText(SERVICE_LIMITS.summary),
  description: optionalText(SERVICE_LIMITS.description),
  examples: shortList(SERVICE_LIMITS.examples, SERVICE_LIMITS.example),
  areaIds: z.array(uuid).max(SERVICE_LIMITS.areas, `No máximo ${SERVICE_LIMITS.areas} áreas.`).default([]),
  icon: iconField,
  /** Imagem da biblioteca de mídia (ADM-09); vazio = sem imagem. */
  imageId: uuid.optional().or(z.literal("").transform(() => undefined)),
  featured: z.boolean().default(false),
  order: orderField,
});

export type ServiceInput = z.output<typeof serviceInputSchema>;

const servicePublishSchema = serviceInputSchema.extend({
  summary: requiredText("Escreva um resumo (mínimo de 10 caracteres).", 10, SERVICE_LIMITS.summary),
  description: requiredText("Escreva a descrição (mínimo de 20 caracteres).", 20, SERVICE_LIMITS.description),
  areaIds: z.array(uuid).min(1, "Vincule ao menos uma área de atuação.").max(SERVICE_LIMITS.areas),
});

export const SERVICE_FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  slug: "Endereço (slug)",
  summary: "Resumo",
  description: "Descrição",
  examples: "Exemplos",
  areaIds: "Áreas",
  icon: "Ícone",
  imageId: "Imagem",
  featured: "Destaque na Home",
  order: "Ordem",
};

/** O que falta para publicar o serviço (vazio = pode publicar). Áreas publicadas: regra R05 (aviso). */
export function validateServiceForPublish(service: { [K in keyof ServiceInput]?: unknown }): string[] {
  const result = servicePublishSchema.safeParse({
    ...service,
    summary: service.summary || undefined,
    description: service.description || undefined,
  });
  return result.success ? [] : publishProblemsOf(result.error, SERVICE_FIELD_LABELS);
}
