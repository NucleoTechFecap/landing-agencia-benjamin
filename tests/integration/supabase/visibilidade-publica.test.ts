/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : visibilidade-publica.test.ts
 Descrição    : Integração: rascunho, arquivado e agendado nunca aparecem ao visitante (QA-04).

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (QA-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  fetchAreasAndServices,
  fetchCasesAndCategories,
  fetchCtas,
  fetchPage,
  isSlugPublished,
} from "@/lib/server/content/supabase/queries";
import { anonClient, hasSupabaseTestEnv, must, serviceClient, supabaseTestEnv, testSuffix } from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

/*
 * QA-04: para cada entidade, um item em cada estado que NÃO pode aparecer (rascunho,
 * arquivado, publicado com data futura) — conferido nas consultas do site e lendo as tabelas
 * direto com a chave anônima, como faria alguém fora do site.
 */
const HIDDEN = ["rascunho", "arquivado", "agendado"] as const;

describe.runIf(hasSupabaseTestEnv)("visibilidade pública de conteúdo não publicado (QA-04)", () => {
  const admin = hasSupabaseTestEnv ? serviceClient() : (null as never);
  const suffix = testSuffix();
  const past = new Date(Date.now() - 86_400_000).toISOString();
  const future = new Date(Date.now() + 30 * 86_400_000).toISOString();
  const state = {
    rascunho: { status: "draft", published_at: null, archived_at: null },
    arquivado: { status: "archived", published_at: past, archived_at: past },
    agendado: { status: "published", published_at: future, archived_at: null },
  } as const;
  const text = { summary: "Resumo do item de teste.", description: "Descrição do item de teste." };
  const ids: Record<string, string[]> = {
    areas: [],
    services: [],
    case_categories: [],
    cases: [],
    ctas: [],
    pages: [],
    media_assets: [],
  };
  const slugs = (name: string) => HIDDEN.map((kind) => `${name}-${kind}-${suffix}`);

  beforeAll(async () => {
    const insert = async (table: string, rows: Record<string, unknown>[]) =>
      (ids[table] = (await must(admin.from(table).insert(rows).select("id"))).map((row: { id: string }) => row.id));
    await insert(
      "media_assets",
      HIDDEN.map((kind) => ({
        path: `/brand/oculta-${kind}-${suffix}.webp`,
        mime_type: "image/webp",
        alt_text: `Oculta ${kind}`,
      })),
    );
    await insert(
      "areas",
      HIDDEN.map((kind, i) => ({ ...state[kind], ...text, slug: slugs("area")[i], name: `Área ${kind}` })),
    );
    await insert(
      "services",
      HIDDEN.map((kind, i) => ({
        ...state[kind],
        ...text,
        slug: slugs("servico")[i],
        name: `Serviço ${kind}`,
        image_media_id: ids.media_assets[i],
      })),
    );
    await insert(
      "case_categories",
      HIDDEN.map((kind, i) => ({ ...state[kind], slug: slugs("categoria")[i], name: `Categoria ${kind}` })),
    );
    await insert(
      "cases",
      HIDDEN.map((kind, i) => ({
        ...state[kind],
        slug: slugs("case")[i],
        title: `Case ${kind}`,
        client_name: "Cliente",
        category_id: ids.case_categories[i],
        summary: "Resumo de case de teste com mais de trinta caracteres.",
        cover_media_id: ids.media_assets[i],
      })),
    );
    await must(
      admin
        .from("service_areas")
        .insert(HIDDEN.map((_, i) => ({ service_id: ids.services[i], area_id: ids.areas[i] }))),
    );
    await must(
      admin
        .from("case_services")
        .insert(HIDDEN.map((_, i) => ({ case_id: ids.cases[i], service_id: ids.services[i] }))),
    );
    await must(
      admin.from("case_media").insert(HIDDEN.map((_, i) => ({ case_id: ids.cases[i], media_id: ids.media_assets[i] }))),
    );
    await insert(
      "ctas",
      HIDDEN.map((kind) => ({
        ...state[kind],
        label: `CTA ${kind} ${suffix}`.slice(0, 40),
        placement: "footer",
        target_kind: "internal",
        target_path: "/cases",
      })),
    );
    await insert(
      "pages",
      HIDDEN.map((kind, i) => ({ ...state[kind], slug: slugs("pagina")[i], title: `Página ${kind}` })),
    );
  });

  afterAll(async () => {
    for (const table of ["ctas", "pages", "cases", "case_categories", "services", "areas", "media_assets"]) {
      await admin.from(table).delete().in("id", ids[table]);
    }
  });

  it("consultas do site não trazem nenhum dos itens ocultos", async () => {
    const client = anonClient();
    const { areas, services } = await fetchAreasAndServices(client, supabaseTestEnv.url!);
    const { categories, cases } = await fetchCasesAndCategories(client, supabaseTestEnv.url!);
    const ctas = await fetchCtas(client);
    const mine = (items: { slug?: string; label?: string }[]) =>
      items.filter((item) => (item.slug ?? item.label ?? "").includes(suffix));
    expect(mine(areas)).toEqual([]);
    expect(mine(services)).toEqual([]);
    expect(mine(categories)).toEqual([]);
    expect(mine(cases)).toEqual([]);
    expect(mine(ctas)).toEqual([]);
    for (const slug of slugs("pagina")) expect(await fetchPage(client, slug)).toBeNull();
    for (const slug of slugs("servico")) expect(await isSlugPublished(client, "services", slug)).toBe(false);
    for (const slug of slugs("case")) expect(await isSlugPublished(client, "cases", slug)).toBe(false);
  });

  it.each(["areas", "services", "case_categories", "cases", "ctas", "pages", "media_assets"])(
    "leitura direta de %s com a chave anônima não expõe os ocultos",
    async (table) => {
      const { data, error } = await anonClient().from(table).select("id").in("id", ids[table]);
      expect(error).toBeNull();
      expect(data).toEqual([]);
    },
  );

  it.each([
    ["service_areas", "service_id", "services"],
    ["case_services", "case_id", "cases"],
    ["case_media", "case_id", "cases"],
  ])("vínculos de %s dos ocultos não vazam", async (table, column, owner) => {
    const { data } = await anonClient().from(table).select(column).in(column, ids[owner]);
    expect(data).toEqual([]);
  });
});
