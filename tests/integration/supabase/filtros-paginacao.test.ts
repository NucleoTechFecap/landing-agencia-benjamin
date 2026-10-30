/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : filtros-paginacao.test.ts
 Descrição    : Integração: filtros combinados, ordenação e paginação de cases sobre a RLS real (DBX-03).

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinicius Binda             Criação inicial (DBX-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { caseQuerySchema, paginate } from "@/lib/domain/api/contracts";
import { anonClient, hasSupabaseTestEnv, must, serviceClient, supabaseTestEnv, testSuffix } from "./helpers";

/*
 * DBX-03 manteve filtro, ordenação e paginação na aplicação (repository + paginate), sobre o
 * conteúdo publicado que a RLS entrega. Este teste roda o repositório de verdade contra o
 * Supabase local, com o cliente anônimo: o que a RLS esconde (serviço em rascunho, vínculo
 * com ele, case em rascunho) não pode reaparecer por nenhum filtro, e as páginas somadas têm
 * de reproduzir a lista inteira, na mesma ordem, sem repetir nem perder itens.
 */
vi.mock("next/cache", () => ({ cacheTag: () => {}, cacheLife: () => {} }));
vi.mock("@/lib/config/server-env", () => ({ getServerEnv: () => ({ CONTENT_SOURCE: "supabase" }) }));
vi.mock("@/lib/config/public-env", () => ({
  isSupabaseConfigured: true,
  siteEnvironment: "development",
  publicEnv: { NEXT_PUBLIC_SUPABASE_URL: supabaseTestEnv.url },
}));
vi.mock("@/lib/server/supabase/server", () => ({ createPublicClient: () => anonClient() }));
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

const { listCases } = await import("@/lib/server/content/repository");

describe.runIf(hasSupabaseTestEnv)("filtros e paginação de cases sobre a RLS (DBX-03)", () => {
  const admin = hasSupabaseTestEnv ? serviceClient() : (null as never);
  const suffix = testSuffix();
  const past = new Date(Date.now() - 86_400_000).toISOString();
  const slug = (name: string) => `${name}-${suffix}`;
  const ids = { media: "", category: "", area: "", services: [] as string[], cases: [] as string[] };

  // Case n (1 a 7) publicado; sort_order fora da ordem de criação para provar a ordenação.
  const SORT = [5, 1, 7, 3, 2, 6, 4];
  const caseSlug = (n: number) => slug(`case-${n}`);

  beforeAll(async () => {
    const [media] = await must(
      admin
        .from("media_assets")
        .insert({ path: `/brand/teste-${suffix}-capa.webp`, mime_type: "image/webp", alt_text: "Capa" })
        .select("id"),
    );
    ids.media = media.id;
    const [category] = await must(
      admin
        .from("case_categories")
        .insert({ slug: slug("categoria"), name: "Categoria", status: "published", published_at: past })
        .select("id"),
    );
    ids.category = category.id;
    const [area] = await must(
      admin
        .from("areas")
        .insert({
          slug: slug("area"),
          name: "Área",
          summary: "s",
          description: "d",
          status: "published",
          published_at: past,
        })
        .select("id"),
    );
    ids.area = area.id;
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
            name: "Rascunho",
            summary: null,
            description: null,
            status: "draft",
            published_at: null,
          },
        ])
        .select("id"),
    );
    ids.services = services.map((item) => item.id);
    await must(admin.from("service_areas").insert({ service_id: ids.services[0], area_id: ids.area }));

    const base = {
      category_id: ids.category,
      cover_media_id: ids.media,
      summary: "Resumo do case de teste com mais de trinta caracteres.",
    };
    const cases = await must(
      admin
        .from("cases")
        .insert([
          ...SORT.map((sortOrder, index) => ({
            ...base,
            slug: caseSlug(index + 1),
            title: `Case ${index + 1}`,
            client_name: index === 6 ? `Cliente Especial ${suffix}` : "Cliente comum",
            sort_order: sortOrder,
            status: "published",
            published_at: past,
          })),
          {
            ...base,
            slug: slug("case-rascunho"),
            title: "Case rascunho",
            client_name: "Cliente comum",
            sort_order: 0,
            status: "draft",
            published_at: null,
          },
        ])
        .select("id"),
    );
    ids.cases = cases.map((item) => item.id);
    await must(
      admin.from("case_services").insert([
        // Cases 1 a 3 e o rascunho: serviço publicado. Cases 4 e 5: só o serviço em rascunho.
        ...[0, 1, 2, 7].map((index) => ({ case_id: ids.cases[index], service_id: ids.services[0] })),
        ...[3, 4].map((index) => ({ case_id: ids.cases[index], service_id: ids.services[1] })),
      ]),
    );
  });

  afterAll(async () => {
    await admin.from("cases").delete().in("id", ids.cases);
    await admin.from("services").delete().in("id", ids.services);
    await admin.from("areas").delete().eq("id", ids.area);
    await admin.from("case_categories").delete().eq("id", ids.category);
    await admin.from("media_assets").delete().eq("id", ids.media);
  });

  /** Ordem esperada: sort_order crescente (os títulos desempatam). */
  const byOrder = (numbers: number[]) => [...numbers].sort((a, b) => SORT[a - 1] - SORT[b - 1]).map((n) => caseSlug(n));

  it("lista só os publicados da categoria, em sort_order", async () => {
    const cases = await listCases({ category: slug("categoria") });
    expect(cases.map((item) => item.slug)).toEqual(byOrder([1, 2, 3, 4, 5, 6, 7]));
  });

  it("combina categoria com serviço, área e cliente", async () => {
    const category = slug("categoria");
    expect((await listCases({ category, service: slug("servico") })).map((item) => item.slug)).toEqual(
      byOrder([1, 2, 3]),
    );
    expect((await listCases({ category, area: slug("area") })).map((item) => item.slug)).toEqual(byOrder([1, 2, 3]));
    expect(
      (await listCases({ category, service: slug("servico"), area: slug("area") })).map((item) => item.slug),
    ).toEqual(byOrder([1, 2, 3]));
    expect((await listCases({ category, client: `CLIENTE ESPECIAL ${suffix}` })).map((item) => item.slug)).toEqual([
      caseSlug(7),
    ]);
    expect(await listCases({ category, service: slug("servico"), client: `Cliente Especial ${suffix}` })).toEqual([]);
  });

  it("serviço em rascunho não filtra nada: o serviço e os vínculos com ele ficam fora (RLS)", async () => {
    expect(await listCases({ category: slug("categoria"), service: slug("servico-rascunho") })).toEqual([]);
  });

  it("páginas somadas reproduzem a lista, sem repetir; além da última vem vazia com os totais", async () => {
    const all = (await listCases({ category: slug("categoria") })).map((item) => item.slug);
    const query = caseQuerySchema.parse({ category: slug("categoria"), pageSize: "3" });
    const pages = [1, 2, 3].map((page) => paginate(all, page, query.pageSize));

    expect(pages.flatMap((page) => page.data)).toEqual(all);
    expect(pages.map((page) => page.data.length)).toEqual([3, 3, 1]);
    expect(pages[0].meta).toEqual({ page: 1, pageSize: 3, total: 7, totalPages: 3 });
    expect(paginate(all, 4, 3)).toEqual({ data: [], meta: { page: 4, pageSize: 3, total: 7, totalPages: 3 } });
  });
});
