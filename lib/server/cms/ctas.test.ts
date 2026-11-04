/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : ctas.test.ts
 Descrição    : Testes do CMS de CTAs: gravação do destino, publicação, permissões e integridade.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-11).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/domain/auth/rbac";
import type { AuditInput } from "../audit";
import type { ContentChange } from "../content/invalidate";
import { tagsForChange } from "../content/invalidate";
import { CONTENT_TAGS } from "../content/cache-tags";
import { publishProblems, runContentCommand, saveContent, type CmsDeps } from "./content-service";
import { CTA } from "./entities";
import { createMemoryCmsStore, type MemoryTables } from "./memory-store";

const NOW = new Date("2026-10-26T15:00:00.000Z");
const control = { provisional: false, archived_at: null, updated_at: "2026-10-20T00:00:00.000Z" };
const live = { ...control, status: "published" as const, published_at: "2026-10-20T00:00:00.000Z" };
const SERVICE_ID = "8b4f6a52-6c43-4a8f-9d55-2f5a2f6f0c11";
const DRAFT_SERVICE_ID = "2c1d0b55-0f8e-4a43-9a8e-3c6d1a7b9e22";
const CTA_ID = "5d2f6c7e-1a2b-4c3d-8e9f-0a1b2c3d4e5f";

const service = (id: string, slug: string) => ({
  id,
  slug,
  name: slug,
  summary: "Resumo do serviço.",
  description: "Descrição completa do serviço.",
  examples: [],
  icon: null,
  image_media_id: null,
  featured: false,
  sort_order: 1,
});

const savedCta = (overrides: Partial<MemoryTables["ctas"][number]> = {}): MemoryTables["ctas"][number] => ({
  ...live,
  id: CTA_ID,
  label: "Ver serviços",
  placement: "home-hero",
  target_kind: "internal",
  target_path: "/servicos",
  target_url: null,
  target_service_id: null,
  target_case_id: null,
  target_area_id: null,
  sort_order: 1,
  ...overrides,
});

function setup(seed: Partial<MemoryTables> = {}) {
  const { store, tables } = createMemoryCmsStore({
    services: [
      { ...live, ...service(SERVICE_ID, "audiovisual") },
      { ...control, status: "draft", published_at: null, ...service(DRAFT_SERVICE_ID, "podcast") },
    ],
    ...seed,
  });
  const changes: ContentChange[] = [];
  const audits: AuditInput[] = [];
  const deps: CmsDeps = {
    store,
    audit: async (input) => void audits.push(input),
    invalidate: (change) => void changes.push(change),
    now: () => NOW,
  };
  return { deps, tables, changes, audits, actor: (role: Role) => ({ id: "u1", role }) };
}

const form = { label: "Ver serviços", placement: "home-hero", targetKind: "internal", targetPath: "/servicos" };
const version = (env: ReturnType<typeof setup>, id = CTA_ID) => ({
  id,
  expectedUpdatedAt: env.tables.ctas.find((row) => row.id === id)!.updated_at,
});

