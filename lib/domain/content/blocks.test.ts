/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : blocks.test.ts
 Descrição    : Testes do catálogo de blocos das páginas editáveis.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { BLOCK_TYPES, pagePath, parseBlock } from "./blocks";

const block = (type: string, content: unknown) => ({ id: "b1", type, content, order: 1 });

describe("catálogo de blocos (DB-03)", () => {
  it("aceita um exemplo válido de cada tipo", () => {
    const examples: Record<string, unknown> = {
      "rich-text": { title: "Quem somos", paragraphs: ["Primeiro parágrafo.", "Segundo."] },
      list: { items: [{ title: "Prática real", text: "Clientes de verdade." }] },
      team: { members: [{ name: "Melissa Namie", role: "Diretoria" }] },
      cta: { title: "Vamos conversar?", label: "Fale com a gente", href: "/contato#formulario" },
    };
    expect(Object.keys(examples).sort()).toEqual([...BLOCK_TYPES].sort());
    for (const [type, content] of Object.entries(examples)) {
      expect(parseBlock(block(type, content)), type).toMatchObject({ ok: true, block: { type, order: 1 } });
    }
  });

  it("descarta tipo desconhecido e conteúdo fora do formato", () => {
    expect(parseBlock(block("html", { html: "<script>" }))).toEqual({
      ok: false,
      problem: "Tipo de bloco desconhecido: html.",
    });
    expect(parseBlock(block("rich-text", { paragraphs: [] }))).toMatchObject({ ok: false });
    expect(parseBlock(block("list", "texto solto"))).toMatchObject({ ok: false });
  });

  it("CTA só aponta para rota pública conhecida ou link https", () => {
    const cta = (href: string) => parseBlock(block("cta", { title: "Título", label: "Ir", href }));
    expect(cta("/servicos/social-media")).toMatchObject({ ok: true });
    expect(cta("https://www.fecap.br")).toMatchObject({ ok: true });
    expect(cta("/admin")).toMatchObject({ ok: false });
    expect(cta("http://inseguro.com")).toMatchObject({ ok: false });
    expect(cta("javascript:alert(1)")).toMatchObject({ ok: false });
  });

  it("foto do time aceita só caminho público ou https, sempre com texto alternativo", () => {
    const team = (photo: unknown) => parseBlock(block("team", { members: [{ name: "Renan Hida", photo }] }));
    expect(team({ src: "/brand/time/renan.webp", alt: "Renan sorrindo" })).toMatchObject({ ok: true });
    expect(team({ src: "//evil.com/x.png", alt: "x" })).toMatchObject({ ok: false });
    expect(team({ src: "/brand/time/renan.webp" })).toMatchObject({ ok: false });
  });

  it("relaciona páginas às rotas fixas do site", () => {
    expect(pagePath("sobre")).toBe("/sobre");
    expect(pagePath("privacidade")).toBe("/privacidade");
    expect(pagePath("landing-campanha")).toBeNull();
    expect(pagePath("toString")).toBeNull();
  });
});
