/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : repository.supabase.test.ts
 Descrição    : Repositório público lendo o Supabase: banco vazio e populado.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-05).
 26/10/2026 Vinícius Nishimura Reis  Ambiente no mock da configuração pública (INT-02).
 01/11/2026 Vinícius Nishimura Reis  Testes de aceite dos cases em destaque (HOME-04).
 01/11/2026 Vinícius Nishimura Reis  Sufixo de teste com node:crypto (CodeQL).
──────────────────────────────────────────────────────────────────────────────
*/

import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeSupabase, type FakeTable } from "@/tests/stubs/fake-supabase";

/*
 * O repositório inteiro rodando sobre a fonte Supabase (cliente falso, sem RLS): prova que
 * listagens e detalhes funcionam com o banco vazio e populado (critério do DB-05) e que o
 * filtro de visibilidade do domínio continua valendo mesmo para o que vem do banco.
 */
let tables: Record<string, FakeTable> = {};

vi.mock("next/cache", () => ({ cacheTag: () => {}, cacheLife: () => {} }));
vi.mock("@/lib/config/server-env", () => ({ getServerEnv: () => ({ CONTENT_SOURCE: "supabase" }) }));
vi.mock("@/lib/config/public-env", () => ({
  isSupabaseConfigured: true,
  siteEnvironment: "development",
  publicEnv: { NEXT_PUBLIC_SUPABASE_URL: "https://projeto.supabase.co" },
}));
vi.mock("../supabase/server", () => ({ createPublicClient: () => fakeSupabase(tables).client }));
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

const repository = await import("./repository");

const control = {
  provisional: false,
  archived_at: null,
  updated_at: "2026-10-20T00:00:00+00:00",
};
const live = { ...control, status: "published", published_at: "2026-10-20T00:00:00+00:00" };

function populated(): Record<string, FakeTable> {
  return {
    areas: {
      data: [
        {
          ...live,
          id: "a1",
          slug: "social-media",
          name: "Social Media",
          summary: "s",
          description: "d",
          highlights: [],
          icon: null,
          sort_order: 1,
        },
      ],
    },
    services: {
      data: [
        {
          ...live,
          id: "s1",
          slug: "social-media",
          name: "Social Media",
          summary: "s",
          description: "d",
          examples: [],
          icon: null,
          image_media_id: null,
          featured: true,
          sort_order: 1,
        },
      ],
    },
    service_areas: { data: [{ service_id: "s1", area_id: "a1" }] },
    case_categories: {
      data: [
        {
          ...live,
          id: "c1",
          slug: "social-media-e-criacao",
          name: "Social Media & Criação",
          description: null,
          sort_order: 1,
        },
      ],
    },
    cases: {
      data: [
        {
          ...live,
          id: "k1",
          slug: "meridiano",
          title: "Meridiano",
          client_name: "Meridiano",
          category_id: "c1",
          delivery_type: "Campanha",
          summary: "Social media e criação para a Meridiano.",
          challenge: null,
          solution: null,
          results: null,
          cover_media_id: "m1",
          external_links: [],
          reference_month: "2026-09-01",
          team: [],
          featured: true,
          sort_order: 1,
        },
        // Publicação agendada para o futuro: a RLS do banco já esconde, e o domínio também.
        {
          ...live,
          id: "k2",
          slug: "futuro",
          title: "Futuro",
          client_name: "X",
          category_id: "c1",
          delivery_type: null,
          summary: "s",
          challenge: null,
          solution: null,
          results: null,
          cover_media_id: null,
          external_links: [],
          reference_month: null,
          team: [],
          featured: false,
          sort_order: 2,
          published_at: "2999-01-01T00:00:00+00:00",
        },
      ],
    },
    case_services: { data: [{ case_id: "k1", service_id: "s1" }] },
    case_media: { data: [{ case_id: "k1", media_id: "m2", sort_order: 1 }] },
    media_assets: {
      data: [
        {
          id: "m1",
          path: "2026/10/capa.webp",
          mime_type: "image/webp",
          width: 1200,
          height: 750,
          alt_text: "Capa",
          decorative: false,
        },
        {
          id: "m2",
          path: "/brand/cases/peca.webp",
          mime_type: "image/webp",
          width: null,
          height: null,
          alt_text: "Peça",
          decorative: false,
        },
      ],
    },
  };
}

