/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : seo-schema.test.ts
 Descrição    : Testes do SEO editável.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { compactSeo, effectiveSeo, parseKeywords, parseSeo, seoFromForm } from "./seo-schema";

const base = { title: "Título padrão", description: "Descrição padrão", keywords: ["padrão"] };

describe("effectiveSeo", () => {
  it("sem nada preenchido, vale o padrão da página", () => {
    expect(effectiveSeo(base)).toMatchObject({
      title: "Título padrão",
      description: "Descrição padrão",
      ogTitle: "Título padrão",
      noindex: false,
    });
  });

  it("o título de compartilhamento segue o de busca, até ter um próprio", () => {
    expect(effectiveSeo(base, { title: "Novo" }).ogTitle).toBe("Novo");
    expect(effectiveSeo(base, { title: "Novo", ogTitle: "Social" }).ogTitle).toBe("Social");
  });
});

describe("compactSeo", () => {
  it("campo em branco não é gravado", () => {
    expect(compactSeo({ title: "  ", keywords: [], noindex: false })).toEqual({});
  });
});

describe("parseSeo", () => {
  it("valor inválido no banco não derruba a página", () => {
    const { seo, problems } = parseSeo({ ogImage: { src: "https://golpe.com/a.png", alt: "" } });
    expect(seo).toEqual({});
    expect(problems.length).toBeGreaterThan(0);
  });

  it("imagem da biblioteca passa", () => {
    expect(parseSeo({ ogImage: { src: "/brand/og.png", alt: "Capa" } }).seo.ogImage?.src).toBe("/brand/og.png");
  });
});

describe("formulário", () => {
  it("palavras-chave separadas por vírgula ou linha", () => {
    expect(parseKeywords("a, b\nc,, ")).toEqual(["a", "b", "c"]);
  });

  it("recusa título longo demais", () => {
    const parsed = seoFromForm({
      title: "x".repeat(121),
      description: "",
      keywords: "",
      noindex: false,
      ogTitle: "",
      ogDescription: "",
    });
    expect(parsed.success).toBe(false);
  });
});
