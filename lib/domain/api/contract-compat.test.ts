/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : contract-compat.test.ts
 Descrição    : Trava de compatibilidade dos campos dos DTOs da API v1.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-11).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { seedSnapshot } from "@/content";
import { toAreaDTO, toCaseCardDTO, toCaseDetailDTO, toCategoryDTO, toServiceDTO } from "./contracts";

/**
 * Trava de compatibilidade da API v1 (TECH-11): remover ou renomear campo de DTO quebra
 * consumidores. Para mudar, crie /api/v2 ou adicione campos novos (mudança aditiva) e
 * atualize as listas abaixo no mesmo PR, registrando no documento de integração.
 */
const V1_FIELDS = {
  area: ["description", "highlights", "icon", "name", "slug", "summary", "url"],
  service: ["areas", "description", "examples", "featured", "icon", "image", "name", "slug", "summary", "url"],
  category: ["description", "name", "slug"],
  caseCard: ["category", "client", "cover", "date", "deliveryType", "featured", "slug", "summary", "title", "url"],
  caseDetailExtra: ["areas", "challenge", "externalLinks", "gallery", "publishedAt", "results", "services", "solution", "team"],
};

const keys = (value: object) => Object.keys(value).sort();

describe("compatibilidade dos DTOs da API v1", () => {
  const { areas, services, categories, cases } = seedSnapshot;

  it("AreaDTO", () => {
    expect(keys(toAreaDTO(areas[0]))).toEqual(V1_FIELDS.area);
  });

  it("ServiceDTO", () => {
    expect(keys(toServiceDTO(services[0], areas))).toEqual(V1_FIELDS.service);
  });

  it("CategoryDTO", () => {
    expect(keys(toCategoryDTO(categories[0]))).toEqual(V1_FIELDS.category);
  });

  it("CaseCardDTO e CaseDetailDTO", () => {
    const card = toCaseCardDTO({ ...cases[0], categoryName: categories[0].name, categorySlug: categories[0].slug });
    expect(keys(card)).toEqual(V1_FIELDS.caseCard);
    const detail = toCaseDetailDTO({ item: cases[0], category: categories[0], services, areas });
    expect(keys(detail)).toEqual([...V1_FIELDS.caseCard, ...V1_FIELDS.caseDetailExtra].sort());
  });
});
