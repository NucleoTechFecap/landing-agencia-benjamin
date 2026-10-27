/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : case-input-schema.test.ts
 Descrição    : Testes do formulário de case e categoria do CMS.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
 26/10/2026 Vinícius Nishimura Reis  Veículo e data nos links de clipping (CASE-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { caseInputSchema, formatLinkLines, parseLinkLines } from "./case-input-schema";
import { categoryInputSchema } from "./category-schema";

const id = "8b4f6a52-6c43-4a8f-9d55-2f5a2f6f0c11";

describe("case no CMS (ADM-08)", () => {
  it("rascunho exige só título e slug; vazios viram ausentes", () => {
    expect(
      caseInputSchema.parse({ title: "Meridiano", slug: "meridiano", coverId: "", categoryId: "", date: "" }),
    ).toMatchObject({
      title: "Meridiano",
      coverId: undefined,
      categoryId: undefined,
      date: undefined,
      serviceIds: [],
      galleryIds: [],
      externalLinks: [],
      team: [],
    });
  });

  it("valida ids, mês e links https", () => {
    const result = caseInputSchema.safeParse({
      title: "Meridiano",
      slug: "meridiano",
      coverId: "capa",
      date: "2026-13",
      externalLinks: [{ label: "Post", url: "http://x.com" }],
    });
    expect(result.error?.issues.map((issue) => issue.path[0]).sort()).toEqual(["coverId", "date", "externalLinks"]);
    expect(caseInputSchema.safeParse({ title: "M", slug: "meridiano", categoryId: id, serviceIds: [id] }).success).toBe(
      false,
    );
  });

  it("links: uma linha por link no formato Rótulo | https://…", () => {
    expect(parseLinkLines(["Matéria no G1 | https://g1.globo.com/x", "sem separador", "Só rótulo |"])).toEqual({
      links: [{ label: "Matéria no G1", url: "https://g1.globo.com/x" }],
      invalid: ["sem separador", "Só rótulo |"],
    });
    expect(formatLinkLines([{ label: "Post", url: "https://instagram.com/p/1" }])).toBe(
      "Post | https://instagram.com/p/1",
    );
  });
});

describe("categoria no CMS (ADM-08)", () => {
  it("nome e slug bastam; descrição opcional", () => {
    expect(categoryInputSchema.parse({ name: "Copywriting", slug: "copywriting", description: "" })).toEqual({
      name: "Copywriting",
      slug: "copywriting",
      description: undefined,
      order: 0,
    });
  });
});

describe("links de imprensa com veículo e data (CASE-10)", () => {
  it("lê veículo e data opcionais e formata de volta sem perder nada", () => {
    const lines = [
      "Matéria no portal | https://exemplo.com.br/materia | Estadão | 2026-09-15",
      "Release no site | https://www.fecap.br/release",
      "Nota | https://exemplo.com.br/nota | | 2026-08-01",
    ];
    const { links, invalid } = parseLinkLines(lines);
    expect(invalid).toEqual([]);
    expect(links).toEqual([
      { label: "Matéria no portal", url: "https://exemplo.com.br/materia", source: "Estadão", date: "2026-09-15" },
      { label: "Release no site", url: "https://www.fecap.br/release" },
      { label: "Nota", url: "https://exemplo.com.br/nota", date: "2026-08-01" },
    ]);
    expect(formatLinkLines(links)).toBe(
      [
        "Matéria no portal | https://exemplo.com.br/materia | Estadão | 2026-09-15",
        "Release no site | https://www.fecap.br/release",
        "Nota | https://exemplo.com.br/nota |  | 2026-08-01",
      ].join("\n"),
    );
  });

  it("valida a data de calendário e o tamanho do veículo", () => {
    const parse = (link: object) =>
      caseInputSchema.safeParse({
        title: "FECAP",
        slug: "fecap",
        externalLinks: [{ label: "Matéria", url: "https://x.com.br", ...link }],
      });
    expect(parse({ source: "Folha", date: "2026-09-15" }).success).toBe(true);
    expect(parse({ date: "2026-02-30" }).success).toBe(false);
    expect(parse({ date: "15/09/2026" }).success).toBe(false);
    expect(parse({ source: "F" }).success).toBe(false);
  });
});
