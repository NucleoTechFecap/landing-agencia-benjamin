/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Content
 Arquivo      : content.test.ts
 Descrição    : Valida estrutura, integridade e gate de release do conteúdo provisório.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { validateCaseForPublish } from "../lib/domain/content/case-schema";
import { findIntegrityIssues } from "../lib/domain/content/integrity";
import { isPubliclyVisible } from "../lib/domain/content/visibility";
import { seedSnapshot, siteSettings } from "./index";

describe("conteúdo provisório versionado", () => {
  it("segue a estrutura do MVP: 6 áreas, 9 serviços, 3 categorias e 3 cases", () => {
    expect(seedSnapshot.areas).toHaveLength(6);
    expect(seedSnapshot.services).toHaveLength(9);
    expect(seedSnapshot.categories).toHaveLength(3);
    expect(seedSnapshot.cases).toHaveLength(3);
  });

  it("não tem erros de integridade (TECH-05)", () => {
    const errors = findIntegrityIssues(seedSnapshot).filter((issue) => issue.severity === "error");
    expect(errors).toEqual([]);
  });

  it("todo case publicado atende aos campos de publicação (CASE-11)", () => {
    for (const item of seedSnapshot.cases.filter((entry) => isPubliclyVisible(entry))) {
      const { categoryId, serviceIds, ...rest } = item;
      expect(validateCaseForPublish({ ...rest, categoryId, serviceIds }), item.slug).toEqual([]);
    }
  });

  it("redes sociais oficiais usam https e não carregam parâmetros de rastreamento", () => {
    for (const url of Object.values(siteSettings.socials)) {
      expect(url).toMatch(/^https:\/\//);
      expect(url).not.toMatch(/[?&](stkn|_t|_r)=/);
    }
  });
});

describe.runIf(process.env.RELEASE_GATE === "1")("gate de release (GO-01)", () => {
  it("não há conteúdo provisório publicado", () => {
    const provisional = [
      ...seedSnapshot.areas,
      ...seedSnapshot.services,
      ...seedSnapshot.categories,
      ...seedSnapshot.cases,
      ...seedSnapshot.ctas,
    ]
      .filter((item) => item.provisional && isPubliclyVisible(item))
      .map((item) => item.id);
    const settings = [siteSettings.manifesto.provisional && "manifesto", siteSettings.about.provisional && "sobre"].filter(Boolean);
    expect([...provisional, ...settings]).toEqual([]);
  });
});
