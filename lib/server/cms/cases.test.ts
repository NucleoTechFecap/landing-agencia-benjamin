/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : cases.test.ts
 Descrição    : Testes das regras do CMS de cases e categorias com store em memória.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/domain/auth/rbac";
import { runContentCommand, saveContent, type CmsDeps } from "./content-service";
import { CASE, CATEGORY } from "./entities";
import { createMemoryCmsStore, type MemoryTables } from "./memory-store";

const NOW = new Date("2026-10-26T15:00:00.000Z");
const control = { provisional: false, archived_at: null, updated_at: "2026-10-20T00:00:00.000Z" };
const live = { ...control, status: "published" as const, published_at: "2026-10-20T00:00:00.000Z" };
const draft = { ...control, status: "draft" as const, published_at: null };
const ID = {
  category: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  draftCategory: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
  service: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
  cover: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
  photo1: "cccccccc-cccc-4ccc-8ccc-ccccccccccc2",
  photo2: "cccccccc-cccc-4ccc-8ccc-ccccccccccc3",
};
const media = (id: string, alt: string | null) => ({
  id,
  path: `/brand/${id}.webp`,
  mime_type: "image/webp",
  width: 1200,
  height: 750,
  alt_text: alt,
  decorative: false,
});

function setup(seed: Partial<MemoryTables> = {}) {
  const { store, tables } = createMemoryCmsStore({
    case_categories: [
      {
        ...live,
        id: ID.category,
        slug: "social-media-e-criacao",
        name: "Social Media & Criação",
        description: null,
        sort_order: 1,
      },
      {
        ...draft,
        id: ID.draftCategory,
        slug: "rascunho",
        name: "Categoria rascunho",
        description: null,
        sort_order: 2,
      },
    ],
    services: [
      {
        ...live,
        id: ID.service,
        slug: "social-media",
        name: "Social Media",
        summary: "s",
        description: "d",
        examples: [],
        icon: null,
        image_media_id: null,
        featured: false,
        sort_order: 1,
      },
    ],
    media_assets: [media(ID.cover, "Capa"), media(ID.photo1, "Peça 1"), media(ID.photo2, "Peça 2")],
    ...seed,
  });
  const deps: CmsDeps = { store, audit: async () => {}, invalidate: () => {}, now: () => NOW };
  return { deps, tables, actor: (role: Role) => ({ id: "u1", role }) };
}

const complete = {
  title: "Social media para a Meridiano",
  slug: "meridiano",
  client: "Meridiano",
  categoryId: ID.category,
  serviceIds: [ID.service],
  deliveryType: "Campanha",
  summary: "Desdobramentos visuais e criativos para as redes da Meridiano.",
  coverId: ID.cover,
  galleryIds: [ID.photo2, ID.photo1],
  externalLinks: [{ label: "Post", url: "https://www.instagram.com/agenciabenja" }],
  date: "2026-09",
  team: ["Ana", "Bruno"],
  featured: true,
  order: "1",
};

