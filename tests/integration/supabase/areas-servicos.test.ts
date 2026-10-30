/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : areas-servicos.test.ts
 Descrição    : Integração: leitura pública de áreas, serviços, vínculos e mídia com a RLS real.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-04).
 29/10/2026 Vinicius Binda             resolvePublicSlug no lugar de isSlugPublished (DB-08).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { fetchAreasAndServices, resolvePublicSlug } from "@/lib/server/content/supabase/queries";
import { anonClient, hasSupabaseTestEnv, must, serviceClient, supabaseTestEnv, testSuffix } from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

describe.runIf(hasSupabaseTestEnv)("áreas e serviços no Supabase (DB-04)", () => {
  const admin = hasSupabaseTestEnv ? serviceClient() : (null as never);
  const suffix = testSuffix();
  const past = new Date(Date.now() - 86_400_000).toISOString();
  const slug = (name: string) => `${name}-${suffix}`;
  const ids = { areas: [] as string[], services: [] as string[], media: [] as string[] };
  const published = { status: "published", published_at: past, summary: "Resumo.", description: "Descrição." };
  const draft = { status: "draft", published_at: null, summary: null, description: null };

  // Insert em lote no PostgREST: coluna ausente numa linha vira null (não o default), então
  // todas as linhas do mesmo insert trazem as mesmas colunas.
  beforeAll(async () => {
    const media = await must(
      admin
        .from("media_assets")
        .insert([
          { path: `/brand/teste-${suffix}-a.webp`, mime_type: "image/webp", alt_text: "Imagem do serviço publicado" },
          { path: `2026/10/teste-${suffix}-b.webp`, mime_type: "image/webp", alt_text: "Imagem do rascunho" },
        ])
        .select("id, path"),
    );
    ids.media = media.map((item) => item.id);
    const areas = await must(
      admin
        .from("areas")
        .insert([
          { ...published, slug: slug("area-publicada"), name: "Área publicada", sort_order: 2 },
          { ...draft, slug: slug("area-rascunho"), name: "Área rascunho", sort_order: 1 },
        ])
        .select("id, slug"),
    );
    ids.areas = areas.map((item) => item.id);
    const services = await must(
      admin
        .from("services")
        .insert([
          { ...published, slug: slug("servico-b"), name: "Serviço B", sort_order: 2, image_media_id: ids.media[0] },
          { ...published, slug: slug("servico-a"), name: "Serviço A", sort_order: 1, image_media_id: null },
          {
            ...draft,
            slug: slug("servico-rascunho"),
            name: "Serviço rascunho",
            sort_order: 3,
            image_media_id: ids.media[1],
          },
        ])
        .select("id, slug"),
    );
    ids.services = services.map((item) => item.id);
    await must(
      admin.from("service_areas").insert([
        { service_id: ids.services[0], area_id: ids.areas[0] },
        { service_id: ids.services[0], area_id: ids.areas[1] },
        { service_id: ids.services[2], area_id: ids.areas[0] },
      ]),
    );
  });

  afterAll(async () => {
    await admin.from("services").delete().in("id", ids.services);
    await admin.from("areas").delete().in("id", ids.areas);
    await admin.from("media_assets").delete().in("id", ids.media);
  });

  const load = () => fetchAreasAndServices(anonClient(), supabaseTestEnv.url!);

  it("visitante recebe só serviços publicados, com imagem e vínculo apenas com área publicada", async () => {
    const { services } = await load();
    const mine = services.filter((service) => service.slug.endsWith(suffix));
    expect(mine.map((service) => service.slug).sort()).toEqual([slug("servico-a"), slug("servico-b")]);
    const b = mine.find((service) => service.slug === slug("servico-b"))!;
    expect(b.areaIds).toEqual([ids.areas[0]]);
    expect(b.image).toMatchObject({ src: `/brand/teste-${suffix}-a.webp`, alt: "Imagem do serviço publicado" });
  });

  it("área em rascunho não aparece", async () => {
    const { areas } = await load();
    expect(areas.map((area) => area.slug)).toContain(slug("area-publicada"));
    expect(areas.map((area) => area.slug)).not.toContain(slug("area-rascunho"));
  });

  it("mídia usada só por rascunho não é listada para o visitante", async () => {
    const { data } = await anonClient().from("media_assets").select("id").in("id", ids.media);
    expect(data?.map((item) => item.id)).toEqual([ids.media[0]]);
  });

  it("checagem de slug do proxy respeita o estado de publicação", async () => {
    expect(await resolvePublicSlug(anonClient(), "service", slug("servico-a"))).toBe(slug("servico-a"));
    expect(await resolvePublicSlug(anonClient(), "service", slug("servico-rascunho"))).toBeNull();
  });
});
