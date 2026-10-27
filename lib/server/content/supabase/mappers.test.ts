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
 26/10/2026 Vinícius Nishimura Reis  Testes de áreas, serviços e mídia (DB-04).
 26/10/2026 Vinícius Nishimura Reis  Testes de categorias, cases e galeria (DB-05).
 26/10/2026 Vinícius Nishimura Reis  Id da mídia no mapeamento e fora do DTO (ADM-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { siteSettings } from "@/content";
import {
  toArea,
  toCase,
  toCategory,
  toCta,
  toCtaTarget,
  toExternalLinks,
  toMediaRef,
  toPage,
  toService,
  toSiteSettings,
} from "./mappers";
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

describe("áreas, serviços e mídia (DB-04)", () => {
  const media = { id: "m1", mime_type: "image/webp", width: 1200, height: 750, alt_text: "Capa", decorative: false };

  it("mídia: caminho em /public fica como está; chave do bucket vira URL pública", () => {
    expect(toMediaRef({ ...media, path: "/brand/cases/fecap.webp" }, "https://x.supabase.co").src).toBe(
      "/brand/cases/fecap.webp",
    );
    expect(toMediaRef({ ...media, path: "2026/10/abc-capa.webp" }, "https://x.supabase.co/")).toEqual({
      id: "m1",
      src: "https://x.supabase.co/storage/v1/object/public/media/2026/10/abc-capa.webp",
      alt: "Capa",
      width: 1200,
      height: 750,
    });
  });

  it("mídia decorativa tem texto alternativo vazio", () => {
    expect(toMediaRef({ ...media, path: "/x.webp", decorative: true }, "https://x.supabase.co").alt).toBe("");
  });

  it("área e serviço convertem nulos opcionais e ordem", () => {
    const area = toArea({
      ...control,
      id: "a1",
      slug: "criacao",
      name: "Criação",
      summary: "Resumo",
      description: "Descrição",
      highlights: ["Design"],
      icon: null,
      sort_order: 5,
    });
    expect(area).toMatchObject({ slug: "criacao", order: 5, icon: undefined, highlights: ["Design"] });
    const service = toService(
      {
        ...control,
        id: "s1",
        slug: "audiovisual",
        name: "Audiovisual",
        summary: null,
        description: null,
        examples: [],
        icon: "like",
        image_media_id: null,
        featured: true,
        sort_order: 7,
      },
      ["a1"],
    );
    expect(service).toMatchObject({ areaIds: ["a1"], summary: "", featured: true, image: undefined, order: 7 });
  });
});

describe("categorias e cases (DB-05)", () => {
  const row = {
    ...control,
    id: "k1",
    slug: "meridiano",
    title: "Social media para a Meridiano",
    client_name: "Meridiano",
    category_id: "cat1",
    delivery_type: null,
    summary: "Resumo com pelo menos trinta caracteres.",
    challenge: null,
    solution: "Solução.",
    results: null,
    cover_media_id: "m1",
    external_links: [{ label: "Post", url: "https://instagram.com/p/1" }],
    reference_month: "2026-08-01",
    team: ["Ana"],
    featured: true,
    sort_order: 3,
  };

  it("case: mês de referência vira AAAA-MM e nulos viram undefined", () => {
    const item = toCase(row, { serviceIds: ["s1"], gallery: [] });
    expect(item).toMatchObject({
      client: "Meridiano",
      categoryId: "cat1",
      serviceIds: ["s1"],
      date: "2026-08",
      deliveryType: undefined,
      challenge: undefined,
      solution: "Solução.",
      order: 3,
    });
    expect(toCase({ ...row, reference_month: null }, { serviceIds: [], gallery: [] }).date).toBeUndefined();
  });

  it("links externos: só objetos com label e url https", () => {
    expect(
      toExternalLinks([
        { label: "Matéria", url: "https://g1.globo.com/x" },
        { label: "Inseguro", url: "http://x.com" },
        { url: "https://sem-label.com" },
        "texto",
      ]),
    ).toEqual([{ label: "Matéria", url: "https://g1.globo.com/x" }]);
    expect(toExternalLinks(null)).toEqual([]);
  });

  it("categoria converte descrição nula", () => {
    expect(
      toCategory({ ...control, id: "c1", slug: "copywriting", name: "Copywriting", description: null, sort_order: 1 }),
    ).toMatchObject({ slug: "copywriting", description: "", order: 1 });
  });
});
