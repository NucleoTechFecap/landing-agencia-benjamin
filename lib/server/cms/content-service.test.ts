/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : content-service.test.ts
 Descrição    : Testes das regras de gravação e publicação do CMS (áreas) com store em memória.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Slug em branco gerado pelo servidor, sem preenchimento no navegador (TECH-12).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it, vi } from "vitest";
import type { Role } from "@/lib/domain/auth/rbac";
import type { AuditInput } from "../audit";
import type { ContentChange } from "../content/invalidate";
import { runContentCommand, saveContent, type CmsDeps } from "./content-service";
import { AREA } from "./entities";
import { createMemoryCmsStore, type MemoryTables } from "./memory-store";

const NOW = new Date("2026-10-26T15:00:00.000Z");
const control = { provisional: false, archived_at: null, updated_at: "2026-10-20T00:00:00.000Z" };
const live = { ...control, status: "published" as const, published_at: "2026-10-20T00:00:00.000Z" };

function setup(seed: Partial<MemoryTables> = {}, options: { auditFails?: boolean } = {}) {
  const { store, tables } = createMemoryCmsStore(seed);
  const audits: AuditInput[] = [];
  const changes: ContentChange[] = [];
  const update = vi.spyOn(store, "update");
  const deps: CmsDeps = {
    store,
    audit: async (input) => {
      if (options.auditFails && input.outcome !== "failure") throw new Error("auditoria fora do ar");
      audits.push(input);
    },
    invalidate: (change) => void changes.push(change),
    now: () => NOW,
  };
  const actor = (role: Role) => ({ id: "user-1", role });
  return { deps, tables, audits, changes, update, actor };
}

const complete = {
  name: "Criação",
  slug: "criacao",
  summary: "Identidade visual e audiovisual.",
  description: "Dá forma às ideias com identidade visual, design e produção audiovisual.",
  highlights: ["Identidade visual"],
  icon: "raio",
  order: "2",
};

async function createArea(env: ReturnType<typeof setup>, input: Record<string, unknown> = complete) {
  return saveContent(env.deps, env.actor("editor"), AREA, input);
}

