/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : cms-schema.ts
 Descrição    : Peças comuns de validação dos formulários do CMS (slug, listas, ordem e ícone).

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
import { BRAND_ICONS } from "./icons";
import { RESERVED_SLUGS, SLUG_MAX_LENGTH, SLUG_MIN_LENGTH, SLUG_PATTERN } from "./slug";

/** Slug editável no CMS: mesmas regras de validateSlug() e de is_valid_slug() no banco. */
export const slugField = z
  .string()
  .trim()
  .min(SLUG_MIN_LENGTH, `Use ao menos ${SLUG_MIN_LENGTH} caracteres.`)
  .max(SLUG_MAX_LENGTH, `Use no máximo ${SLUG_MAX_LENGTH} caracteres.`)
  .regex(SLUG_PATTERN, "Use letras minúsculas, números e hífens (ex.: social-media).")
  .refine((slug) => !RESERVED_SLUGS.has(slug), "Este endereço é reservado pelo site. Escolha outro.");

export const nameField = (label: string) =>
  z.string().trim().min(2, `Informe ${label}.`).max(120, "Use no máximo 120 caracteres.");

/** Texto opcional: string vazia vira undefined (campo em branco no formulário). */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use no máximo ${max} caracteres.`)
    .optional()
    .transform((value) => value || undefined);

/** Texto obrigatório para publicar: ausente, curto demais ou longo demais dá a mesma orientação. */
export const requiredText = (message: string, min: number, max: number) =>
  z.string({ error: message }).trim().min(min, message).max(max, `Use no máximo ${max} caracteres.`);

/** Lista de itens curtos (uma linha por item no formulário). */
export const shortList = (maxItems: number, maxLength: number) =>
  z
    .array(z.string().trim().min(1).max(maxLength, `Cada item com no máximo ${maxLength} caracteres.`))
    .max(maxItems, `No máximo ${maxItems} itens.`)
    .default([]);

export const orderField = z.coerce
  .number({ error: "Informe um número." })
  .int("Use um número inteiro.")
  .min(0, "A ordem começa em 0.")
  .max(999, "Use no máximo 999.")
  .default(0);

export const iconField = z
  .enum(BRAND_ICONS, { error: "Escolha um ícone da lista." })
  .optional()
  .or(z.literal("").transform(() => undefined));

/** Mensagens por campo a partir de um erro do Zod (primeiro nível do caminho). */
export function fieldErrorsOf(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) (errors[String(issue.path[0] ?? "form")] ??= []).push(issue.message);
  return errors;
}

/** Problemas de publicação no formato "campo: mensagem", para o painel listar. */
export function publishProblemsOf(error: z.ZodError, labels: Record<string, string>): string[] {
  return error.issues.map((issue) => {
    const field = String(issue.path[0] ?? "");
    return labels[field] ? `${labels[field]}: ${issue.message}` : issue.message;
  });
}
