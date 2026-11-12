/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : formatting.test.ts
 Descrição    : Testes de formatação segura de artigos.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Testes de formatação (FUT-10).
════════════════════════════════════════════════════════════════════════════════
*/
import { describe, expect, it } from "vitest";
import { articleInline, articleLine } from "./formatting";

describe("formatação de artigos", () => {
  it("reconhece títulos e links https", () => {
    expect(articleLine("## Uma ideia")).toEqual({ kind: "heading", content: [{ text: "Uma ideia" }] });
    expect(articleInline("Leia [a fonte](https://exemplo.com/artigo).")).toEqual([
      { text: "Leia " },
      { text: "a fonte", href: "https://exemplo.com/artigo" },
      { text: "." },
    ]);
  });
  it("mantém endereços inseguros, credenciais e HTML como texto", () => {
    const text = "[x](javascript:alert) [y](https://nome:senha@exemplo.com) <script>alert(1)</script>";
    expect(articleInline(text)).toEqual([
      { text: "[x](javascript:alert) " },
      { text: "[y](https://nome:senha@exemplo.com)" },
      { text: " <script>alert(1)</script>" },
    ]);
  });
});
