/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : mappers.test.ts
 Descrição    : Testes da conversão das linhas do CMS em tipos de domínio.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { siteSettings } from "@/content";
import { toCta, toCtaTarget, toPage, toSiteSettings } from "./mappers";
import type { CtaRow, PageRow } from "./rows";

const control = {
  status: "published" as const,
  provisional: false,
  published_at: "2026-10-20T12:00:00+00:00",
  archived_at: null,
  updated_at: "2026-10-21T12:00:00+00:00",
};

const cta = (overrides: Partial<CtaRow>): CtaRow => ({
  ...control,
  id: "c1",
  label: "Quero um projeto",
  placement: "home-hero",
  target_kind: "contact",
  target_path: null,
  target_url: null,
  target_service_id: null,
  target_case_id: null,
  target_area_id: null,
  sort_order: 2,
  ...overrides,
});

describe("toCta (DB-03)", () => {
  it("converte campos de controle e ordem", () => {
    expect(toCta(cta({}))).toMatchObject({
      id: "c1",
      status: "published",
      publishedAt: "2026-10-20T12:00:00+00:00",
      archivedAt: null,
      order: 2,
      target: { kind: "contact" },
    });
  });

  it("monta cada tipo de destino a partir das colunas target_*", () => {
    expect(toCtaTarget(cta({ target_kind: "internal", target_path: "/servicos" }))).toEqual({
      kind: "internal",
      path: "/servicos",
    });
    expect(toCtaTarget(cta({ target_kind: "external", target_url: "https://www.fecap.br" }))).toEqual({
      kind: "external",
      url: "https://www.fecap.br",
    });
    expect(toCtaTarget(cta({ target_kind: "service", target_service_id: "s1" }))).toEqual({
      kind: "service",
      serviceId: "s1",
    });
    expect(toCtaTarget(cta({ target_kind: "contact", target_service_id: "s1" }))).toEqual({
      kind: "contact",
      serviceId: "s1",
    });
  });

  it("destino excluído (FK nula) vira id vazio, que cai no fallback do site", () => {
    expect(toCtaTarget(cta({ target_kind: "case" }))).toEqual({ kind: "case", caseId: "" });
    expect(toCtaTarget(cta({ target_kind: "area" }))).toEqual({ kind: "area", areaId: "" });
  });
});

describe("toPage (DB-03)", () => {
  const row: PageRow = { ...control, id: "p1", slug: "sobre", title: "Sobre", description: null };

  it("ordena blocos e descarta os inválidos, reportando o motivo", () => {
    const { page, problems } = toPage(row, [
      { id: "b2", page_id: "p1", type: "list", content: { items: [{ title: "Item" }] }, sort_order: 2 },
      { id: "b1", page_id: "p1", type: "rich-text", content: { paragraphs: ["Texto."] }, sort_order: 1 },
      { id: "b3", page_id: "p1", type: "video", content: {}, sort_order: 3 },
    ]);
    expect(page.blocks.map((block) => block.id)).toEqual(["b1", "b2"]);
    expect(page.description).toBeUndefined();
    expect(problems).toEqual(["Tipo de bloco desconhecido: video."]);
  });
});

describe("toSiteSettings (DB-03)", () => {
  it("usa colunas simples do banco e valida as seções jsonb", () => {
    const { settings, problems } = toSiteSettings(
      {
        name: "Agência Benjamin",
        short_name: "Benja",
        tagline: "Somando diferenças",
        description: "Descrição.",
        manifesto: siteSettings.manifesto,
        about: siteSettings.about,
        contact: { email: "nao-e-email" },
        socials: siteSettings.socials,
        keywords: null,
      },
      siteSettings,
    );
    expect(settings.shortName).toBe("Benja");
    expect(settings.keywords).toEqual([]);
    expect(settings.contact).toEqual(siteSettings.contact);
    expect(problems).toHaveLength(1);
  });
});
