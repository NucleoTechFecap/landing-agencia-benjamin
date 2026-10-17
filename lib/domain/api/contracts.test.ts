/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : contracts.test.ts
 Descrição    : Testes de paginação, validação de query e DTOs públicos.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { area, caseStudy, service } from "../content/__fixtures__/snapshot";
import { caseQuerySchema, paginate, toCaseCardDTO, toServiceDTO } from "./contracts";

describe("paginação", () => {
  it("calcula meta e fatia os itens", () => {
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual({
      data: [3, 4],
      meta: { page: 2, pageSize: 2, total: 5, totalPages: 3 },
    });
  });

  it("retorna página vazia além do fim e totalPages mínimo 1", () => {
    expect(paginate([], 3, 10)).toEqual({ data: [], meta: { page: 3, pageSize: 10, total: 0, totalPages: 1 } });
  });
});

describe("validação de query", () => {
  it("aplica padrões e converte números", () => {
    expect(caseQuerySchema.parse({ page: "2" })).toMatchObject({ page: 2, pageSize: 12 });
  });

  it("rejeita pageSize acima do máximo e slug inválido", () => {
    expect(caseQuerySchema.safeParse({ pageSize: "500" }).success).toBe(false);
    expect(caseQuerySchema.safeParse({ category: "../admin" }).success).toBe(false);
  });
});

describe("DTOs públicos", () => {
  it("não expõem id interno, status nem campos de controle", () => {
    const dto = toServiceDTO(service("svc-1", ["area-1"], { slug: "audiovisual" }), [
      area("area-1", { slug: "criacao" }),
    ]);
    expect(dto).not.toHaveProperty("id");
    expect(dto).not.toHaveProperty("status");
    expect(dto).not.toHaveProperty("provisional");
    expect(dto).toMatchObject({ slug: "audiovisual", areas: ["criacao"], url: "/servicos/audiovisual" });
  });

  it("monta card de case com categoria resolvida", () => {
    const dto = toCaseCardDTO({
      ...caseStudy("case-1", "cat", ["svc"], { slug: "fecap" }),
      categoryName: "Assessoria",
      categorySlug: "assessoria",
    });
    expect(dto.category).toEqual({ slug: "assessoria", name: "Assessoria" });
    expect(dto.url).toBe("/cases/fecap");
  });
});
