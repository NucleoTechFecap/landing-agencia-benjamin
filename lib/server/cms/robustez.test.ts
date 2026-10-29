/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : robustez.test.ts
 Descrição    : Achados da revisão TECH-13: gravação atômica, ids repetidos e cache relacionado.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 27/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 27/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-13).
 28/10/2026 Vinícius Nishimura Reis  Verifica rollback de item e vínculos com FK inválida (TECH-13).
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

function setup() {
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
    store,
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

describe("gravação atômica (TECH-13)", () => {
  it("criação: FK inválida nos serviços não deixa item nem vínculo gravado", async () => {
    const env = setup();
    const invalidServiceId = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
    await expect(
      saveContent(env.deps, env.actor("editor"), CASE, caseInput("case-novo", [invalidServiceId])),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(env.tables.cases).toEqual([]);
    expect(env.tables.case_services).toEqual([]);
    expect(env.tables.case_media).toEqual([]);
    expect(env.audits).toEqual([]);
    expect(env.changes).toEqual([]);
  });

  it("edição: FK inválida na galeria reverte o texto, vínculos e ordem anteriores", async () => {
    const env = setup();
    const meridiano = await saveContent(env.deps, env.actor("editor"), CASE, caseInput("meridiano", [ID.social]));
    const before = structuredClone({
      item: env.tables.cases.find((row) => row.id === meridiano.id),
      services: env.tables.case_services.filter((row) => row.case_id === meridiano.id),
      gallery: env.tables.case_media.filter((row) => row.case_id === meridiano.id),
    });
    await expect(
      saveContent(
        env.deps,
        env.actor("editor"),
        CASE,
        {
          ...caseInput("meridiano", [ID.audiovisual]),
          title: "Título novo",
          galleryIds: ["eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"],
        },
        { id: meridiano.id, expectedUpdatedAt: meridiano.updatedAt },
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect({
      item: env.tables.cases.find((row) => row.id === meridiano.id),
      services: env.tables.case_services.filter((row) => row.case_id === meridiano.id),
      gallery: env.tables.case_media.filter((row) => row.case_id === meridiano.id),
    }).toEqual(before);
  });
});

describe("ids repetidos no formulário (TECH-13)", () => {
  it("campo múltiplo chega sem repetição, na ordem da primeira ocorrência", () => {
    const form = new FormData();
    for (const id of [ID.social, ID.audiovisual, ID.social, "", ID.audiovisual]) form.append("serviceIds", id);
    expect(many(form, "serviceIds")).toEqual([ID.social, ID.audiovisual]);
  });
});
