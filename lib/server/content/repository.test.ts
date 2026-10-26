/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : repository.test.ts
 Descrição    : Testes do repositório público: filtros, relações e CTAs.

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
 26/10/2026 Vinícius Nishimura Reis  Caso de página sem banco (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ cacheTag: () => {}, cacheLife: () => {} }));

const repository = await import("./repository");

describe("repositório público de conteúdo", () => {
  it("lista áreas e serviços publicados em ordem", async () => {
    const areas = await repository.listAreas();
    expect(areas.map((area) => area.slug)[0]).toBe("eventos-e-parcerias");
    const featured = await repository.listServices({ featuredOnly: true });
    expect(featured.every((service) => service.featured)).toBe(true);
  });

  it("resolve detalhe do serviço com áreas e cases relacionados", async () => {
    const detail = await repository.getServiceDetail("copywriting");
    expect(detail?.areas.map((area) => area.slug)).toEqual(["copywriting"]);
    expect(detail?.cases.map((item) => item.slug)).toEqual(["aventura-de-construir"]);
    expect(await repository.getServiceDetail("nao-existe")).toBeNull();
  });

  it("filtra cases por categoria, serviço, área e cliente", async () => {
    expect((await repository.listCases({ category: "assessoria-de-imprensa" })).map((c) => c.slug)).toEqual(["fecap"]);
    expect((await repository.listCases({ service: "social-media" })).map((c) => c.slug)).toEqual(["meridiano"]);
    expect((await repository.listCases({ area: "copywriting" })).map((c) => c.slug)).toEqual(["aventura-de-construir"]);
    expect((await repository.listCases({ client: "fecap" })).map((c) => c.slug)).toEqual(["fecap"]);
    expect(await repository.listCases({ category: "inexistente" })).toEqual([]);
  });

  it("monta detalhe do case com categoria, serviços e áreas derivadas", async () => {
    const detail = await repository.getCaseDetail("meridiano");
    expect(detail?.category?.slug).toBe("social-media-e-criacao");
    expect(detail?.areas.map((area) => area.slug)).toEqual(["social-media", "criacao"]);
  });

  it("sem banco não há páginas editáveis: as rotas mostram só as seções fixas (DB-03)", async () => {
    expect(await repository.getPage("sobre")).toBeNull();
  });

  it("resolve links dos CTAs da Home", async () => {
    const hero = await repository.listCtas("home-hero");
    expect(hero.map((cta) => cta.link.href)).toEqual(["/contato#formulario", "/servicos"]);
  });
});