describe("CMS de cases (ADM-08)", () => {
  it("grava capa, serviços, links, mês e galeria na ordem escolhida", async () => {
    const env = setup();
    const saved = await saveContent(env.deps, env.actor("editor"), CASE, complete);
    expect(env.tables.cases[0]).toMatchObject({
      cover_media_id: ID.cover,
      reference_month: "2026-09-01",
      team: ["Ana", "Bruno"],
    });
    expect(env.tables.case_services).toEqual([{ case_id: saved.id, service_id: ID.service }]);
    const snapshot = await env.deps.store.snapshot();
    expect(snapshot.cases[0].gallery.map((item) => item.alt)).toEqual(["Peça 2", "Peça 1"]);
    expect(snapshot.cases[0].date).toBe("2026-09");
  });

  it("publicar lista o que falta com os nomes dos campos do painel (CASE-11)", async () => {
    const env = setup();
    const saved = await saveContent(env.deps, env.actor("editor"), CASE, { title: "Meridiano", slug: "meridiano" });
    await expect(
      runContentCommand(
        env.deps,
        env.actor("editor"),
        CASE,
        { id: saved.id, expectedUpdatedAt: saved.updatedAt },
        "publish",
      ),
    ).rejects.toMatchObject({
      fieldErrors: {
        publicacao: expect.arrayContaining([
          "Cliente: Informe o cliente.",
          "Categoria: Escolha a categoria.",
          "Serviços: Relacione ao menos um serviço.",
          expect.stringMatching(/^Capa: /),
        ]),
      },
    });
  });

  it("capa sem texto alternativo impede publicar (R12)", async () => {
    const env = setup({ media_assets: [media(ID.cover, null)] });
    const saved = await saveContent(env.deps, env.actor("editor"), CASE, { ...complete, galleryIds: [] });
    await expect(
      runContentCommand(
        env.deps,
        env.actor("editor"),
        CASE,
        { id: saved.id, expectedUpdatedAt: saved.updatedAt },
        "publish",
      ),
    ).rejects.toMatchObject({
      fieldErrors: { publicacao: expect.arrayContaining([expect.stringMatching(/texto alternativo/i)]) },
    });
  });

  it("categoria em rascunho impede publicar o case (R06)", async () => {
    const env = setup();
    const saved = await saveContent(env.deps, env.actor("editor"), CASE, { ...complete, categoryId: ID.draftCategory });
    await expect(
      runContentCommand(
        env.deps,
        env.actor("editor"),
        CASE,
        { id: saved.id, expectedUpdatedAt: saved.updatedAt },
        "publish",
      ),
    ).rejects.toMatchObject({ fieldErrors: { publicacao: ["Case publicado com categoria não publicada."] } });
  });

  it("case completo publica", async () => {
    const env = setup();
    const saved = await saveContent(env.deps, env.actor("editor"), CASE, complete);
    const result = await runContentCommand(
      env.deps,
      env.actor("editor"),
      CASE,
      { id: saved.id, expectedUpdatedAt: saved.updatedAt },
      "publish",
    );
    expect(result.status).toBe("published");
  });
});

describe("CMS de categorias (ADM-08)", () => {
  it("cria e publica só com nome e slug", async () => {
    const env = setup();
    const saved = await saveContent(env.deps, env.actor("editor"), CATEGORY, {
      name: "Copywriting",
      slug: "copywriting",
    });
    expect(
      (
        await runContentCommand(
          env.deps,
          env.actor("editor"),
          CATEGORY,
          { id: saved.id, expectedUpdatedAt: saved.updatedAt },
          "publish",
        )
      ).status,
    ).toBe("published");
  });

  it("despublicar categoria usada por case publicado é bloqueado", async () => {
    const env = setup();
    const saved = await saveContent(env.deps, env.actor("editor"), CASE, complete);
    await runContentCommand(
      env.deps,
      env.actor("editor"),
      CASE,
      { id: saved.id, expectedUpdatedAt: saved.updatedAt },
      "publish",
    );
    await expect(
      runContentCommand(
        env.deps,
        env.actor("editor"),
        CATEGORY,
        { id: ID.category, expectedUpdatedAt: control.updated_at },
        "unpublish",
      ),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      fieldErrors: { impacto: ["1 case(s) publicado(s) usam esta categoria."] },
    });
  });

  it("excluir categoria arquivada ainda usada por rascunho é bloqueado com a lista", async () => {
    const env = setup({
      case_categories: [
        {
          ...control,
          status: "archived",
          archived_at: "2026-10-21T00:00:00.000Z",
          published_at: null,
          id: ID.category,
          slug: "antiga",
          name: "Antiga",
          description: null,
          sort_order: 1,
        },
      ],
    });
    await saveContent(env.deps, env.actor("editor"), CASE, {
      title: "Rascunho",
      slug: "rascunho-case",
      categoryId: ID.category,
    });
    await expect(
      runContentCommand(
        env.deps,
        env.actor("admin"),
        CATEGORY,
        { id: ID.category, expectedUpdatedAt: control.updated_at },
        "delete",
      ),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      fieldErrors: { impacto: [expect.stringMatching(/1 case\(s\) usam esta categoria/)] },
    });
  });
});
