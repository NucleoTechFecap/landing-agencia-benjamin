/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : theme.test.ts
 Descrição    : Testes da aparência: CSS gerado, compactação e contraste.

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
import {
  THEME_COLORS,
  THEME_COLOR_NAMES,
  compactTheme,
  contrastProblems,
  contrastRatio,
  parseTheme,
  themeCss,
} from "./theme";

describe("themeCss", () => {
  it("sem nada diferente da marca, não gera CSS", () => {
    expect(themeCss(undefined)).toBe("");
    expect(themeCss({})).toBe("");
  });

  it("sobrescreve só a variável da cor alterada", () => {
    expect(themeCss({ colors: { verde: "#112233" } })).toBe(":root{--color-benja-verde:#112233}");
  });

  it("nada digitado vira CSS livre", () => {
    const css = themeCss({ colors: { verde: "#000000;} body{display:none} a{color:#000" } });
    expect(css).toBe("");
  });

  it("a fonte dos títulos só afeta os títulos", () => {
    expect(themeCss({ fontHeading: "playfair" })).toContain("h1,h2,h3,h4,h5,h6{font-family:var(--font-playfair)");
    expect(themeCss({ fontBody: "inter" })).toContain("--font-sans:var(--font-inter)");
  });
});

describe("parseTheme", () => {
  it("tema inválido vira a identidade padrão, sem derrubar o site", () => {
    const { theme, problems } = parseTheme({ colors: { verde: "url(javascript:alert(1))" } });
    expect(theme).toEqual({});
    expect(problems.length).toBeGreaterThan(0);
  });

  it("recusa fonte fora da lista e imagem de outro host", () => {
    expect(parseTheme({ fontBody: "comic-sans" }).theme).toEqual({});
    expect(parseTheme({ images: { logoHeader: { src: "https://golpe.com/a.png", alt: "" } } }).theme).toEqual({});
  });
});

describe("compactTheme", () => {
  it("o que é igual à marca não é gravado", () => {
    expect(compactTheme({ colors: { verde: THEME_COLORS.verde.value }, fontBody: "poppins" })).toEqual({});
  });

  it("a fonte dos títulos igual à do texto não é gravada", () => {
    expect(compactTheme({ fontBody: "inter", fontHeading: "inter" })).toEqual({ fontBody: "inter" });
  });
});

describe("contraste", () => {
  it("calcula a razão da WCAG", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });

  it("a identidade da marca passa em todas as combinações", () => {
    expect(contrastProblems({})).toEqual([]);
  });

  it("abaixo de 3:1 bloqueia, entre 3:1 e 4,5:1 só avisa", () => {
    const blocked = contrastProblems({ colors: { verde: "#f1fcd0" } });
    expect(blocked.some((problem) => problem.blocking)).toBe(true);
    const warned = contrastProblems({ colors: { noite: "#8a8a8a" } }).find(
      (problem) => problem.background === "nyanza",
    );
    expect(warned?.blocking).toBe(false);
  });

  it("toda cor tem valor padrão válido", () => {
    for (const name of THEME_COLOR_NAMES) expect(THEME_COLORS[name].value).toMatch(/^#[0-9a-f]{6}$/);
  });
});
