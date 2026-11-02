/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : block-input.test.ts
 Descrição    : Testes do formulário de blocos e de onde cada bloco pode entrar.

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
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import {
  blockContentFromForm,
  blockFormValues,
  blockSummary,
  filledMembers,
  formatItemLines,
  parseItemLines,
  type BlockFormInput,
} from "./block-input";
import { BLOCK_SCHEMAS, addableBlockTypes, blockRestriction, parseBlock, type PageBlock } from "./blocks";

const input = (partial: Partial<BlockFormInput> = {}): BlockFormInput => ({
  fields: {},
  paragraphs: [],
  items: [],
  members: [],
  ...partial,
});

const block = (type: PageBlock["type"], content: unknown): PageBlock => {
  const parsed = parseBlock({ id: "b1", type, content, order: 0 });
  if (!parsed.ok) throw new Error(parsed.problem);
  return parsed.block;
};

describe("formulário de blocos (ADM-05)", () => {
  it("lê e reescreve a lista no formato Título | texto", () => {
    const items = parseItemLines(["Estratégia | Do briefing à entrega", "Sem texto", "Com | barra | no texto"]);
    expect(items).toEqual([
      { title: "Estratégia", text: "Do briefing à entrega" },
      { title: "Sem texto" },
      { title: "Com", text: "barra | no texto" },
    ]);
    expect(formatItemLines(items)).toBe("Estratégia | Do briefing à entrega\nSem texto\nCom | barra | no texto");
  });

  it("campo opcional em branco não vira texto vazio: o conteúdo passa na validação", () => {
    const content = blockContentFromForm(
      "cta",
      input({ fields: { title: "Vamos?", text: "  ", label: "Falar", href: "/contato" } }),
    );
    const parsed = BLOCK_SCHEMAS.cta.parse(content);
    expect(parsed).toEqual({ title: "Vamos?", label: "Falar", href: "/contato" });
  });

  it("obrigatório em branco falha com mensagem em português", () => {
    const result = BLOCK_SCHEMAS.about.safeParse(blockContentFromForm("about", input({ fields: { title: "Sobre" } })));
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain("Preencha este campo.");
  });

  it("ignora linha de pessoa toda em branco, mas não a que só tem cargo", () => {
    const members = [
      { name: "Ana", role: "", photoId: "" },
      { name: " ", role: " ", photoId: "" },
      { name: "", role: "Direção", photoId: "" },
    ];
    expect(filledMembers(members)).toEqual([members[0], members[2]]);
  });

  it.each([
    ["rich-text", { title: "Título", paragraphs: ["Um", "Dois"] }, { title: "Título", paragraphs: "Um\nDois" }],
    ["list", { items: [{ title: "A", text: "B" }] }, { title: "", items: "A | B" }],
    ["cta", { title: "T", label: "L", href: "/contato" }, { title: "T", text: "", label: "L", href: "/contato" }],
    ["manifesto", { title: "M", paragraphs: ["P"] }, { title: "M", paragraphs: "P" }],
  ] as const)("devolve ao formulário o que foi salvo em %s", (type, content, expected) => {
    expect(blockFormValues(block(type, content))).toEqual(expected);
  });

  it("resume o bloco em uma linha curta", () => {
    expect(blockSummary(block("rich-text", { paragraphs: ["x".repeat(200)] }))).toHaveLength(91);
    expect(blockSummary(block("team", { members: [{ name: "Ana" }] }))).toBe("1 pessoa(s)");
    expect(blockSummary(block("cta", { title: "T", label: "L", href: "/contato" }))).toBe("T → /contato");
  });
});

describe("onde cada bloco pode entrar (ADM-05)", () => {
  const manifesto = block("manifesto", { title: "M", paragraphs: ["P"] });

  it("manifesto só na Home e uma vez", () => {
    expect(blockRestriction("manifesto", "home", [])).toBeNull();
    expect(blockRestriction("manifesto", "sobre", [])).toMatch(/só existe na página Home/);
    expect(blockRestriction("manifesto", "home", [manifesto])).toMatch(/já tem o bloco/);
  });

  it("sobre só na página Sobre; os demais em qualquer página, quantas vezes for", () => {
    expect(addableBlockTypes("sobre", [])).toEqual(["rich-text", "list", "team", "cta", "about"]);
    expect(addableBlockTypes("home", [manifesto])).toEqual(["rich-text", "list", "team", "cta"]);
    expect(addableBlockTypes("contato", [])).toEqual(["rich-text", "list", "team", "cta"]);
  });
});
