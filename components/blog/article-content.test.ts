/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : article-content.test.ts
 Descrição    : Testes de exibição segura do conteúdo editorial.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Testes do blog (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { BlogArticle } from "@/lib/domain/blog/article";
import { ArticleContent } from "./article-content";

const article: BlogArticle = {
  id: "1",
  slug: "artigo-teste",
  title: "Artigo de teste",
  summary: "Resumo",
  author: "Equipe",
  topic: null,
  cover_media_id: null,
  status: "published",
  published_at: "2026-10-01T12:00:00Z",
  archived_at: null,
  updated_at: "2026-10-01T12:00:00Z",
  paragraphs: [
    "## Subtítulo",
    "Leia [a fonte](https://exemplo.com) e <script>alert(1)</script>.",
    "[inseguro](javascript:alert)",
  ],
};

describe("leitura de artigo", () => {
  it("renderiza subtítulo e link seguro e escapa HTML e protocolos inseguros", () => {
    const markup = renderToStaticMarkup(createElement(ArticleContent, { article }));
    expect(markup).toContain(">Subtítulo</h2>");
    expect(markup).toContain('href="https://exemplo.com/"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(markup).not.toContain('href="javascript:');
  });
});
