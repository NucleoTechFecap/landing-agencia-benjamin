/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : cms-areas.test.ts
 Descrição    : Integração: CRUD e publicação de áreas pelo CMS com usuários reais e RLS.

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
 26/10/2026 Vinícius Nishimura Reis  Dependências do CMS compartilhadas entre testes (ADM-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { runContentCommand, saveContent } from "@/lib/server/cms/content-service";
import { AREA } from "@/lib/server/cms/entities";
import { createSupabaseCmsStore } from "@/lib/server/cms/supabase-store";
import { fetchAreasAndServices } from "@/lib/server/content/supabase/queries";
import {
  anonClient,
  cmsDepsFor,
  createTestUser,
  deleteTestUsers,
  hasSupabaseTestEnv,
  serviceClient,
  supabaseTestEnv,
  testSuffix,
  type TestUser,
} from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

const depsFor = cmsDepsFor;

describe.runIf(hasSupabaseTestEnv)("CMS de áreas no Supabase (ADM-07)", () => {
  const suffix = testSuffix();
  const slug = `area-cms-${suffix}`;
  const users: { editor?: TestUser; viewer?: TestUser; admin?: TestUser } = {};
  let areaId = "";

  beforeAll(async () => {
    [users.editor, users.viewer, users.admin] = await Promise.all([
      createTestUser("editor", suffix),
      createTestUser("viewer", suffix),
      createTestUser("admin", suffix),
    ]);
  });

  afterAll(async () => {
    await serviceClient().from("areas").delete().eq("slug", slug);
    await deleteTestUsers(Object.values(users));
  });

  const editor = () => ({ id: users.editor!.id, role: "editor" as const });
  const version = async () =>
    (await serviceClient().from("areas").select("updated_at").eq("id", areaId).single()).data!.updated_at as string;
  const visibleToPublic = async () =>
    (await fetchAreasAndServices(anonClient(), supabaseTestEnv.url!)).areas.some((area) => area.slug === slug);

  it("editor cria rascunho que o visitante não vê", async () => {
    const saved = await saveContent(depsFor(users.editor!.client), editor(), AREA, { name: "Área de teste", slug });
    areaId = saved.id;
    expect(saved.status).toBe("draft");
    expect(await visibleToPublic()).toBe(false);
  });

  it("publicar incompleto é recusado; completo publica e aparece para o visitante", async () => {
    const deps = depsFor(users.editor!.client);
    await expect(
      runContentCommand(deps, editor(), AREA, { id: areaId, expectedUpdatedAt: await version() }, "publish"),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    await saveContent(
      deps,
      editor(),
      AREA,
      {
        name: "Área de teste",
        slug,
        summary: "Resumo da área de teste.",
        description: "Descrição completa da área de teste do CMS.",
      },
      { id: areaId, expectedUpdatedAt: await version() },
    );
    const result = await runContentCommand(
      deps,
      editor(),
      AREA,
      { id: areaId, expectedUpdatedAt: await version() },
      "publish",
    );
    expect(result.status).toBe("published");
    expect(await visibleToPublic()).toBe(true);
  });

  it("a publicação fica na trilha de auditoria com o editor como autor", async () => {
    const { data } = await serviceClient()
      .from("audit_log")
      .select("event, actor_id, actor_role, outcome")
      .eq("resource_id", areaId)
      .eq("event", "content.published");
    expect(data).toEqual([
      { event: "content.published", actor_id: users.editor!.id, actor_role: "editor", outcome: "success" },
    ]);
  });

  it("leitor não consegue gravar nem pelo banco (RLS)", async () => {
    const store = createSupabaseCmsStore(users.viewer!.client, supabaseTestEnv.url!);
    await expect(store.update("areas", areaId, { name: "Invasão" }, await version())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("versão desatualizada é recusada (concorrência otimista)", async () => {
    const store = createSupabaseCmsStore(users.editor!.client, supabaseTestEnv.url!);
    await expect(store.update("areas", areaId, { name: "Outro" }, "2000-01-01T00:00:00+00:00")).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("editor arquiva, mas só admin exclui definitivamente — e só arquivado", async () => {
    await runContentCommand(
      depsFor(users.editor!.client),
      editor(),
      AREA,
      { id: areaId, expectedUpdatedAt: await version() },
      "archive",
    );
    expect(await visibleToPublic()).toBe(false);
    const editorStore = createSupabaseCmsStore(users.editor!.client, supabaseTestEnv.url!);
    await expect(editorStore.remove("areas", areaId)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await runContentCommand(
      depsFor(users.admin!.client),
      { id: users.admin!.id, role: "admin" },
      AREA,
      { id: areaId, expectedUpdatedAt: await version() },
      "delete",
    );
    const { data } = await serviceClient().from("areas").select("id").eq("id", areaId);
    expect(data).toEqual([]);
  });
});
