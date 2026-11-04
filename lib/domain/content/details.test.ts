/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : details.test.ts
 Descrição    : Testes do detalhe de serviço e de case usado pelo site e pela prévia.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-14).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { caseDetailOf, pickOtherServices, pickRelatedCases, serviceDetailOf, type CaseCard } from "./details";
import type { Area, CaseCategory, CaseStudy, ContentSnapshot, Service } from "./types";

const NOW = new Date("2026-11-04T12:00:00.000Z");
const live = { status: "published" as const, publishedAt: "2026-10-01T00:00:00.000Z", order: 0 };
const draft = { status: "draft" as const, publishedAt: null, order: 0 };
const area = (id: string, over = {}) => ({ id, slug: id, name: id, ...live, ...over }) as unknown as Area;
const category = (id: string, over = {}) => ({ id, slug: id, name: id, ...live, ...over }) as unknown as CaseCategory;
const service = (id: string, over = {}) =>
  ({ id, slug: id, name: id, areaIds: [], ...live, ...over }) as unknown as Service;
const study = (id: string, over = {}) =>
  ({ id, slug: id, title: id, categoryId: "cat", serviceIds: [], ...live, ...over }) as unknown as CaseStudy;
const snapshot = (over: Partial<ContentSnapshot>): ContentSnapshot => ({
  areas: [],
  services: [],
  categories: [],
  cases: [],
  ctas: [],
  ...over,
});

describe("serviceDetailOf", () => {
  it("aceita serviço em rascunho e mantém a regra pública nos vínculos", () => {
    const target = service("s1", { ...draft, areaIds: ["a1", "a2"] });
    const detail = serviceDetailOf(
      snapshot({
        areas: [area("a1"), area("a2", draft), area("fora")],
        categories: [category("cat")],
        cases: [study("c1", { serviceIds: ["s1"] }), study("c2", { ...draft, serviceIds: ["s1"] }), study("c3")],
      }),
      target,
      NOW,
    );
    expect(detail.service).toBe(target);
    expect(detail.areas.map((item) => item.id)).toEqual(["a1"]);
    expect(detail.cases).toMatchObject([{ id: "c1", categoryName: "cat", categorySlug: "cat" }]);
  });

  it("case com categoria não publicada entra sem nome de categoria", () => {
    const detail = serviceDetailOf(
      snapshot({
        categories: [category("cat", draft)],
        cases: [study("c1", { serviceIds: ["s1"] })],
      }),
      service("s1"),
      NOW,
    );
    expect(detail.cases[0]).toMatchObject({ categoryName: "", categorySlug: "" });
  });

  it("item com data futura não conta como visível", () => {
    const future = { publishedAt: "2099-01-01T00:00:00.000Z" };
    const detail = serviceDetailOf(
      snapshot({ areas: [area("a1", future)], cases: [study("c1", { ...future, serviceIds: ["s1"] })] }),
      service("s1", { areaIds: ["a1"] }),
      NOW,
    );
    expect(detail.areas).toEqual([]);
    expect(detail.cases).toEqual([]);
  });
});

describe("caseDetailOf", () => {
  it("aceita case em rascunho e traz só o que o visitante veria", () => {
    const target = study("c1", { ...draft, serviceIds: ["s1", "s2"] });
    const detail = caseDetailOf(
      snapshot({
        areas: [area("a1"), area("a2")],
        categories: [category("cat")],
        services: [service("s1", { areaIds: ["a1"] }), service("s2", { ...draft, areaIds: ["a2"] })],
      }),
      target,
      NOW,
    );
    expect(detail.item).toBe(target);
    expect(detail.category?.id).toBe("cat");
    expect(detail.services.map((item) => item.id)).toEqual(["s1"]);
    expect(detail.areas.map((item) => item.id)).toEqual(["a1"]);
  });

  it("categoria em rascunho não aparece", () => {
    const detail = caseDetailOf(snapshot({ categories: [category("cat", draft)] }), study("c1"), NOW);
    expect(detail.category).toBeNull();
  });
});

describe("listas do detalhe", () => {
  it("outros serviços tira o próprio e limita a 4", () => {
    const list = ["a", "b", "c", "d", "e", "f"].map((id) => service(id));
    expect(pickOtherServices(list, "b").map((item) => item.id)).toEqual(["a", "c", "d", "e"]);
  });

  it("cases relacionados tira o próprio e limita a 3", () => {
    const list = ["a", "b", "c", "d", "e"].map((id) => study(id)) as CaseCard[];
    expect(pickRelatedCases(list, "a").map((item) => item.id)).toEqual(["b", "c", "d"]);
  });
});
