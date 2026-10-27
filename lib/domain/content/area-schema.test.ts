/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : area-schema.test.ts
 Descrição    : Testes da validação da área de atuação no CMS.

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

import { describe, expect, it } from "vitest";
import { areaInputSchema, validateAreaForPublish } from "./area-schema";
import { fieldErrorsOf } from "./cms-schema";

describe("área no CMS (ADM-07)", () => {
  it("rascunho exige só nome e slug e normaliza campos em branco", () => {
    const parsed = areaInputSchema.parse({ name: "Criação", slug: "criacao", summary: "", icon: "", order: "3" });
    expect(parsed).toEqual({
      name: "Criação",
      slug: "criacao",
      summary: undefined,
      description: undefined,
      highlights: [],
      icon: undefined,
      order: 3,
    });
  });

  it("aponta o campo inválido: slug fora do padrão, reservado, ícone fora da lista", () => {
    const result = areaInputSchema.safeParse({ name: "A", slug: "Social Media", icon: "foguete", order: -1 });
    expect(result.success).toBe(false);
    const errors = fieldErrorsOf(result.error!);
    expect(Object.keys(errors).sort()).toEqual(["icon", "name", "order", "slug"]);
    expect(areaInputSchema.safeParse({ name: "Admin", slug: "admin" }).error?.issues[0].message).toMatch(/reservado/);
  });

  it("publicar exige resumo e descrição (TECH-05 §5)", () => {
    const draft = areaInputSchema.parse({ name: "Criação", slug: "criacao" });
    expect(validateAreaForPublish(draft)).toEqual([
      "Resumo: Escreva um resumo (mínimo de 10 caracteres).",
      "Descrição: Escreva a descrição (mínimo de 20 caracteres).",
    ]);
    expect(
      validateAreaForPublish({
        ...draft,
        summary: "Identidade visual e design.",
        description: "Dá forma às ideias com identidade visual e direção criativa.",
      }),
    ).toEqual([]);
  });

  it("limita destaques a 12 itens curtos", () => {
    const many = Array.from({ length: 13 }, (_, index) => `Item ${index}`);
    expect(areaInputSchema.safeParse({ name: "Criação", slug: "criacao", highlights: many }).success).toBe(false);
  });
});
