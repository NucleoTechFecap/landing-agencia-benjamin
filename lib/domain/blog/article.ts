/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : article.ts
 Descrição    : Validação dos dados editoriais de artigos do blog.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 12/11/2026 Codex                     Define regras iniciais de artigos (FUT-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";
import { nameField, optionalText, slugField, uuidField } from "@/lib/domain/content/cms-schema";
import type { MediaRef } from "@/lib/domain/content/types";
import type { PublicationStatus } from "@/lib/domain/content/publication-status";

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  author: string | null;
  topic: string | null;
  cover_media_id: string | null;
  cover?: MediaRef;
  paragraphs: string[];
  status: PublicationStatus;
  published_at: string | null;
  archived_at: string | null;
  updated_at: string;
}

/** Conteúdo estruturado: não aceita HTML como marcação nem URLs de imagens arbitrárias. */
export const articleBlockSchema = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("paragraph"), text: z.string().trim().min(1).max(4000) }),
  z.strictObject({ type: z.literal("heading"), text: z.string().trim().min(1).max(120) }),
  z.strictObject({ type: z.literal("image"), mediaId: uuidField, caption: optionalText(300) }),
  z.strictObject({
    type: z.literal("link"),
    label: z.string().trim().min(1).max(120),
    url: z.url({ protocol: /^https$/, error: "Use um link https." }),
  }),
]);

/** Rascunhos podem ser completados gradualmente; cada bloco presente precisa ser válido. */
export const articleDraftSchema = z.strictObject({
  title: nameField("o título"),
  slug: slugField,
  summary: optionalText(280),
  author: optionalText(120),
  categoryId: uuidField.optional(),
  coverId: uuidField.optional(),
  blocks: z.array(articleBlockSchema).max(100).default([]),
});

/** Regras mínimas para publicar ou salvar um artigo já publicado. */
export const articlePublishSchema = articleDraftSchema
  .extend({
    summary: z.string({ error: "Escreva um resumo." }).trim().min(30, "Use ao menos 30 caracteres.").max(280),
    author: z.string({ error: "Informe a autoria." }).trim().min(2, "Informe a autoria.").max(120),
  })
  .refine((article) => article.blocks.some((block) => block.type === "paragraph"), {
    path: ["blocks"],
    message: "Inclua ao menos um parágrafo.",
  });

export type ArticleDraft = z.output<typeof articleDraftSchema>;
export type ArticleBlock = z.output<typeof articleBlockSchema>;

export function validateArticleForPublish(input: unknown): string[] {
  const result = articlePublishSchema.safeParse(input);
  return result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join(".") || "artigo"}: ${issue.message}`);
}