describe("CMS de CTAs: gravação (ADM-11)", () => {
  it("cria rascunho com a coluna do destino e as demais nulas, sem mexer no cache", async () => {
    const env = setup();
    const saved = await saveContent(env.deps, env.actor("editor"), CTA, { ...form, order: "2" });
    expect(saved).toMatchObject({ status: "draft", created: true });
    expect(env.tables.ctas[0]).toMatchObject({
      label: "Ver serviços",
      placement: "home-hero",
      sort_order: 2,
      status: "draft",
      target_kind: "internal",
      target_path: "/servicos",
      target_url: null,
      target_service_id: null,
      target_case_id: null,
      target_area_id: null,
    });
    expect(env.changes).toEqual([]);
    expect(env.audits[0]).toMatchObject({ event: "content.created", metadata: { entity: "cta" } });
  });

  it.each([
    [
      { targetKind: "external", targetUrl: "https://exemplo.com" },
      { target_kind: "external", target_url: "https://exemplo.com" },
    ],
    [
      { targetKind: "service", targetId: SERVICE_ID },
      { target_kind: "service", target_service_id: SERVICE_ID },
    ],
    [{ targetKind: "contact" }, { target_kind: "contact", target_service_id: null }],
  ])("trocar o destino para %j limpa a coluna anterior", async (target, columns) => {
    const env = setup({ ctas: [savedCta()] });
    await saveContent(env.deps, env.actor("editor"), CTA, { ...form, ...target }, version(env));
    expect(env.tables.ctas[0]).toMatchObject({ ...columns, target_path: null });
  });

  it("editar CTA publicado o mantém no site e renova o cache de CTAs", async () => {
    const env = setup({ ctas: [savedCta()] });
    const saved = await saveContent(
      env.deps,
      env.actor("editor"),
      CTA,
      { ...form, label: "Nossos serviços" },
      version(env),
    );
    expect(saved.status).toBe("published");
    expect(env.tables.ctas[0].label).toBe("Nossos serviços");
    expect(env.changes).toEqual([{ entity: "cta" }]);
    expect(tagsForChange(env.changes[0])).toContain(CONTENT_TAGS.ctas);
  });

  it("publicado não pode receber destino inválido: nada é gravado", async () => {
    const env = setup({ ctas: [savedCta()] });
    await expect(
      saveContent(
        env.deps,
        env.actor("editor"),
        CTA,
        { ...form, targetKind: "external", targetUrl: "javascript:alert(1)" },
        version(env),
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED", fieldErrors: { targetUrl: [expect.any(String)] } });
    expect(env.tables.ctas[0]).toMatchObject({ target_kind: "internal", target_url: null });
    expect(env.changes).toEqual([]);
    expect(env.audits).toEqual([]);
  });

  it("versão desatualizada é recusada", async () => {
    const env = setup({ ctas: [savedCta()] });
    await expect(
      saveContent(env.deps, env.actor("editor"), CTA, form, { id: CTA_ID, expectedUpdatedAt: "2000-01-01T00:00:00Z" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("dois CTAs iguais são permitidos: não há endereço para colidir", async () => {
    const env = setup();
    await saveContent(env.deps, env.actor("editor"), CTA, form);
    await saveContent(env.deps, env.actor("editor"), CTA, form);
    expect(env.tables.ctas).toHaveLength(2);
  });

  it("CTA arquivado não é editável", async () => {
    const env = setup({
      ctas: [savedCta({ status: "archived", archived_at: "2026-10-21T00:00:00.000Z" })],
    });
    await expect(saveContent(env.deps, env.actor("editor"), CTA, form, version(env))).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
  });
});

describe("CMS de CTAs: permissões no servidor (ADM-11)", () => {
  it.each<Role>(["viewer", "pending"])("%s não cria nem edita", async (role) => {
    const env = setup({ ctas: [savedCta()] });
    await expect(saveContent(env.deps, env.actor(role), CTA, form)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(saveContent(env.deps, env.actor(role), CTA, form, version(env))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(env.tables.ctas).toHaveLength(1);
    expect(env.audits).toEqual([]);
  });

  it.each<Role>(["viewer", "pending"])("%s não publica", async (role) => {
    const env = setup({ ctas: [savedCta({ status: "draft", published_at: null })] });
    await expect(runContentCommand(env.deps, env.actor(role), CTA, version(env), "publish")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(env.tables.ctas[0].status).toBe("draft");
  });

  it.each<Role>(["editor", "admin", "super_admin"])("%s salva e publica", async (role) => {
    const env = setup();
    const { id } = await saveContent(env.deps, env.actor(role), CTA, form);
    const result = await runContentCommand(env.deps, env.actor(role), CTA, version(env, id), "publish");
    expect(result.status).toBe("published");
    expect(env.changes).toEqual([{ entity: "cta" }]);
    expect(env.audits.map((entry) => entry.event)).toEqual(["content.created", "content.published"]);
  });

  it("editor arquiva, mas só administrador exclui", async () => {
    const env = setup({ ctas: [savedCta()] });
    await runContentCommand(env.deps, env.actor("editor"), CTA, version(env), "archive");
    await expect(runContentCommand(env.deps, env.actor("editor"), CTA, version(env), "delete")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await runContentCommand(env.deps, env.actor("admin"), CTA, version(env), "delete");
    expect(env.tables.ctas).toEqual([]);
  });
});

describe("CMS de CTAs: integridade do destino (ADM-11)", () => {
  const draft = { status: "draft" as const, published_at: null };
  const problems = async (env: ReturnType<typeof setup>) => {
    const snapshot = await env.deps.store.snapshot();
    return publishProblems(CTA, snapshot.ctas[0], snapshot, NOW);
  };

  it("destino em rascunho não impede publicar: o site usa o fallback (R08)", async () => {
    const env = setup({
      ctas: [savedCta({ ...draft, target_kind: "service", target_path: null, target_service_id: DRAFT_SERVICE_ID })],
    });
    expect(await problems(env)).toEqual([]);
  });

  it("destino excluído impede publicar, com a orientação do campo", async () => {
    const env = setup({
      ctas: [savedCta({ ...draft, target_kind: "case", target_path: null, target_case_id: null })],
    });
    expect(await problems(env)).toEqual(["Destino: Escolha o case de destino."]);
    await expect(runContentCommand(env.deps, env.actor("editor"), CTA, version(env), "publish")).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
  });

  it("destino que aponta para id sem item é recusado (R04)", async () => {
    const env = setup({
      ctas: [
        savedCta({
          ...draft,
          target_kind: "service",
          target_path: null,
          target_service_id: "99999999-9999-4999-8999-999999999999",
        }),
      ],
    });
    expect(await problems(env)).toEqual(["Destino inexistente: service 99999999-9999-4999-8999-999999999999."]);
  });

  it("linha com página fora da lista não publica, mesmo gravada fora do painel", async () => {
    const env = setup({ ctas: [savedCta({ ...draft, target_path: "/servicos/nao-existe" })] });
    expect(await problems(env)).toEqual(["Página: Escolha uma página da lista: este destino não existe no site."]);
  });

  it("despublicar o CTA avisa o cache uma vez e não bloqueia por impacto", async () => {
    const env = setup({ ctas: [savedCta()] });
    const result = await runContentCommand(env.deps, env.actor("editor"), CTA, version(env), "unpublish");
    expect(result).toEqual({ status: "draft", warnings: [] });
    expect(env.changes).toEqual([{ entity: "cta" }]);
  });
});