describe("repositório sobre o Supabase (DB-05)", () => {
  beforeEach(() => {
    tables = {};
  });

  it("banco vazio: listagens vazias e detalhes inexistentes, sem erro", async () => {
    expect(await repository.listServices()).toEqual([]);
    expect(await repository.listCategories()).toEqual([]);
    expect(await repository.listCases()).toEqual([]);
    expect(await repository.listCases({ category: "copywriting" })).toEqual([]);
    expect(await repository.getCaseDetail("meridiano")).toBeNull();
    expect(await repository.getServiceDetail("social-media")).toBeNull();
    expect(await repository.listPublishedSlugs()).toEqual({ services: [], cases: [] });
  });

  it("cases em destaque da Home: só os publicados e marcados, no máximo 6 (HOME-04)", async () => {
    tables = populated();
    const base = tables.cases.data![0];
    tables.cases = {
      data: [
        base,
        { ...base, id: "k3", slug: "rascunho", status: "draft", published_at: null },
        { ...base, id: "k4", slug: "arquivado", status: "archived", archived_at: "2026-10-21T00:00:00+00:00" },
        { ...base, id: "k5", slug: "agendado", published_at: "2999-01-01T00:00:00+00:00" },
        { ...base, id: "k6", slug: "sem-destaque", featured: false },
      ],
    };
    expect((await repository.listFeaturedCases()).map((item) => item.slug)).toEqual(["meridiano"]);

    tables.cases = {
      data: Array.from({ length: 8 }, (_, index) => ({
        ...base,
        id: `k${index}`,
        slug: `case-${index}`,
        sort_order: index,
      })),
    };
    expect((await repository.listFeaturedCases()).map((item) => item.slug)).toEqual([
      "case-0",
      "case-1",
      "case-2",
      "case-3",
      "case-4",
      "case-5",
    ]);
  });

  it("sem nenhum case em destaque, a lista da Home vem vazia, sem erro (HOME-04)", async () => {
    tables = populated();
    tables.cases = { data: tables.cases.data!.map((item) => ({ ...item, featured: false })) };
    expect(await repository.listFeaturedCases()).toEqual([]);
  });

  it("banco populado: lista, filtra por categoria e monta o detalhe com galeria", async () => {
    tables = populated();
    const cases = await repository.listCases();
    expect(cases.map((item) => item.slug)).toEqual(["meridiano"]);
    expect(cases[0]).toMatchObject({ categorySlug: "social-media-e-criacao", date: "2026-09" });
    expect((await repository.listCases({ category: "social-media-e-criacao" })).map((item) => item.slug)).toEqual([
      "meridiano",
    ]);
    expect(await repository.listCases({ category: "copywriting" })).toEqual([]);

    const detail = await repository.getCaseDetail("meridiano");
    expect(detail?.category?.name).toBe("Social Media & Criação");
    expect(detail?.services.map((service) => service.slug)).toEqual(["social-media"]);
    expect(detail?.areas.map((area) => area.slug)).toEqual(["social-media"]);
    expect(detail?.item.cover?.src).toBe(
      "https://projeto.supabase.co/storage/v1/object/public/media/2026/10/capa.webp",
    );
    expect(detail?.item.gallery.map((item) => item.alt)).toEqual(["Peça"]);
  });

  it("publicação agendada para o futuro não aparece nem no detalhe", async () => {
    tables = populated();
    expect(await repository.getCaseDetail("futuro")).toBeNull();
  });
});
