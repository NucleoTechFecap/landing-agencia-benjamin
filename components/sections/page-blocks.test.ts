/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : page-blocks.test.ts
 Descrição    : Testes de renderização dos blocos de página no site.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Site lê páginas e blocos publicados no CMS (INT-03).
 01/11/2026 Vinícius Nishimura Reis  Seção Nosso time como bloco opcional (SOB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Page } from "@/lib/domain/content/types";
import { PageBlocks } from "./page-blocks";

const page = (blocks: Page["blocks"], provisional = false): Page => ({
  id: "p1",
  slug: "sobre",
  title: "Sobre",
  status: "published",
  publishedAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  provisional,
  blocks,
});

const render = (value: Page | null) => renderToStaticMarkup(createElement(PageBlocks, { page: value }));

describe("blocos de página no site (INT-03)", () => {
  it("sem página, sem blocos ou só com seção fixa, não renderiza nada", () => {
    expect(render(null)).toBe("");
    expect(render(page([]))).toBe("");
    expect(
      render(page([{ id: "b1", type: "manifesto", content: { title: "M", paragraphs: ["P"] }, order: 0 }], true)),
    ).toBe("");
  });

  it("título opcional ausente não deixa aria-labelledby apontando para o vazio", () => {
    const markup = render(page([{ id: "b1", type: "rich-text", content: { paragraphs: ["Só texto."] }, order: 0 }]));
    expect(markup).toContain("Só texto.");
    expect(markup).not.toContain("aria-labelledby");
    expect(markup).not.toContain("<h2");
  });

  it("escapa o conteúdo: nada vindo do banco vira HTML", () => {
    const markup = render(
      page([{ id: "b1", type: "rich-text", content: { paragraphs: ["<script>alert(1)</script>"] }, order: 0 }]),
    );
    expect(markup).not.toContain("<script>");
    expect(markup).toContain("&lt;script&gt;");
  });

  it("lista só mostra o texto do item quando existe", () => {
    const markup = render(
      page([
        {
          id: "b1",
          type: "list",
          content: { title: "Diferenciais", items: [{ title: "Com texto", text: "Detalhe." }, { title: "Sem texto" }] },
          order: 0,
        },
      ]),
    );
    expect(markup).toContain("Detalhe.");
    expect(markup.match(/<p /g)).toHaveLength(1);
  });

  it("chamada para fora abre em nova aba; para dentro, não", () => {
    const cta = (href: string) =>
      render(page([{ id: "b1", type: "cta", content: { title: "T", label: "Ir", href }, order: 0 }]));
    expect(cta("https://www.fecap.br")).toContain('target="_blank"');
    expect(cta("/contato")).not.toContain('target="_blank"');
  });

  it("página provisória mostra o selo", () => {
    const blocks: Page["blocks"] = [{ id: "b1", type: "rich-text", content: { paragraphs: ["Texto."] }, order: 0 }];
    expect(render(page(blocks, true))).toContain("Conteúdo provisório");
    expect(render(page(blocks, false))).not.toContain("Conteúdo provisório");
  });

  describe("Nosso time (SOB-03)", () => {
    const team = (members: unknown[], title?: string) =>
      render(page([{ id: "b1", type: "team", content: { title, members }, order: 0 } as Page["blocks"][number]]));

    it("usa o título padrão e mantém a ordem definida no painel", () => {
      const markup = team([{ name: "Pessoa Um", role: "Direção" }, { name: "Pessoa Dois" }]);
      expect(markup).toContain("Nosso time");
      expect(markup.indexOf("Pessoa Um")).toBeLessThan(markup.indexOf("Pessoa Dois"));
    });

    it("não inventa cargo nem foto de quem não tem", () => {
      const markup = team([{ name: "Pessoa Dois" }]);
      expect(markup).not.toContain("<img");
      expect(markup.match(/<p[ >]/g)).toBeNull();
    });

    it("mostra a foto com o texto alternativo", () => {
      const markup = team([{ name: "Pessoa Um", photo: { src: "/brand/foto.jpg", alt: "Pessoa Um sorrindo" } }]);
      expect(markup).toContain('alt="Pessoa Um sorrindo"');
    });

    it("foto de host fora da configuração de imagens não derruba a página", () => {
      const markup = team([{ name: "Pessoa Um", photo: { src: "https://outro.exemplo.com/foto.jpg", alt: "Foto" } }]);
      expect(markup).toContain('src="https://outro.exemplo.com/foto.jpg"');
    });

    it("título próprio substitui o padrão", () => {
      expect(team([{ name: "Pessoa Um" }], "Quem faz a Benjamin")).not.toContain("Nosso time");
    });
  });
});
