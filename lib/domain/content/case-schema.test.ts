/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : case-schema.test.ts
 Descrição    : Testes dos campos obrigatórios e regras de publicação do case.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (CASE-11).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { caseDraftSchema, validateCaseForPublish } from "./case-schema";

const NOW = new Date("2026-10-13T12:00:00Z");
const complete = {
  title: "Blog Aventura de Construir",
  slug: "aventura-de-construir",
  client: "Aventura de Construir",
  categoryId: "copywriting",
  serviceIds: ["copywriting"],
  summary: "Artigos estratégicos para o blog, com pauta, pesquisa e revisão editorial.",
  cover: { src: "/brand/cases/aventura.webp", alt: "Capa do blog Aventura de Construir" },
};

describe("case — rascunho", () => {
  it("salva só com título e slug", () => {
    const result = caseDraftSchema.safeParse({ title: "Meridiano", slug: "meridiano" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ status: "draft", serviceIds: [], gallery: [] });
  });

  it("valida o slug mesmo no rascunho", () => {
    expect(caseDraftSchema.safeParse({ title: "Meridiano", slug: "Meridiano!" }).success).toBe(false);
  });
});

describe("case — publicação", () => {
  it("aceita case completo sem desafio/solução/resultados/data/equipe", () => {
    expect(validateCaseForPublish(complete, NOW)).toEqual([]);
  });

  it("lista campos obrigatórios ausentes", () => {
    const problems = validateCaseForPublish({ title: "FECAP", slug: "fecap" }, NOW);
    const fields = problems.map((problem) => problem.split(":")[0]);
    expect(fields).toEqual(expect.arrayContaining(["client", "categoryId", "serviceIds", "summary", "cover"]));
  });

  it("exige texto alternativo em capa e galeria", () => {
    const problems = validateCaseForPublish(
      { ...complete, cover: { src: "/x.webp", alt: "" }, gallery: [{ src: "/y.webp", alt: "" }] },
      NOW,
    );
    expect(problems.some((problem) => problem.startsWith("cover.alt"))).toBe(true);
    expect(problems.some((problem) => problem.startsWith("gallery.0.alt"))).toBe(true);
  });

  it("recusa data futura e link sem https", () => {
    const problems = validateCaseForPublish(
      { ...complete, date: "2027-01", externalLinks: [{ label: "Blog", url: "http://exemplo.com" }] },
      NOW,
    );
    expect(problems.some((problem) => problem.startsWith("date"))).toBe(true);
    expect(problems.some((problem) => problem.startsWith("externalLinks.0.url"))).toBe(true);
  });
});
