/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : cms-ctas.test.ts
 Descrição    : Integração: CTAs pelo CMS com papéis reais, RLS, leitura pública e destino excluído.

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

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { resolveCtaHref } from "@/lib/domain/content/integrity";
import { publishProblems, runContentCommand, saveContent } from "@/lib/server/cms/content-service";
import { CTA } from "@/lib/server/cms/entities";
import { createSupabaseCmsStore } from "@/lib/server/cms/supabase-store";
import { fetchCtas } from "@/lib/server/content/supabase/queries";
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

describe.runIf(hasSupabaseTestEnv)("CMS de CTAs no Supabase (ADM-11)", () => {
  const suffix = testSuffix();
  const label = `CTA ${suffix}`;
  const edited = `Editado ${suffix}`;
  const users: Partial<Record<"admin" | "editor" | "viewer" | "pending", TestUser>> = {};
  const form = { label, placement: "footer", targetKind: "internal", targetPath: "/cases", order: "1" };
  const row = { label: `Direto ${suffix}`, placement: "footer", target_kind: "internal", target_path: "/cases" };
  let ctaId = "";
  let serviceId = "";

  beforeAll(async () => {
    [users.admin, users.editor, users.viewer, users.pending] = await Promise.all([
      createTestUser("admin", suffix),
      createTestUser("editor", suffix),
      createTestUser("viewer", suffix),
      createTestUser("pending", suffix),
    ]);
    const { data, error } = await serviceClient()
      .from("services")
      .insert({ slug: `servico-cta-${suffix}`, name: `Serviço CTA ${suffix}` })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    serviceId = data.id;
  });

  afterAll(async () => {
    await serviceClient().from("ctas").delete().like("label", `%${suffix}`);
    if (serviceId) await serviceClient().from("services").delete().eq("id", serviceId);
    await deleteTestUsers(Object.values(users));
  });

  const actor = (role: "admin" | "editor" | "viewer" | "pending") => ({ id: users[role]!.id, role });
  const version = async (id = ctaId) =>
    (await serviceClient().from("ctas").select("updated_at").eq("id", id).single()).data!.updated_at as string;
  const ref = async (id = ctaId) => ({ id, expectedUpdatedAt: await version(id) });
  const current = async () => (await serviceClient().from("ctas").select("*").eq("id", ctaId).single()).data!;
  const publicLabels = async () => (await fetchCtas(anonClient())).map((cta) => cta.label);

  /** A API REST como qualquer pessoa na internet a chamaria, só com a chave anônima pública. */
  const restAsVisitor = async () => {
    const url = new URL("/rest/v1/ctas", supabaseTestEnv.url);
    url.searchParams.set("select", "id,label");
    url.searchParams.set("id", `eq.${ctaId}`);
    const response = await fetch(url, { headers: { apikey: supabaseTestEnv.anonKey! } });
    expect(response.status).toBe(200);
    return (await response.json()) as { id: string; label: string }[];
  };

  describe("rascunho", () => {
    it("editor salva; quem não é do painel não lê, nem direto pela API REST", async () => {
      const saved = await saveContent(cmsDepsFor(users.editor!.client), actor("editor"), CTA, form);
      ctaId = saved.id;
      expect(saved.status).toBe("draft");
      expect(await current()).toMatchObject({ status: "draft", target_kind: "internal", target_path: "/cases" });

      expect(await publicLabels()).not.toContain(label);
      expect(await restAsVisitor()).toEqual([]);
      const asPending = await users.pending!.client.from("ctas").select("id").eq("id", ctaId);
      expect(asPending).toMatchObject({ error: null, data: [] });
    });

    it("leitor do painel vê o rascunho, porque a matriz dá cta:view", async () => {
      const { data } = await users.viewer!.client.from("ctas").select("id").eq("id", ctaId);
      expect(data).toEqual([{ id: ctaId }]);
    });
  });

  describe("quem não pode gravar", () => {
    // Publicar: o leitor enxerga o rascunho e é barrado pelo papel; para a conta pendente, a RLS nem
    // deixa o rascunho existir. Pela Server Action os dois param antes, em requirePermission.
    it.each([
      ["viewer", "FORBIDDEN"],
      ["pending", "NOT_FOUND"],
    ] as const)("%s é barrado na regra do servidor", async (role, publishError) => {
      const deps = cmsDepsFor(users[role]!.client);
      await expect(saveContent(deps, actor(role), CTA, form)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(saveContent(deps, actor(role), CTA, form, await ref())).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(runContentCommand(deps, actor(role), CTA, await ref(), "publish")).rejects.toMatchObject({
        code: publishError,
      });
      expect(await current()).toMatchObject({ status: "draft", label });
    });

    it.each([
      ["anônimo", () => anonClient()],
      ["pending", () => users.pending!.client],
      ["viewer", () => users.viewer!.client],
    ])("%s não cria, altera, publica nem exclui direto no banco", async (_name, client) => {
      const { error } = await client().from("ctas").insert(row);
      expect(error?.code).toBe("42501");

      const before = await current();
      const updated = await client()
        .from("ctas")
        .update({ label: `Invasão ${suffix}` })
        .eq("id", ctaId)
        .select("id");
      expect(updated.data ?? []).toEqual([]);
      const published = await client()
        .from("ctas")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", ctaId)
        .select("id");
      expect(published.data ?? []).toEqual([]);
      const removed = await client().from("ctas").delete().eq("id", ctaId).select("id");
      expect(removed.data ?? []).toEqual([]);
      expect(await current()).toEqual(before);
    });

    it("a segunda barreira responde FORBIDDEN mesmo se a primeira falhar", async () => {
      const store = createSupabaseCmsStore(users.viewer!.client, supabaseTestEnv.url!);
      await expect(store.update("ctas", ctaId, { label: "Invasão" }, await version())).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("publicação", () => {
    it("editor publica: o visitante passa a ler, e a trilha registra quem fez", async () => {
      const result = await runContentCommand(
        cmsDepsFor(users.editor!.client),
        actor("editor"),
        CTA,
        await ref(),
        "publish",
      );
      expect(result.status).toBe("published");
      expect(await publicLabels()).toContain(label);
      expect(await restAsVisitor()).toEqual([{ id: ctaId, label }]);

      const { data } = await serviceClient()
        .from("audit_log")
        .select("event, actor_id, actor_role, outcome")
        .eq("resource_id", ctaId)
        .eq("event", "content.published");
      expect(data).toEqual([
        { event: "content.published", actor_id: users.editor!.id, actor_role: "editor", outcome: "success" },
      ]);
    });

    it("administrador edita o publicado: o site lê o novo texto e a coluna do destino antigo é limpa", async () => {
      await saveContent(
        cmsDepsFor(users.admin!.client),
        actor("admin"),
        CTA,
        { ...form, label: edited, targetKind: "external", targetUrl: "https://exemplo.com/novo" },
        await ref(),
      );
      expect(await current()).toMatchObject({
        status: "published",
        target_kind: "external",
        target_url: "https://exemplo.com/novo",
        target_path: null,
      });
      const labels = await publicLabels();
      expect(labels).toContain(edited);
      expect(labels).not.toContain(label);
    });

    it("administrador também cria e publica", async () => {
      const deps = cmsDepsFor(users.admin!.client);
      const { id } = await saveContent(deps, actor("admin"), CTA, { ...form, label: `Admin ${suffix}` });
      const result = await runContentCommand(deps, actor("admin"), CTA, await ref(id), "publish");
      expect(result.status).toBe("published");
    });

    it("despublicado sai da leitura pública na hora", async () => {
      await runContentCommand(cmsDepsFor(users.editor!.client), actor("editor"), CTA, await ref(), "unpublish");
      expect(await publicLabels()).not.toContain(edited);
      expect(await restAsVisitor()).toEqual([]);
    });
  });

  describe("destino", () => {
    it("o formulário recusa javascript: e o banco recusa mesmo se a validação falhar", async () => {
      await expect(
        saveContent(cmsDepsFor(users.editor!.client), actor("editor"), CTA, {
          ...form,
          targetKind: "external",
          targetUrl: "javascript:alert(1)",
        }),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });

      const client = users.editor!.client;
      const external = { label: `Perigo ${suffix}`, placement: "footer", target_kind: "external" };
      expect((await client.from("ctas").insert({ ...external, target_url: "javascript:alert(1)" })).error?.code).toBe(
        "23514",
      );
      const internal = { label: `Perigo ${suffix}`, placement: "footer", target_kind: "internal" };
      expect((await client.from("ctas").insert({ ...internal, target_path: "//exemplo.com" })).error?.code).toBe(
        "23514",
      );
    });

    it("serviço em rascunho: o CTA publica e leva à lista, sem 404", async () => {
      const deps = cmsDepsFor(users.editor!.client);
      const target = { ...form, targetKind: "service", targetId: serviceId };
      await saveContent(deps, actor("editor"), CTA, target, await ref());
      await runContentCommand(deps, actor("editor"), CTA, await ref(), "publish");
      const snapshot = await deps.store.snapshot();
      const cta = snapshot.ctas.find((item) => item.id === ctaId)!;
      expect(resolveCtaHref(cta.target, snapshot).href).toBe("/servicos");
    });

    it("serviço excluído: o site continua no fallback e o painel pede outro destino", async () => {
      const { error } = await serviceClient().from("services").delete().eq("id", serviceId);
      expect(error).toBeNull();
      serviceId = "";
      expect(await current()).toMatchObject({ status: "published", target_kind: "service", target_service_id: null });

      const snapshot = await cmsDepsFor(users.editor!.client).store.snapshot();
      const cta = snapshot.ctas.find((item) => item.id === ctaId)!;
      expect(resolveCtaHref(cta.target, snapshot).href).toBe("/servicos");
      expect(publishProblems(CTA, cta, snapshot, new Date())).toEqual(["Destino: Escolha o serviço de destino."]);
    });
  });

  describe("fim do ciclo", () => {
    it("editor arquiva, mas só administrador exclui, e só arquivado", async () => {
      const editorStore = createSupabaseCmsStore(users.editor!.client, supabaseTestEnv.url!);
      await expect(
        runContentCommand(cmsDepsFor(users.admin!.client), actor("admin"), CTA, await ref(), "delete"),
      ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });

      await runContentCommand(cmsDepsFor(users.editor!.client), actor("editor"), CTA, await ref(), "archive");
      await expect(editorStore.remove("ctas", ctaId)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        runContentCommand(cmsDepsFor(users.editor!.client), actor("editor"), CTA, await ref(), "delete"),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });

      await runContentCommand(cmsDepsFor(users.admin!.client), actor("admin"), CTA, await ref(), "delete");
      const { data } = await serviceClient().from("ctas").select("id").eq("id", ctaId);
      expect(data).toEqual([]);
    });
  });
});
