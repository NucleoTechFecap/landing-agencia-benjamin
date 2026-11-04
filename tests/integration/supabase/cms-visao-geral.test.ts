/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : cms-visao-geral.test.ts
 Descrição    : Integração: visão geral dos conteúdos lida com a sessão de cada papel, sob a RLS real.

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

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Role } from "@/lib/domain/auth/rbac";
import { saveContent } from "@/lib/server/cms/content-service";
import { AREA } from "@/lib/server/cms/entities";
import { loadContentOverview } from "@/lib/server/cms/overview";
import { createSupabaseCmsStore } from "@/lib/server/cms/supabase-store";
import {
  anonClient,
  cmsDepsFor,
  createTestUser,
  deleteTestUsers,
  hasSupabaseTestEnv,
  must,
  serviceClient,
  supabaseTestEnv,
  testSuffix,
  type TestUser,
} from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

describe.runIf(hasSupabaseTestEnv)("Visão geral dos conteúdos no Supabase (ADM-18)", () => {
  const suffix = testSuffix();
  const published = { status: "published", published_at: "2026-10-01T12:00:00.000Z" };
  const users: Partial<Record<"admin" | "editor" | "viewer" | "pending", TestUser>> = {};
  const ids = { draft: "", provisional: "", broken: "", category: "", cover: "" };

  const insert = async (table: string, values: Record<string, unknown>) =>
    (await must(serviceClient().from(table).insert(values).select("id").single())) as { id: string };

  beforeAll(async () => {
    [users.admin, users.editor, users.viewer, users.pending] = await Promise.all([
      createTestUser("admin", suffix),
      createTestUser("editor", suffix),
      createTestUser("viewer", suffix),
      createTestUser("pending", suffix),
    ]);
    ids.draft = (await insert("areas", { slug: `visao-rascunho-${suffix}`, name: `Rascunho ${suffix}` })).id;
    ids.provisional = (
      await insert("areas", {
        ...published,
        provisional: true,
        slug: `visao-provisoria-${suffix}`,
        name: `Provisória ${suffix}`,
        summary: "Resumo da área provisória.",
        description: "Descrição da área provisória do teste.",
      })
    ).id;
    ids.category = (await insert("case_categories", { slug: `visao-${suffix}`, name: `Categoria ${suffix}` })).id;
    ids.cover = (
      await insert("media_assets", {
        path: `e2e/visao-integracao-${suffix}.webp`,
        mime_type: "image/webp",
        width: 800,
        height: 500,
        alt_text: "Capa fictícia",
      })
    ).id;
    // Só service_role grava este estado: é o tipo de inconsistência que a fila existe para apontar.
    ids.broken = (
      await insert("cases", {
        ...published,
        slug: `visao-${suffix}`,
        title: `Case no ar ${suffix}`,
        client_name: "Cliente fictício",
        summary: "Resumo do case publicado com a categoria em rascunho.",
        category_id: ids.category,
        cover_media_id: ids.cover,
      })
    ).id;
  });

  afterAll(async () => {
    const admin = serviceClient();
    await admin.from("cases").delete().eq("id", ids.broken);
    await admin.from("case_categories").delete().eq("id", ids.category);
    await admin.from("media_assets").delete().eq("id", ids.cover);
    await admin.from("areas").delete().in("id", [ids.draft, ids.provisional]);
    await deleteTestUsers(Object.values(users));
  });

  const overviewOf = (user: TestUser, role: Role) =>
    loadContentOverview(createSupabaseCmsStore(user.client, supabaseTestEnv.url!), role, new Date());

  it.each(["admin", "editor", "viewer"] as const)("%s lê rascunho e publicado pela própria sessão", async (role) => {
    const overview = await overviewOf(users[role]!, role);
    expect(overview.groups.map((group) => group.type)).toEqual(["page", "area", "service", "category", "case"]);

    const queue = new Map(overview.review.map((item) => [item.id, item]));
    expect(queue.get(ids.draft)).toMatchObject({ status: "draft", canEdit: role !== "viewer" });
    expect(queue.get(ids.draft)!.notes.missing.length).toBeGreaterThan(0);
    expect(queue.get(ids.provisional)).toMatchObject({ status: "published", notes: { provisional: true } });
    expect(queue.get(ids.broken)!.status).toBe("published");
    expect(queue.get(ids.broken)!.notes.missing.length).toBeGreaterThan(0);
    // A categoria em rascunho está completa: aparece no grupo, mas não na fila.
    expect(queue.has(ids.category)).toBe(false);
    const categories = overview.groups.find((group) => group.type === "category")!;
    expect(categories.items.some((item) => item.id === ids.category)).toBe(true);
  });

  it("conta pendente não recebe nada, e a RLS também não entrega o rascunho a ela", async () => {
    const overview = await overviewOf(users.pending!, "pending");
    expect(overview.groups).toEqual([]);
    expect(overview.review).toEqual([]);
    const { data } = await users.pending!.client.from("areas").select("id").eq("id", ids.draft);
    expect(data).toEqual([]);
  });

  it("visitante não lê o rascunho nem forçando a leitura de todo o conteúdo", async () => {
    const snapshot = await createSupabaseCmsStore(anonClient(), supabaseTestEnv.url!).snapshot();
    expect(snapshot.areas.some((area) => area.id === ids.draft)).toBe(false);
    expect(snapshot.areas.some((area) => area.id === ids.provisional)).toBe(true);
  });

  it("leitor não salva; editor completa o rascunho e ele sai da fila", async () => {
    const version = (await must(serviceClient().from("areas").select("updated_at").eq("id", ids.draft).single())) as {
      updated_at: string;
    };
    const ref = { id: ids.draft, expectedUpdatedAt: version.updated_at };
    const input = {
      name: `Rascunho ${suffix}`,
      slug: `visao-rascunho-${suffix}`,
      summary: "Resumo completo da área.",
      description: "Descrição completa da área de rascunho.",
    };
    await expect(
      saveContent(cmsDepsFor(users.viewer!.client), { id: users.viewer!.id, role: "viewer" }, AREA, input, ref),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await saveContent(cmsDepsFor(users.editor!.client), { id: users.editor!.id, role: "editor" }, AREA, input, ref);
    const overview = await overviewOf(users.editor!, "editor");
    expect(overview.review.some((item) => item.id === ids.draft)).toBe(false);
    const areas = overview.groups.find((group) => group.type === "area")!;
    expect(areas.items.find((item) => item.id === ids.draft)).toMatchObject({ status: "draft" });
  });
});
