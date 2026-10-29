/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : queries.test.ts
 Descrição    : Testes das consultas públicas ao CMS com cliente Supabase falso.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 29/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
 26/10/2026 Vinícius Nishimura Reis  Testes de áreas, serviços e mídia (DB-04).
 26/10/2026 Vinícius Nishimura Reis  Testes de categorias, cases e galeria (DB-05).
 29/10/2026 Vinicius Binda             resolvePublicSlug no lugar de isSlugPublished (DB-08).
──────────────────────────────────────────────────────────────────────────────
*/

import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { siteSettings } from "@/content";
import { fakeSupabase } from "@/tests/stubs/fake-supabase";
import {
  fetchAreasAndServices,
  fetchCasesAndCategories,
  fetchCtas,
  fetchPage,
  fetchSiteSettings,
  resolvePublicSlug,
} from "./queries";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

const control = {
  provisional: false,
  published_at: "2026-10-20T12:00:00+00:00",
  archived_at: null,
  updated_at: "2026-10-20T12:00:00+00:00",
};

describe("consultas públicas do CMS (DB-03)", () => {
  it("CTAs: pede só publicados e as colunas declaradas", async () => {
    const { client, calls } = fakeSupabase({
      ctas: {
        data: [
          {
            ...control,
            id: "c1",
            status: "published",
            label: "Ver cases",
            placement: "home-highlight",
            target_kind: "internal",
            target_path: "/cases",
            sort_order: 1,
          },
          {
            ...control,
            id: "c2",
            status: "draft",
            label: "Rascunho",
            placement: "home-hero",
            target_kind: "internal",
            target_path: "/",
            sort_order: 1,
          },
        ],
      },
    });
    const ctas = await fetchCtas(client);
    expect(ctas.map((cta) => cta.id)).toEqual(["c1"]);
    expect(calls[0].filters).toContainEqual(["status", "published"]);
    expect(calls[0].columns).toContain("target_kind");
  });

  it("página: devolve publicada com blocos e null para rascunho ou inexistente", async () => {
    const { client } = fakeSupabase({
      pages: {
        data: [
          { ...control, id: "p1", slug: "sobre", status: "published", title: "Sobre", description: "Quem somos" },
          { ...control, id: "p2", slug: "privacidade", status: "draft", title: "Privacidade", description: null },
        ],
      },
      blocks: {
        data: [
          { id: "b1", page_id: "p1", type: "rich-text", content: { paragraphs: ["Olá."] }, sort_order: 1 },
          { id: "b9", page_id: "p2", type: "rich-text", content: { paragraphs: ["Não aparece."] }, sort_order: 1 },
        ],
      },
    });
    const page = await fetchPage(client, "sobre");
    expect(page?.blocks.map((block) => block.id)).toEqual(["b1"]);
    expect(await fetchPage(client, "privacidade")).toBeNull();
    expect(await fetchPage(client, "inexistente")).toBeNull();
  });

  it("configurações: sem linha no banco usa a configuração versionada", async () => {
    const { client } = fakeSupabase({ site_settings: { data: [] } });
    expect(await fetchSiteSettings(client, siteSettings)).toBe(siteSettings);
  });

  it("falha do banco vira SERVICE_UNAVAILABLE com mensagem segura", async () => {
    const { client } = fakeSupabase({ ctas: { error: { message: "connection refused", code: "08006" } } });
    await expect(fetchCtas(client)).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message: expect.not.stringContaining("connection"),
    });
  });
});

