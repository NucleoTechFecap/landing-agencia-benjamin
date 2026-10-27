/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : services.test.ts
 Descrição    : Testes das regras do CMS de serviços (áreas, imagem, destaque e impacto em cases).

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/domain/auth/rbac";
import type { ContentChange } from "../content/invalidate";
import { publishProblems, runContentCommand, saveContent, type CmsDeps } from "./content-service";
import { SERVICE } from "./entities";
import { createMemoryCmsStore, type MemoryTables } from "./memory-store";

const NOW = new Date("2026-10-26T15:00:00.000Z");
const control = { provisional: false, archived_at: null, updated_at: "2026-10-20T00:00:00.000Z" };
const live = { ...control, status: "published" as const, published_at: "2026-10-20T00:00:00.000Z" };
const AREA_ID = "8b4f6a52-6c43-4a8f-9d55-2f5a2f6f0c11";
const OTHER_AREA = "2c1d0b55-0f8e-4a43-9a8e-3c6d1a7b9e22";
const MEDIA_ID = "5d2f6c7e-1a2b-4c3d-8e9f-0a1b2c3d4e5f";

function setup(seed: Partial<MemoryTables> = {}) {
  const { store, tables } = createMemoryCmsStore({
    areas: [
      {
        ...live,
        id: AREA_ID,
        slug: "criacao",
        name: "Criação",
        summary: "s",
        description: "d",
        highlights: [],
        icon: null,
        sort_order: 1,
      },
      {
        ...control,
        status: "draft",
        published_at: null,
        id: OTHER_AREA,
        slug: "copywriting",
        name: "Copywriting",
        summary: null,
        description: null,
        highlights: [],
        icon: null,
        sort_order: 2,
      },
    ],
    media_assets: [
      {
        id: MEDIA_ID,
        path: "/brand/cases/fecap.webp",
        mime_type: "image/webp",
        width: 1200,
        height: 750,
        alt_text: "Peça de campanha",
        decorative: false,
      },
    ],
    ...seed,
  });
  const changes: ContentChange[] = [];
  const deps: CmsDeps = {
    store,
    audit: async () => {},
    invalidate: (change) => void changes.push(change),
    now: () => NOW,
  };
  return { deps, tables, changes, actor: (role: Role) => ({ id: "u1", role }) };
}

const complete = {
  name: "Audiovisual",
  slug: "audiovisual",
  summary: "Vídeos, fotos e coberturas.",
  description: "Roteiro, captação e edição de vídeos institucionais e para redes.",
  examples: ["Vídeos institucionais", "Cobertura de eventos"],
  areaIds: [AREA_ID],
  imageId: MEDIA_ID,
  featured: true,
  order: "7",
};

describe("CMS de serviços (ADM-06)", () => {
  it("cria rascunho com áreas, exemplos, imagem e destaque", async () => {
    const env = setup();
    const saved = await saveContent(env.deps, env.actor("editor"), SERVICE, complete);
    expect(env.tables.services[0]).toMatchObject({
      slug: "audiovisual",
      image_media_id: MEDIA_ID,
      featured: true,
      sort_order: 7,
      status: "draft",
    });
    expect(env.tables.service_areas).toEqual([{ service_id: saved.id, area_id: AREA_ID }]);
    const snapshot = await env.deps.store.snapshot();
    expect(snapshot.services[0].image).toMatchObject({ id: MEDIA_ID, alt: "Peça de campanha" });
  });

  it("troca as áreas vinculadas ao editar (inclui nova, remove antiga)", async () => {
    const env = setup();
    const saved = await saveContent(env.deps, env.actor("editor"), SERVICE, complete);
    await saveContent(
      env.deps,
      env.actor("editor"),
      SERVICE,
      { ...complete, areaIds: [OTHER_AREA] },
      { id: saved.id, expectedUpdatedAt: saved.updatedAt },
    );
    expect(env.tables.service_areas).toEqual([{ service_id: saved.id, area_id: OTHER_AREA }]);
  });

  it("publicar sem área é bloqueado (R03); com área publicada, publica", async () => {
    const env = setup();
    const saved = await saveContent(env.deps, env.actor("editor"), SERVICE, { ...complete, areaIds: [] });
    await expect(
      runContentCommand(
        env.deps,
        env.actor("editor"),
        SERVICE,
        { id: saved.id, expectedUpdatedAt: saved.updatedAt },
        "publish",
      ),
    ).rejects.toMatchObject({ fieldErrors: { publicacao: ["Áreas: Vincule ao menos uma área de atuação."] } });
    const fixed = await saveContent(env.deps, env.actor("editor"), SERVICE, complete, {
      id: saved.id,
      expectedUpdatedAt: saved.updatedAt,
    });
    await runContentCommand(
      env.deps,
      env.actor("editor"),
      SERVICE,
      { id: fixed.id, expectedUpdatedAt: fixed.updatedAt },
      "publish",
    );
    expect(env.tables.services[0].status).toBe("published");
    expect(env.changes).toEqual([{ entity: "service", slug: "audiovisual" }]);
  });

  it("imagem escolhida sem texto alternativo impede publicar (R12)", async () => {
    const env = setup({
      media_assets: [
        {
          id: MEDIA_ID,
          path: "/x.webp",
          mime_type: "image/webp",
          width: null,
          height: null,
          alt_text: null,
          decorative: false,
        },
      ],
    });
    const saved = await saveContent(env.deps, env.actor("editor"), SERVICE, complete);
    const snapshot = await env.deps.store.snapshot();
    const service = snapshot.services.find((item) => item.id === saved.id)!;
    expect(publishProblems(SERVICE, service, snapshot, NOW)).toEqual(["Imagem sem texto alternativo: /x.webp."]);
  });

  it("arquivar o único serviço de um case publicado é bloqueado (R07)", async () => {
    const env = setup({
      services: [
        {
          ...live,
          id: "s1",
          slug: "audiovisual",
          name: "Audiovisual",
          summary: "s",
          description: "d",
          examples: [],
          icon: null,
          image_media_id: null,
          featured: false,
          sort_order: 1,
        },
      ],
      service_areas: [{ service_id: "s1", area_id: AREA_ID }],
      case_categories: [{ ...live, id: "c1", slug: "social", name: "Social", description: null, sort_order: 1 }],
      cases: [
        {
          ...live,
          id: "k1",
          slug: "meridiano",
          title: "Meridiano",
          client_name: "Meridiano",
          category_id: "c1",
          delivery_type: null,
          summary: "Resumo com mais de trinta caracteres aqui.",
          challenge: null,
          solution: null,
          results: null,
          cover_media_id: null,
          external_links: [],
          reference_month: null,
          team: [],
          featured: false,
          sort_order: 1,
        },
      ],
      case_services: [{ case_id: "k1", service_id: "s1" }],
    });
    await expect(
      runContentCommand(
        env.deps,
        env.actor("editor"),
        SERVICE,
        { id: "s1", expectedUpdatedAt: control.updated_at },
        "archive",
      ),
    ).rejects.toMatchObject({ code: "CONFLICT", fieldErrors: { impacto: [expect.stringMatching(/Meridiano/)] } });
  });
});
