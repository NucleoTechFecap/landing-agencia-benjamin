/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : cases-categorias.test.ts
 Descrição    : Integração: leitura pública de categorias, cases, galeria e vínculos com a RLS real.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-05).
 29/10/2026 Vinicius Binda             resolvePublicSlug no lugar de isSlugPublished (DB-08).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { fetchCasesAndCategories, resolvePublicSlug } from "@/lib/server/content/supabase/queries";
import { anonClient, hasSupabaseTestEnv, must, serviceClient, supabaseTestEnv, testSuffix } from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

describe.runIf(hasSupabaseTestEnv)("categorias e cases no Supabase (DB-05)", () => {
  const admin = hasSupabaseTestEnv ? serviceClient() : (null as never);
  const suffix = testSuffix();
  const past = new Date(Date.now() - 86_400_000).toISOString();
  const slug = (name: string) => `${name}-${suffix}`;
  const ids = { media: [] as string[], categories: [] as string[], services: [] as string[], cases: [] as string[] };

  // Insert em lote no PostgREST: todas as linhas trazem as mesmas colunas (ausente vira null).
  beforeAll(async () => {
    const media = await must(
      admin
        .from("media_assets")
        .insert(
          ["capa", "galeria-1", "galeria-2", "capa-rascunho"].map((name) => ({
            path: `/brand/teste-${suffix}-${name}.webp`,
            mime_type: "image/webp",
            alt_text: name,
          })),
        )
        .select("id"),
    );
    ids.media = media.map((item) => item.id);
    const categories = await must(
      admin
        .from("case_categories")
        .insert([
          { slug: slug("categoria"), name: "Categoria publicada", status: "published", published_at: past },
          { slug: slug("categoria-rascunho"), name: "Categoria rascunho", status: "draft", published_at: null },
        ])
        .select("id"),
    );
    ids.categories = categories.map((item) => item.id);
    const services = await must(
      admin
        .from("services")
        .insert([
          {
            slug: slug("servico"),
            name: "Serviço",
            summary: "s",
            description: "d",
            status: "published",
            published_at: past,
          },
          {
            slug: slug("servico-rascunho"),
            name: "Serviço rascunho",
            summary: null,
            description: null,
            status: "draft",
            published_at: null,
          },
        ])
        .select("id"),
    );
    ids.services = services.map((item) => item.id);
    const base = {
      client_name: "Cliente teste",
      category_id: ids.categories[0],
      summary: "Resumo do case de teste com mais de trinta caracteres.",
    };
    const cases = await must(
      admin
        .from("cases")
        .insert([
          {
            ...base,
            slug: slug("case"),
            title: "Case publicado",
            cover_media_id: ids.media[0],
            external_links: [{ label: "Matéria", url: "https://exemplo.com.br/materia" }],
            reference_month: "2026-08-01",
            status: "published",
            published_at: past,
          },
          {
            ...base,
            slug: slug("case-rascunho"),
            title: "Case rascunho",
            cover_media_id: ids.media[3],
            external_links: [],
            reference_month: null,
            status: "draft",
            published_at: null,
          },
        ])
        .select("id"),
    );
    ids.cases = cases.map((item) => item.id);
    await must(
      admin.from("case_services").insert([
        { case_id: ids.cases[0], service_id: ids.services[0] },
        { case_id: ids.cases[0], service_id: ids.services[1] },
      ]),
    );
    await must(
      admin.from("case_media").insert([
        { case_id: ids.cases[0], media_id: ids.media[2], sort_order: 2 },
        { case_id: ids.cases[0], media_id: ids.media[1], sort_order: 1 },
        { case_id: ids.cases[1], media_id: ids.media[3], sort_order: 1 },
      ]),
    );
  });

  afterAll(async () => {
    await admin.from("cases").delete().in("id", ids.cases);
    await admin.from("services").delete().in("id", ids.services);
    await admin.from("case_categories").delete().in("id", ids.categories);
    await admin.from("media_assets").delete().in("id", ids.media);
  });

  const load = async () => {
    const result = await fetchCasesAndCategories(anonClient(), supabaseTestEnv.url!);
    return {
      categories: result.categories.filter((item) => item.slug.endsWith(suffix)),
      cases: result.cases.filter((item) => item.slug.endsWith(suffix)),
    };
  };

  it("visitante vê só o case publicado, com capa, galeria em ordem, link e mês", async () => {
    const { cases } = await load();
    expect(cases.map((item) => item.slug)).toEqual([slug("case")]);
    expect(cases[0]).toMatchObject({
      cover: { alt: "capa" },
      externalLinks: [{ label: "Matéria", url: "https://exemplo.com.br/materia" }],
      date: "2026-08",
    });
    expect(cases[0].gallery.map((item) => item.alt)).toEqual(["galeria-1", "galeria-2"]);
  });

  it("vínculo com serviço em rascunho não é exposto", async () => {
    const { cases } = await load();
    expect(cases[0].serviceIds).toEqual([ids.services[0]]);
  });

  it("categoria em rascunho e galeria de case em rascunho não aparecem", async () => {
    const { categories } = await load();
    expect(categories.map((item) => item.slug)).toEqual([slug("categoria")]);
    const { data } = await anonClient().from("case_media").select("media_id").eq("case_id", ids.cases[1]);
    expect(data).toEqual([]);
  });

  it("checagem de slug do proxy para cases", async () => {
    expect(await resolvePublicSlug(anonClient(), "case", slug("case"))).toBe(slug("case"));
    expect(await resolvePublicSlug(anonClient(), "case", slug("case-rascunho"))).toBeNull();
  });
});
