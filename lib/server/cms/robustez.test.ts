/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : robustez.test.ts
 Descrição    : Achados da revisão TECH-13: gravação parcial, ids repetidos e páginas relacionadas no cache.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 27/10/2026
 Modificado em: 27/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 27/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/domain/auth/rbac";
import type { AuditInput } from "../audit";
import type { ContentChange } from "../content/invalidate";
import { runContentCommand, saveContent, type CmsDeps } from "./content-service";
import { CASE, SERVICE } from "./entities";
import { many } from "./form-data";
import { createMemoryCmsStore } from "./memory-store";
import type { CmsStore } from "./store";

const NOW = new Date("2026-10-27T15:00:00.000Z");
const control = { provisional: false, archived_at: null, updated_at: "2026-10-20T00:00:00.000Z" };
const live = { ...control, status: "published" as const, published_at: "2026-10-20T00:00:00.000Z" };
const ID = {
  category: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
  social: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
  audiovisual: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2",
  cover: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
};
const service = (id: string, slug: string, name: string, order: number) => ({
  ...live,
  id,
  slug,
  name,
  summary: "s",
  description: "d",
  examples: [],
  icon: null,
  image_media_id: null,
  featured: false,
  sort_order: order,
});

function setup(wrap: (store: CmsStore) => CmsStore = (store) => store) {
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
    ],
    services: [
      service(ID.social, "social-media", "Social Media", 1),
      service(ID.audiovisual, "audiovisual", "Audiovisual", 2),
    ],
    media_assets: [
      {
        id: ID.cover,
        path: "/brand/capa.webp",
        mime_type: "image/webp",
        width: 1200,
        height: 750,
        alt_text: "Capa",
        decorative: false,
      },
    ],
  });
  const audits: AuditInput[] = [];
  const changes: ContentChange[] = [];
  const deps: CmsDeps = {
    store: wrap(store),
    audit: async (input) => void audits.push(input),
    invalidate: (change) => void changes.push(change),
    now: () => NOW,
  };
  return { deps, tables, audits, changes, actor: (role: Role) => ({ id: "u1", role }) };
}

const caseInput = (slug: string, serviceIds: string[]) => ({
  title: `Case ${slug}`,
  slug,
  client: "Cliente",
  categoryId: ID.category,
  serviceIds,
  summary: "Resumo do case usado nos testes de robustez do CMS.",
  coverId: ID.cover,
  order: "1",
});

async function publishedCase(env: ReturnType<typeof setup>, slug: string, serviceIds: string[]) {
  const saved = await saveContent(env.deps, env.actor("editor"), CASE, caseInput(slug, serviceIds));
  await runContentCommand(
    env.deps,
    env.actor("editor"),
    CASE,
    { id: saved.id, expectedUpdatedAt: saved.updatedAt },
    "publish",
  );
  const current = env.tables.cases.find((row) => row.id === saved.id)!;
  return { id: saved.id, updatedAt: String(current.updated_at) };
}

describe("páginas relacionadas no aquecimento do cache (TECH-13)", () => {
  it("arquivar um case aquece a página do serviço dele e a dos relacionados da categoria", async () => {
    const env = setup();
    const meridiano = await publishedCase(env, "meridiano", [ID.social]);
    await publishedCase(env, "fecap", [ID.audiovisual]);
    env.changes.length = 0;
    await runContentCommand(
      env.deps,
      env.actor("editor"),
      CASE,
      { id: meridiano.id, expectedUpdatedAt: meridiano.updatedAt },
      "archive",
    );
    expect(env.changes).toEqual([
      { entity: "case", slug: "meridiano", relatedPaths: ["/servicos/social-media", "/cases/fecap"] },
    ]);
  });

  it("trocar o serviço de um case publicado aquece a página do serviço antigo e a do novo", async () => {
    const env = setup();
    const meridiano = await publishedCase(env, "meridiano", [ID.social]);
    env.changes.length = 0;
    await saveContent(env.deps, env.actor("editor"), CASE, caseInput("meridiano", [ID.audiovisual]), {
      id: meridiano.id,
      expectedUpdatedAt: meridiano.updatedAt,
    });
    expect(env.changes[0].relatedPaths?.sort()).toEqual(["/servicos/audiovisual", "/servicos/social-media"]);
  });

  it("arquivar um serviço aquece as páginas dos cases que o exibem", async () => {
    const env = setup();
    await publishedCase(env, "meridiano", [ID.social, ID.audiovisual]);
    const current = env.tables.services.find((row) => row.id === ID.audiovisual)!;
    env.changes.length = 0;
    await runContentCommand(
      env.deps,
      env.actor("editor"),
      SERVICE,
      { id: ID.audiovisual, expectedUpdatedAt: String(current.updated_at) },
      "archive",
    );
    expect(env.changes).toEqual([{ entity: "service", slug: "audiovisual", relatedPaths: ["/cases/meridiano"] }]);
  });
});

describe("gravação parcial (TECH-13)", () => {
  const brokenLinks = (store: CmsStore): CmsStore => ({
    ...store,
    syncLinks: async () => {
      throw new Error("conexão encerrada");
    },
  });

  it("edição de item publicado: registra a falha, atualiza o site e explica o que ficou salvo", async () => {
    let failGallery = false;
    const env = setup((store) => ({
      ...store,
      syncGallery: async (...args) => {
        if (failGallery) throw new Error("conexão encerrada");
        return store.syncGallery(...args);
      },
    }));
    const meridiano = await publishedCase(env, "meridiano", [ID.social]);
    env.audits.length = 0;
    env.changes.length = 0;
    failGallery = true;
    await expect(
      saveContent(
        env.deps,
        env.actor("editor"),
        CASE,
        { ...caseInput("meridiano", [ID.social]), title: "Título novo" },
        { id: meridiano.id, expectedUpdatedAt: meridiano.updatedAt },
      ),
    ).rejects.toMatchObject({ code: "INTERNAL_ERROR", message: expect.stringContaining("O texto foi salvo") });
    expect(env.tables.cases.find((row) => row.id === meridiano.id)?.title).toBe("Título novo");
    expect(env.audits).toEqual([
      expect.objectContaining({
        event: "content.updated",
        outcome: "failure",
        metadata: expect.objectContaining({ reason: "vinculos", slug: "meridiano" }),
      }),
    ]);
    expect(env.changes).toEqual([expect.objectContaining({ entity: "case", slug: "meridiano" })]);
  });

  it("criação: avisa que o rascunho existe e não mexe no cache", async () => {
    const env = setup(brokenLinks);
    await expect(
      saveContent(env.deps, env.actor("editor"), CASE, caseInput("case-novo", [ID.social])),
    ).rejects.toMatchObject({
      message: expect.stringContaining("O rascunho foi criado"),
    });
    expect(env.tables.cases).toHaveLength(1);
    expect(env.audits).toEqual([expect.objectContaining({ event: "content.created", outcome: "failure" })]);
    expect(env.changes).toEqual([]);
  });
});

describe("ids repetidos no formulário (TECH-13)", () => {
  it("campo múltiplo chega sem repetição, na ordem da primeira ocorrência", () => {
    const form = new FormData();
    for (const id of [ID.social, ID.audiovisual, ID.social, "", ID.audiovisual]) form.append("serviceIds", id);
    expect(many(form, "serviceIds")).toEqual([ID.social, ID.audiovisual]);
  });
});
