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
