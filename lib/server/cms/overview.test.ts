/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : overview.test.ts
 Descrição    : Testes da visão geral dos conteúdos: fila de revisão, permissão por grupo, leituras e erro.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-18).
──────────────────────────────────────────────────────────────────────────────
*/

import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { fakeSupabase } from "@/tests/stubs/fake-supabase";
import type { Action, Resource } from "@/lib/domain/auth/rbac";
import { FUTURE_PUBLICATION_WARNING, type OverviewItem } from "@/lib/domain/content/overview";
import type { PublicationStatus } from "@/lib/domain/content/publication-status";
import { publishProblems, runContentCommand, saveContent, type CmsDeps } from "./content-service";
import { AREA, CASE, CATEGORY, PAGE, SERVICE } from "./entities";
import { createMemoryCmsStore, type MemoryTables } from "./memory-store";
import { buildContentOverview, loadContentOverview } from "./overview";
import { createSupabaseCmsStore } from "./supabase-store";

const NOW = new Date("2026-11-04T12:00:00.000Z");
const PAST = "2026-10-20T00:00:00.000Z";
const FUTURE = "2026-12-20T00:00:00.000Z";
const SUPABASE_URL = "https://projeto.supabase.co";

/** Os formulários só aceitam uuid nas relações; o nome legível continua sendo o slug. */
const uid = (key: string) => {
  const hex = createHash("sha256").update(key).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

const control = (status: PublicationStatus, overrides: { provisional?: boolean; updated_at?: string } = {}) => ({
  status,
  provisional: false,
  published_at: status === "published" ? PAST : null,
  archived_at: status === "archived" ? PAST : null,
  updated_at: PAST,
  ...overrides,
});

const area = (key: string, name: string, status: PublicationStatus, complete = true) => ({
  ...control(status),
  id: uid(key),
  slug: key,
  name,
  summary: complete ? "Resumo da área de atuação." : null,
  description: complete ? "Descrição completa da área de atuação." : null,
  highlights: [],
  icon: null,
  sort_order: 1,
});

const service = (key: string, name: string, status: PublicationStatus) => ({
  ...control(status),
  id: uid(key),
  slug: key,
  name,
  summary: "Resumo do serviço oferecido.",
  description: "Descrição completa do serviço oferecido.",
  examples: [],
  icon: null,
  image_media_id: null,
  featured: false,
  sort_order: 1,
});

const category = (key: string, name: string, status: PublicationStatus, provisional = false) => ({
  ...control(status, { provisional }),
  id: uid(key),
  slug: key,
  name,
  description: null,
  sort_order: 1,
});

const caseRow = (key: string, title: string, status: PublicationStatus, categoryKey: string | null) => ({
  ...control(status),
  id: uid(key),
  slug: key,
  title,
  client_name: "Cliente fictício",
  category_id: categoryKey && uid(categoryKey),
  delivery_type: null,
  summary: "Resumo do case com tamanho suficiente para publicar.",
  challenge: null,
  solution: null,
  results: null,
  cover_media_id: uid("capa"),
  external_links: [],
  reference_month: null,
  team: [],
  featured: false,
  sort_order: 1,
});

const pageRow = (key: string, title: string, status: PublicationStatus, provisional = false) => ({
  ...control(status, { provisional }),
  id: uid(key),
  slug: key,
  title,
  description: null,
});

function seed(): Partial<MemoryTables> {
  return {
    media_assets: [
      {
        id: uid("capa"),
        path: "/brand/cases/capa.webp",
        mime_type: "image/webp",
        width: 1200,
        height: 750,
        alt_text: "Capa fictícia",
        decorative: false,
      },
    ],
    areas: [
      area("area-ok", "Área em dia", "published"),
      area("area-rascunho", "Área incompleta", "draft", false),
      area("area-arquivada", "Área arquivada incompleta", "archived", false),
    ],
    services: [
      service("servico-ok", "Serviço em dia", "published"),
      service("servico-sem-area", "Serviço no ar sem área", "published"),
      service("servico-area-rascunho", "Serviço com área em rascunho", "published"),
      service("servico-futuro", "Serviço agendado", "published"),
    ],
    service_areas: [
      { service_id: uid("servico-ok"), area_id: uid("area-ok") },
      { service_id: uid("servico-area-rascunho"), area_id: uid("area-rascunho") },
      { service_id: uid("servico-futuro"), area_id: uid("area-ok") },
    ],
    case_categories: [
      category("cat-ok", "Categoria em dia", "published"),
      category("cat-rascunho", "Categoria pronta em rascunho", "draft"),
      category("cat-provisoria", "Categoria provisória", "published", true),
    ],
    cases: [
      caseRow("case-ok", "Case em dia", "published", "cat-ok"),
      caseRow("case-categoria-rascunho", "Case no ar com categoria em rascunho", "published", "cat-rascunho"),
      { ...caseRow("case-incompleto", "Case incompleto", "draft", null), client_name: null, cover_media_id: null },
    ],
    case_services: [
      { case_id: uid("case-ok"), service_id: uid("servico-ok") },
      { case_id: uid("case-categoria-rascunho"), service_id: uid("servico-ok") },
    ],
    pages: [
      pageRow("sobre", "Página sem blocos", "draft"),
      pageRow("contato", "Página provisória", "published", true),
      pageRow("sem-rota", "Página sem rota", "published"),
    ],
    blocks: [
      { id: uid("b1"), page_id: uid("contato"), type: "rich-text", content: { paragraphs: ["Texto."] }, sort_order: 0 },
      {
        id: uid("b2"),
        page_id: uid("sem-rota"),
        type: "rich-text",
        content: { paragraphs: ["Texto."] },
        sort_order: 0,
      },
    ],
  };
}

function withFuturePublication(tables: Partial<MemoryTables>) {
  const row = tables.services!.find((item) => item.slug === "servico-futuro")!;
  row.published_at = FUTURE;
  return tables;
}

const memory = () => createMemoryCmsStore(withFuturePublication(seed())).store;
const load = async (role: Parameters<typeof loadContentOverview>[1] = "admin") =>
  loadContentOverview(memory(), role, NOW);
const inQueue = (review: OverviewItem[], key: string) => review.find((item) => item.id === uid(key));

describe("visão geral: o que precisa de revisão (ADM-18)", () => {
  it("rascunho com pendência entra na fila com a mesma lista do formulário", async () => {
    const { review } = await load();
    const snapshot = await memory().snapshot();
    const item = inQueue(review, "area-rascunho")!;
    expect(item.status).toBe("draft");
    expect(item.notes.missing.length).toBeGreaterThan(0);
    // Mesma regra do painel lateral da tela de edição.
    expect(item.notes.missing).toEqual(
      publishProblems(
        AREA,
        snapshot.areas.find((a) => a.id === item.id)!,
        snapshot,
        NOW,
      ),
    );
    expect(inQueue(review, "sobre")!.notes.missing).toEqual(["Inclua ao menos um bloco de conteúdo."]);
    expect(inQueue(review, "case-incompleto")!.notes.missing.length).toBeGreaterThan(1);
  });

  it("publicado com pendência também entra, e os do ar vêm antes dos rascunhos", async () => {
    const { review } = await load();
    expect(inQueue(review, "servico-sem-area")!.notes.missing.length).toBeGreaterThan(0);
    expect(inQueue(review, "case-categoria-rascunho")!.notes.missing).toEqual([
      "Case publicado com categoria não publicada.",
    ]);
    // O erro de integridade entra só como pendência: não se repete como aviso.
    expect(inQueue(review, "case-categoria-rascunho")!.notes.warnings).toEqual([]);
    const statuses = review.map((item) => item.status);
    expect(statuses.lastIndexOf("published")).toBeLessThan(statuses.indexOf("draft"));
  });

  it("item provisório entra na fila mesmo sem nenhuma outra pendência", async () => {
    const { review } = await load();
    expect(inQueue(review, "cat-provisoria")!.notes).toEqual({ provisional: true, missing: [], warnings: [] });
    expect(inQueue(review, "contato")!.notes.provisional).toBe(true);
  });

  it("avisos de integridade, data futura e página sem rota aparecem só para quem está publicado", async () => {
    const { review } = await load();
    expect(inQueue(review, "servico-area-rascunho")!.notes.warnings).toEqual(["Serviço publicado sem área publicada."]);
    expect(inQueue(review, "servico-futuro")!.notes.warnings).toContain(FUTURE_PUBLICATION_WARNING);
    expect(inQueue(review, "sem-rota")!.notes.warnings).toEqual([
      "Esta página não tem rota no site: fica salva, mas o visitante não a vê.",
    ]);
    // Rascunho sem rota não recebe o aviso: ainda não foi ao ar.
    expect(inQueue(review, "sobre")!.notes.warnings).toEqual([]);
  });

  it("publicado em dia, rascunho completo e arquivado ficam fora da fila, mas continuam nos grupos", async () => {
    const { review, groups } = await load();
    for (const id of ["area-ok", "servico-ok", "cat-ok", "case-ok", "cat-rascunho", "area-arquivada"]) {
      expect(inQueue(review, id), id).toBeUndefined();
    }
    const areas = groups.find((group) => group.type === "area")!;
    expect(areas.items.map((item) => item.id)).toEqual(["area-ok", "area-rascunho", "area-arquivada"].map(uid));
    expect(areas.counts).toEqual({ draft: 1, published: 1, archived: 1 });
  });

  it("unifica os cinco tipos com total, link de edição e última atualização", async () => {
    const { groups, counts } = await load();
    expect(groups.map((group) => group.label)).toEqual([
      "Páginas",
      "Áreas de atuação",
      "Serviços",
      "Categorias de cases",
      "Cases",
    ]);
    expect(counts).toEqual({ draft: 4, published: 11, archived: 1 });
    const adminPaths: Record<string, string> = {
      page: PAGE.adminPath,
      area: AREA.adminPath,
      service: SERVICE.adminPath,
      category: CATEGORY.adminPath,
      case: CASE.adminPath,
    };
    for (const group of groups) {
      expect(group.adminPath).toBe(adminPaths[group.type]);
      for (const item of group.items) {
        expect(item.editHref).toBe(`${group.adminPath}/${item.id}`);
        expect(item.updatedAt).toBe(PAST);
      }
    }
  });

  it("o conteúdo do item não acompanha a visão geral: só os dados que a tela mostra", async () => {
    const { groups } = await load();
    const page = groups.find((group) => group.type === "page")!.items[0];
    expect(page).not.toHaveProperty("blocks");
    expect(groups.find((group) => group.type === "case")!.items[0]).not.toHaveProperty("summary");
  });
});

describe("visão geral: permissão no servidor (ADM-18)", () => {
  it("grupo sem permissão some da tela e da fila, e os demais seguem avaliados com o conteúdo inteiro", async () => {
    const snapshot = await memory().snapshot();
    const noCases = (resource: Resource, action: Action) => resource !== "case" && action === "view";
    const overview = buildContentOverview(snapshot, noCases, NOW);
    expect(overview.groups.map((group) => group.type)).toEqual(["page", "area", "service", "category"]);
    expect(overview.review.some((item) => item.editHref.startsWith("/admin/cases"))).toBe(false);
    expect(inQueue(overview.review, "servico-area-rascunho")!.notes.warnings).toHaveLength(1);
    expect(overview.counts.published).toBe(9);
  });

  it("admin, editor e leitor veem os cinco tipos; só quem edita recebe o link de edição como tal", async () => {
    for (const role of ["super_admin", "admin", "editor", "viewer"] as const) {
      const { groups, review } = await load(role);
      expect(groups).toHaveLength(5);
      expect(
        review.every((item) => item.canEdit === (role !== "viewer")),
        role,
      ).toBe(true);
    }
  });

  it("conta pendente ou sem papel não recebe nada e nem chega a ler o conteúdo", async () => {
    for (const role of ["pending", null, undefined, "root"] as const) {
      const snapshot = vi.fn();
      const overview = await loadContentOverview({ snapshot }, role as "pending", NOW);
      expect(overview).toEqual({ groups: [], review: [], counts: { draft: 0, published: 0, archived: 0 } });
      expect(snapshot).not.toHaveBeenCalled();
    }
  });
});

describe("visão geral: leitura (ADM-18)", () => {
  const supabaseStore = (tables: Partial<MemoryTables>) => {
    const fake = fakeSupabase(
      Object.fromEntries(Object.entries(tables).map(([table, data]) => [table, { data: data as never[] }])),
    );
    return { fake, store: createSupabaseCmsStore(fake.client, SUPABASE_URL) };
  };

  it("memory-store e supabase-store dão o mesmo resultado para o mesmo conteúdo", async () => {
    const { store } = supabaseStore(withFuturePublication(seed()));
    expect(await loadContentOverview(store, "admin", NOW)).toEqual(await load());
  });

  it("o número de consultas não cresce com o número de itens (sem N+1)", async () => {
    const small = supabaseStore(seed());
    await loadContentOverview(small.store, "admin", NOW);

    const large = seed();
    for (let index = 0; index < 150; index += 1) {
      large.areas!.push(area(`area-extra-${index}`, `Área extra ${index}`, "draft", false));
      large.services!.push(service(`servico-extra-${index}`, `Serviço extra ${index}`, "published"));
      large.cases!.push(caseRow(`case-extra-${index}`, `Case extra ${index}`, "draft", "cat-ok"));
    }
    const big = supabaseStore(large);
    const overview = await loadContentOverview(big.store, "admin", NOW);

    expect(overview.review.length).toBeGreaterThan(450);
    expect(big.fake.calls.length).toBe(small.fake.calls.length);
    // Uma consulta por tabela, sem filtro por item.
    expect(new Set(big.fake.calls.map((call) => call.table)).size).toBe(big.fake.calls.length);
    expect(big.fake.calls.every((call) => call.filters.length === 0)).toBe(true);
  });

  it("falha de leitura sobe como erro, em vez de dizer que não há nada para revisar", async () => {
    const failure = new Error("banco fora do ar");
    await expect(loadContentOverview({ snapshot: () => Promise.reject(failure) }, "admin", NOW)).rejects.toBe(failure);

    const failing = fakeSupabase({ areas: { error: { message: "falhou", code: "XX000" } } });
    await expect(
      loadContentOverview(createSupabaseCmsStore(failing.client, SUPABASE_URL), "admin", NOW),
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });

  it("base vazia não é erro: cinco grupos vazios e fila vazia", async () => {
    const { groups, review, counts } = await loadContentOverview(createMemoryCmsStore().store, "viewer", NOW);
    expect(groups.map((group) => group.items.length)).toEqual([0, 0, 0, 0, 0]);
    expect(review).toEqual([]);
    expect(counts).toEqual({ draft: 0, published: 0, archived: 0 });
  });

  it("reflete o que o editor acabou de fazer: completar tira da fila; arquivar também", async () => {
    const { store, tables } = createMemoryCmsStore({ areas: [area("area-a", "Área A", "draft", false)] });
    const deps: CmsDeps = {
      store,
      audit: async () => undefined,
      invalidate: () => undefined,
      now: () => NOW,
    };
    const editor = { id: "editor-1", role: "editor" as const };
    expect((await loadContentOverview(store, "editor", NOW)).review.map((item) => item.id)).toEqual([uid("area-a")]);

    const saved = await saveContent(
      deps,
      editor,
      AREA,
      { name: "Área A", slug: "area-a", summary: "Resumo da área A.", description: "Descrição completa da área A." },
      { id: uid("area-a"), expectedUpdatedAt: tables.areas[0].updated_at },
    );
    expect((await loadContentOverview(store, "editor", NOW)).review).toEqual([]);

    tables.areas[0].provisional = true;
    expect((await loadContentOverview(store, "editor", NOW)).review.map((item) => item.id)).toEqual([uid("area-a")]);
    await runContentCommand(deps, editor, AREA, { id: uid("area-a"), expectedUpdatedAt: saved.updatedAt }, "archive");
    expect((await loadContentOverview(store, "editor", NOW)).review).toEqual([]);
  });
});
