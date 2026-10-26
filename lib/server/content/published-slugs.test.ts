/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : published-slugs.test.ts
 Descrição    : Testes da verificação de slugs publicados.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 26/10/2026 Vinícius Nishimura Reis  Parâmetro estático para banco vazio (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { PLACEHOLDER_SLUG, publishedSlugExists, toStaticParams } from "./published-slugs";

describe("publishedSlugExists", () => {
  it("reconhece serviços e cases publicados", async () => {
    expect(await publishedSlugExists("servicos", "audiovisual")).toBe(true);
    expect(await publishedSlugExists("cases", "meridiano")).toBe(true);
  });

  it("recusa slug inexistente, mal formatado ou de outro tipo", async () => {
    expect(await publishedSlugExists("servicos", "nao-existe")).toBe(false);
    expect(await publishedSlugExists("servicos", "Admin")).toBe(false);
    expect(await publishedSlugExists("cases", "audiovisual")).toBe(false);
  });

  it("recusa itens ainda não publicados na data", async () => {
    expect(await publishedSlugExists("cases", "meridiano", new Date("2020-01-01T00:00:00Z"))).toBe(false);
  });
});

describe("toStaticParams (DB-03)", () => {
  it("gera um parâmetro por slug publicado", () => {
    expect(toStaticParams(["meridiano", "fecap"])).toEqual([{ slug: "meridiano" }, { slug: "fecap" }]);
  });

  it("com banco vazio devolve um slug impossível, que responde 404", async () => {
    expect(toStaticParams([])).toEqual([{ slug: PLACEHOLDER_SLUG }]);
    expect(await publishedSlugExists("cases", PLACEHOLDER_SLUG)).toBe(false);
  });
});
