/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : article.test.ts
 Descrição    : Testes das regras editoriais dos artigos do blog.

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
 12/11/2026 Codex                     Cobre as regras iniciais dos artigos (FUT-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { articleDraftSchema, articlePublishSchema } from "./article";

const article = {
  title: "Comunicação e criatividade",
  slug: "comunicacao-e-criatividade",
  summary: "Um resumo de exemplo para demonstrar o fluxo editorial.",
  author: "Equipe editorial",
  blocks: [{ type: "paragraph", text: "Texto de exemplo para um artigo." }],
};

describe("artigos do blog", () => {
  it("permite criar rascunho incompleto, mas não publicá-lo", () => {
    const draft = { title: article.title, slug: article.slug };
    expect(articleDraftSchema.safeParse(draft).success).toBe(true);
    expect(articlePublishSchema.safeParse(draft).success).toBe(false);
  });

  it("aceita um artigo completo e exige parágrafo, autoria e resumo", () => {
    expect(articlePublishSchema.safeParse(article).success).toBe(true);
    expect(articlePublishSchema.safeParse({ ...article, blocks: [{ type: "heading", text: "Título" }] }).success).toBe(
      false,
    );
    expect(articlePublishSchema.safeParse({ ...article, author: " " }).success).toBe(false);
    expect(articlePublishSchema.safeParse({ ...article, summary: "Curto" }).success).toBe(false);
  });

  it("rejeita slug reservado, imagens fora da biblioteca e links sem https", () => {
    expect(articleDraftSchema.safeParse({ ...article, slug: "admin" }).success).toBe(false);
    expect(
      articleDraftSchema.safeParse({ ...article, blocks: [{ type: "image", mediaId: "https://exemplo.com" }] }).success,
    ).toBe(false);
    expect(
      articleDraftSchema.safeParse({
        ...article,
        blocks: [{ type: "link", label: "Leia", url: "javascript:alert(1)" }],
      }).success,
    ).toBe(false);
    expect(articleDraftSchema.safeParse({ ...article, blocks: [{ type: "html", text: "<script>" }] }).success).toBe(
      false,
    );
  });
});