describe("CMS de áreas — gravação (ADM-07)", () => {
  it("cria sempre como rascunho, audita e não mexe no cache público", async () => {
    const env = setup();
    const saved = await createArea(env, { name: "Criação", slug: "criacao" });
    expect(saved).toMatchObject({ status: "draft", created: true });
    expect(env.tables.areas[0]).toMatchObject({ slug: "criacao", status: "draft", summary: null });
    expect(env.audits).toEqual([
      expect.objectContaining({ event: "content.created", metadata: { entity: "area", slug: "criacao" } }),
    ]);
    expect(env.changes).toEqual([]);
  });

  it("devolve erro por campo e não grava nada", async () => {
    const env = setup();
    await expect(createArea(env, { name: "", slug: "Com Espaço" })).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      fieldErrors: { name: expect.any(Array), slug: expect.any(Array) },
    });
    expect(env.tables.areas).toEqual([]);
  });

  it("recusa slug repetido", async () => {
    const env = setup();
    await createArea(env);
    await expect(createArea(env, { ...complete, name: "Outra" })).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      fieldErrors: { slug: [expect.stringMatching(/Já existe/)] },
    });
  });

  it("edição concorrente: versão desatualizada vira CONFLICT", async () => {
    const env = setup();
    const { id, updatedAt } = await createArea(env);
    await saveContent(
      env.deps,
      env.actor("editor"),
      AREA,
      { ...complete, name: "Criação 2" },
      { id, expectedUpdatedAt: updatedAt },
    );
    await expect(
      saveContent(
        env.deps,
        env.actor("editor"),
        AREA,
        { ...complete, name: "Criação 3" },
        { id, expectedUpdatedAt: updatedAt },
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("leitor (viewer) não cria nem edita", async () => {
    const env = setup();
    await expect(saveContent(env.deps, env.actor("viewer"), AREA, complete)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("editar área publicada exige conteúdo completo e invalida o cache", async () => {
    const env = setup({
      areas: [
        {
          ...live,
          id: "a1",
          slug: "criacao",
          name: "Criação",
          summary: "Resumo da área.",
          description: "Descrição completa da área de criação.",
          highlights: [],
          icon: null,
          sort_order: 1,
        },
      ],
    });
    const ref = { id: "a1", expectedUpdatedAt: control.updated_at };
    await expect(
      saveContent(env.deps, env.actor("editor"), AREA, { ...complete, summary: "" }, ref),
    ).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      fieldErrors: { publicacao: [expect.stringMatching(/^Resumo/)] },
    });
    await saveContent(env.deps, env.actor("editor"), AREA, complete, ref);
    expect(env.changes).toEqual([{ entity: "area", slug: "criacao" }]);
  });

  it("slug fica travado depois da primeira publicação", async () => {
    const env = setup({
      areas: [
        {
          ...live,
          id: "a1",
          slug: "criacao",
          name: "Criação",
          summary: "Resumo da área.",
          description: "Descrição completa da área.",
          highlights: [],
          icon: null,
          sort_order: 1,
        },
      ],
    });
    await expect(
      saveContent(
        env.deps,
        env.actor("admin"),
        AREA,
        { ...complete, slug: "criacao-nova" },
        { id: "a1", expectedUpdatedAt: control.updated_at },
      ),
    ).rejects.toMatchObject({ fieldErrors: { slug: [expect.stringMatching(/não muda/)] } });
  });

  it("área arquivada precisa ser restaurada antes de editar", async () => {
    const env = setup({
      areas: [
        {
          ...control,
          status: "archived",
          archived_at: "2026-10-21T00:00:00.000Z",
          published_at: null,
          id: "a1",
          slug: "criacao",
          name: "Criação",
          summary: null,
          description: null,
          highlights: [],
          icon: null,
          sort_order: 1,
        },
      ],
    });
    await expect(
      saveContent(env.deps, env.actor("editor"), AREA, complete, { id: "a1", expectedUpdatedAt: control.updated_at }),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });
});

describe("CMS de áreas — publicação (ADM-07)", () => {
  it("publicar incompleto lista o que falta; completo publica, audita antes e invalida", async () => {
    const env = setup();
    const draft = await createArea(env, { name: "Criação", slug: "criacao" });
    await expect(
      runContentCommand(
        env.deps,
        env.actor("editor"),
        AREA,
        { id: draft.id, expectedUpdatedAt: draft.updatedAt },
        "publish",
      ),
    ).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      fieldErrors: { publicacao: expect.arrayContaining([expect.stringMatching(/^Resumo/)]) },
    });

    const full = await saveContent(env.deps, env.actor("editor"), AREA, complete, {
      id: draft.id,
      expectedUpdatedAt: draft.updatedAt,
    });
    env.audits.length = 0;
    const result = await runContentCommand(
      env.deps,
      env.actor("editor"),
      AREA,
      { id: full.id, expectedUpdatedAt: full.updatedAt },
      "publish",
    );
    expect(result).toEqual({ status: "published", warnings: [] });
    expect(env.tables.areas[0]).toMatchObject({
      status: "published",
      published_at: NOW.toISOString(),
      archived_at: null,
    });
    expect(env.audits).toEqual([
      expect.objectContaining({
        event: "content.published",
        outcome: "success",
        metadata: expect.objectContaining({ fromStatus: "draft", toStatus: "published" }),
      }),
    ]);
    expect(env.changes).toEqual([{ entity: "area", slug: "criacao" }]);
  });

  it("arquivar área que deixaria serviço publicado sem área é bloqueado (TECH-05)", async () => {
    const area = {
      ...live,
      id: "a1",
      slug: "criacao",
      name: "Criação",
      summary: "s",
      description: "d",
      highlights: [],
      icon: null,
      sort_order: 1,
    };
    const env = setup({
      areas: [area],
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
      service_areas: [{ service_id: "s1", area_id: "a1" }],
    });
    await expect(
      runContentCommand(
        env.deps,
        env.actor("admin"),
        AREA,
        { id: "a1", expectedUpdatedAt: control.updated_at },
        "archive",
      ),
    ).rejects.toMatchObject({ code: "CONFLICT", fieldErrors: { impacto: [expect.stringMatching(/Audiovisual/)] } });
    expect(env.update).not.toHaveBeenCalled();
  });

  it("despublicar avisa sobre CTA que passa a usar o fallback", async () => {
    const env = setup({
      areas: [
        {
          ...live,
          id: "a1",
          slug: "criacao",
          name: "Criação",
          summary: "s",
          description: "d",
          highlights: [],
          icon: null,
          sort_order: 1,
        },
      ],
      ctas: [
        {
          ...live,
          id: "c1",
          label: "Ver criação",
          placement: "footer",
          target_kind: "area",
          target_path: null,
          target_url: null,
          target_service_id: null,
          target_case_id: null,
          target_area_id: "a1",
          sort_order: 1,
        },
      ],
    });
    const result = await runContentCommand(
      env.deps,
      env.actor("editor"),
      AREA,
      { id: "a1", expectedUpdatedAt: control.updated_at },
      "unpublish",
    );
    expect(result.status).toBe("draft");
    expect(result.warnings).toEqual(["ctas-fallback"]);
  });

  it("excluir só a partir de arquivado e só com permissão de exclusão", async () => {
    const env = setup();
    const { id, updatedAt } = await createArea(env);
    await expect(
      runContentCommand(env.deps, env.actor("admin"), AREA, { id, expectedUpdatedAt: updatedAt }, "delete"),
    ).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
    await runContentCommand(env.deps, env.actor("editor"), AREA, { id, expectedUpdatedAt: updatedAt }, "archive");
    const archived = env.tables.areas[0].updated_at;
    await expect(
      runContentCommand(env.deps, env.actor("editor"), AREA, { id, expectedUpdatedAt: archived }, "delete"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(
      await runContentCommand(env.deps, env.actor("admin"), AREA, { id, expectedUpdatedAt: archived }, "delete"),
    ).toEqual({
      status: "deleted",
      warnings: [],
    });
    expect(env.tables.areas).toEqual([]);
  });

  it("evento crítico sem auditoria aborta a operação (TECH-10)", async () => {
    const env = setup({}, { auditFails: true });
    const { store } = env.deps;
    const draft = await store.insert("areas", {
      slug: "criacao",
      name: "Criação",
      summary: complete.summary,
      description: complete.description,
    });
    await expect(
      runContentCommand(
        env.deps,
        env.actor("editor"),
        AREA,
        { id: draft.id, expectedUpdatedAt: draft.updatedAt },
        "publish",
      ),
    ).rejects.toThrow(/auditoria/);
    expect(env.tables.areas[0].status).toBe("draft");
  });
});

describe("endereço gerado pelo servidor (TECH-12)", () => {
  it("slug em branco na criação vira o nome normalizado e único", async () => {
    const env = setup();
    await createArea(env, { name: "Criação", slug: "criacao" });
    const saved = await createArea(env, { name: "Criação", slug: "" });
    expect(env.tables.areas.find((row) => row.id === saved.id)?.slug).toBe("criacao-2");
  });

  it("slug apagado na edição mantém o atual", async () => {
    const env = setup();
    const { id, updatedAt } = await createArea(env, { name: "Copywriting", slug: "copywriting" });
    await saveContent(
      env.deps,
      env.actor("editor"),
      AREA,
      { name: "Copy", slug: "" },
      { id, expectedUpdatedAt: updatedAt },
    );
    expect(env.tables.areas[0]).toMatchObject({ slug: "copywriting", name: "Copy" });
  });

  it("sem slug e sem nome continua apontando o erro no formulário", async () => {
    const env = setup();
    await expect(createArea(env, { name: "", slug: "" })).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });
});