describe("áreas e serviços (DB-04)", () => {
  const area = (id: string, status: string) => ({
    ...control,
    id,
    status,
    slug: id,
    name: id,
    summary: "s",
    description: "d",
    highlights: [],
    icon: null,
    sort_order: 1,
  });
  const service = (id: string, status: string, image: string | null = null) => ({
    ...control,
    id,
    status,
    slug: id,
    name: id,
    summary: "s",
    description: "d",
    examples: [],
    icon: null,
    image_media_id: image,
    featured: false,
    sort_order: 1,
  });

  it("monta serviços com áreas vinculadas e imagem; rascunhos ficam de fora", async () => {
    const { client } = fakeSupabase({
      areas: { data: [area("social-media", "published"), area("criacao-rascunho", "draft")] },
      services: { data: [service("social", "published", "m1"), service("eventos", "draft")] },
      service_areas: { data: [{ service_id: "social", area_id: "social-media" }] },
      media_assets: {
        data: [
          {
            id: "m1",
            path: "/brand/x.webp",
            mime_type: "image/webp",
            width: 10,
            height: 10,
            alt_text: "X",
            decorative: false,
          },
        ],
      },
    });
    const { areas, services } = await fetchAreasAndServices(client, "https://x.supabase.co");
    expect(areas.map((item) => item.id)).toEqual(["social-media"]);
    expect(services).toHaveLength(1);
    expect(services[0]).toMatchObject({ id: "social", areaIds: ["social-media"], image: { src: "/brand/x.webp" } });
  });

  it("não consulta a mídia quando nenhum serviço tem imagem", async () => {
    const { client, calls } = fakeSupabase({ services: { data: [service("social", "published")] } });
    await fetchAreasAndServices(client, "https://x.supabase.co");
    expect(calls.map((call) => call.table)).not.toContain("media_assets");
  });

  it("slug atual: pergunta ao banco (resolve_public_slug) e libera a requisição se ele falhar", async () => {
    const rpc = vi.fn(async (_fn: string, args: { p_entity: string; p_slug: string }) => ({
      data: { "social-antigo": "social", social: "social" }[args.p_slug] ?? null,
      error: null,
    }));
    const client = { rpc } as unknown as SupabaseClient;
    expect(await resolvePublicSlug(client, "service", "social")).toBe("social");
    expect(await resolvePublicSlug(client, "service", "social-antigo")).toBe("social");
    expect(await resolvePublicSlug(client, "service", "eventos")).toBeNull();
    expect(rpc).toHaveBeenCalledWith("resolve_public_slug", { p_entity: "service", p_slug: "social-antigo" });
    const broken = { rpc: async () => ({ data: null, error: { message: "timeout" } }) } as unknown as SupabaseClient;
    expect(await resolvePublicSlug(broken, "case", "meridiano")).toBe("meridiano");
  });
});

describe("categorias e cases (DB-05)", () => {
  const caseRow = (id: string, status: string, cover: string | null) => ({
    ...control,
    id,
    status,
    slug: id,
    title: id,
    client_name: "Cliente",
    category_id: "cat",
    delivery_type: null,
    summary: "Resumo do case com mais de trinta caracteres.",
    challenge: null,
    solution: null,
    results: null,
    cover_media_id: cover,
    external_links: [],
    reference_month: null,
    team: [],
    featured: false,
    sort_order: 1,
  });
  const media = (id: string) => ({
    id,
    path: `/brand/${id}.webp`,
    mime_type: "image/webp",
    width: null,
    height: null,
    alt_text: id,
    decorative: false,
  });

  it("monta capa, galeria em ordem e serviços do case; rascunhos ficam de fora", async () => {
    const { client } = fakeSupabase({
      case_categories: {
        data: [
          {
            ...control,
            id: "cat",
            status: "published",
            slug: "copywriting",
            name: "Copywriting",
            description: null,
            sort_order: 1,
          },
        ],
      },
      cases: { data: [caseRow("meridiano", "published", "capa"), caseRow("rascunho", "draft", null)] },
      case_services: { data: [{ case_id: "meridiano", service_id: "social" }] },
      case_media: {
        data: [
          { case_id: "meridiano", media_id: "g2", sort_order: 2 },
          { case_id: "meridiano", media_id: "g1", sort_order: 1 },
        ],
      },
      media_assets: { data: [media("capa"), media("g1"), media("g2")] },
    });
    const { categories, cases } = await fetchCasesAndCategories(client, "https://x.supabase.co");
    expect(categories.map((category) => category.slug)).toEqual(["copywriting"]);
    expect(cases).toHaveLength(1);
    expect(cases[0]).toMatchObject({ serviceIds: ["social"], cover: { src: "/brand/capa.webp" } });
    expect(cases[0].gallery.map((item) => item.alt)).toEqual(["g1", "g2"]);
  });

  it("banco vazio devolve listas vazias sem consultar mídia", async () => {
    const { client, calls } = fakeSupabase({});
    expect(await fetchCasesAndCategories(client, "https://x.supabase.co")).toEqual({ categories: [], cases: [] });
    expect(calls.map((call) => call.table)).not.toContain("media_assets");
  });
});
