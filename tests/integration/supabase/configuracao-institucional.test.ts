/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : configuracao-institucional.test.ts
 Descrição    : Integração: leitura pública e gravação de site_settings por papel, com a RLS real.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { siteSettings } from "@/content";
import { loadSettingsForEdit, saveSiteSettings } from "@/lib/server/cms/settings-service";
import { createSupabaseCmsStore } from "@/lib/server/cms/supabase-store";
import { fetchSiteSettings } from "@/lib/server/content/supabase/queries";
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
  type TestRole,
  type TestUser,
} from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

/*
 * site_settings tem uma linha só, e os arquivos do Vitest rodam em paralelo: todo teste de
 * integração que grava nela precisa ficar neste arquivo.
 */
describe.runIf(hasSupabaseTestEnv)("configuração institucional no Supabase (DB-03, ADM-10)", () => {
  const admin = hasSupabaseTestEnv ? serviceClient() : (null as never);
  const suffix = testSuffix();
  const users: Partial<Record<TestRole, TestUser>> = {};
  let previous: Record<string, unknown> | null = null;

  const baseRow = {
    id: true,
    name: "Agência Benjamin",
    short_name: "Benja",
    tagline: `Tagline ${suffix}`,
    description: "Agência experimental de comunicação, com projetos reais feitos por estudantes.",
    manifesto: siteSettings.manifesto,
    about: siteSettings.about,
    contact: { email: "contato@exemplo.com.br", address: "Rua A, 10", mapsUrl: "https://maps.exemplo.com/a" },
    socials: { instagram: "https://www.instagram.com/agenciabenja" },
    keywords: ["benja"],
  };

  const form = {
    tagline: baseRow.tagline,
    description: baseRow.description,
    email: baseRow.contact.email,
    phone: "",
    address: baseRow.contact.address,
    mapsUrl: baseRow.contact.mapsUrl,
    instagram: baseRow.socials.instagram,
    tiktok: "",
    linkedin: "",
  };

  const current = async () =>
    (
      await must(
        admin.from("site_settings").select("tagline, contact, socials, manifesto, updated_at, updated_by").limit(1),
      )
    )[0] as {
      tagline: string;
      contact: Record<string, string>;
      socials: Record<string, string>;
      manifesto: unknown;
      updated_at: string;
      updated_by: string | null;
    };

  const actor = (role: TestRole) => ({ id: users[role]!.id, role });
  const deps = (role: TestRole) => cmsDepsFor(users[role]!.client);

  beforeAll(async () => {
    [previous] = await must(admin.from("site_settings").select("*").limit(1));
    const roles: TestRole[] = ["super_admin", "admin", "editor", "viewer", "pending"];
    const created = await Promise.all(roles.map((role) => createTestUser(role, suffix)));
    roles.forEach((role, index) => (users[role] = created[index]));
  });

  beforeEach(async () => {
    await must(admin.from("site_settings").upsert(baseRow));
  });

  afterAll(async () => {
    if (previous) await admin.from("site_settings").upsert(previous);
    else await admin.from("site_settings").delete().eq("id", true);
    await deleteTestUsers(Object.values(users));
  });

  it("configuração institucional vem do banco", async () => {
    const settings = await fetchSiteSettings(anonClient(), siteSettings);
    expect(settings.tagline).toBe(`Tagline ${suffix}`);
    expect(settings.contact.email).toBe("contato@exemplo.com.br");
  });

  it.each<TestRole>(["admin", "super_admin"])("%s salva, e o texto chega à leitura pública", async (role) => {
    const { updatedAt } = await loadSettingsForEdit(deps(role));
    const instagram = `https://www.instagram.com/benja-${role.replace("_", "-")}-${suffix}`;

    await saveSiteSettings(
      deps(role),
      actor(role),
      { ...form, instagram, tagline: `Novo ${suffix}`, phone: "(11) 3333-3333", mapsUrl: "" },
      updatedAt,
    );

    const settings = await fetchSiteSettings(anonClient(), siteSettings);
    expect(settings.tagline).toBe(`Novo ${suffix}`);
    expect(settings.socials).toEqual({ instagram });
    expect(settings.contact).toEqual({
      email: baseRow.contact.email,
      phone: "(11) 3333-3333",
      address: baseRow.contact.address,
    });
    expect((await current()).updated_by).toBe(users[role]!.id);
  });

  it("manifesto e Sobre não mudam ao salvar contato e redes", async () => {
    const { updatedAt } = await loadSettingsForEdit(deps("admin"));
    await saveSiteSettings(
      deps("admin"),
      actor("admin"),
      { ...form, tiktok: "https://www.tiktok.com/@benja" },
      updatedAt,
    );
    expect((await current()).manifesto).toEqual(siteSettings.manifesto);
  });

  it("a gravação fica na auditoria com o autor, os campos e nenhum valor", async () => {
    const { updatedAt } = await loadSettingsForEdit(deps("admin"));
    const email = `auditoria-${suffix}@exemplo.com.br`;
    await saveSiteSettings(deps("admin"), actor("admin"), { ...form, email }, updatedAt);

    const events = await must(
      admin
        .from("audit_log")
        .select("event, actor_role, outcome, metadata, resource_id")
        .eq("event", "settings.updated")
        .eq("actor_id", users.admin!.id)
        .order("id", { ascending: false })
        .limit(1),
    );
    expect(events[0]).toMatchObject({
      event: "settings.updated",
      actor_role: "admin",
      outcome: "success",
      resource_id: "site_settings",
      metadata: { entity: "settings", kind: "email", count: 1 },
    });
    expect(JSON.stringify(events[0])).not.toContain(email);
  });

  it("segunda pessoa com a versão antiga recebe conflito; o banco fica com a primeira", async () => {
    const { updatedAt } = await loadSettingsForEdit(deps("admin"));
    await saveSiteSettings(deps("admin"), actor("admin"), { ...form, tagline: `Primeira ${suffix}` }, updatedAt);
    await expect(
      saveSiteSettings(deps("super_admin"), actor("super_admin"), { ...form, tagline: `Segunda ${suffix}` }, updatedAt),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await current()).tagline).toBe(`Primeira ${suffix}`);
  });

  it("corrida: o banco recusa a versão antiga mesmo depois da conferência da aplicação", async () => {
    const before = await current();
    const store = createSupabaseCmsStore(users.admin!.client, supabaseTestEnv.url!);
    await store.saveSettings({ tagline: `Primeira ${suffix}` }, before.updated_at);
    await expect(store.saveSettings({ tagline: `Segunda ${suffix}` }, before.updated_at)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect((await current()).tagline).toBe(`Primeira ${suffix}`);
  });

  it.each<TestRole>(["editor", "viewer", "pending"])("%s não salva pela camada do painel", async (role) => {
    const before = await current();
    await expect(
      saveSiteSettings(deps(role), actor(role), { ...form, tagline: "Invasão" }, before.updated_at),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect((await current()).updated_at).toBe(before.updated_at);
  });

  it.each<TestRole>(["editor", "viewer", "pending"])("%s é barrado pela RLS mesmo fingindo ser admin", async (role) => {
    const before = await current();
    const store = createSupabaseCmsStore(users[role]!.client, supabaseTestEnv.url!);
    await expect(store.saveSettings({ tagline: "Invasão" }, before.updated_at)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    // Na camada de serviço, a guarda de papel do banco recusa antes até o evento de auditoria.
    await expect(
      saveSiteSettings(
        deps(role),
        { id: users[role]!.id, role: "admin" },
        { ...form, tagline: "Invasão" },
        before.updated_at,
      ),
    ).rejects.toThrow();
    expect((await current()).updated_at).toBe(before.updated_at);
  });

  it.each<TestRole>(["editor", "viewer", "pending"])("%s não altera pela API REST direta", async (role) => {
    const before = await current();
    const client = users[role]!.client;

    const updated = await client
      .from("site_settings")
      .update({ socials: { instagram: "https://golpe.com/benja" } })
      .eq("id", true)
      .select("id");
    expect(updated.data ?? []).toEqual([]);

    const inserted = await client.from("site_settings").upsert({ ...baseRow, tagline: "Invasão" });
    expect(inserted.error).not.toBeNull();

    const removed = await client.from("site_settings").delete().eq("id", true);
    expect(removed.error).not.toBeNull();

    const after = await current();
    expect(after.updated_at).toBe(before.updated_at);
    expect(after.socials).toEqual(baseRow.socials);
  });

  it("visitante anônimo lê, mas não altera pela API REST direta", async () => {
    const before = await current();
    const client = anonClient();

    const updated = await client.from("site_settings").update({ tagline: "Invasão" }).eq("id", true).select("id");
    expect(updated.error).not.toBeNull();
    const inserted = await client.from("site_settings").upsert({ ...baseRow, tagline: "Invasão" });
    expect(inserted.error).not.toBeNull();
    const removed = await client.from("site_settings").delete().eq("id", true);
    expect(removed.error).not.toBeNull();

    expect((await current()).updated_at).toBe(before.updated_at);
    expect((await fetchSiteSettings(client, siteSettings)).tagline).toBe(baseRow.tagline);
  });

  it("link perigoso gravado direto no banco não chega ao site: vale a referência", async () => {
    await must(
      admin
        .from("site_settings")
        .update({
          socials: { instagram: "javascript:alert(1)" },
          contact: { address: "Rua A", mapsUrl: "http://maps.exemplo.com/a" },
        })
        .eq("id", true),
    );
    const settings = await fetchSiteSettings(anonClient(), siteSettings);
    expect(settings.socials).toEqual(siteSettings.socials);
    expect(settings.contact).toEqual(siteSettings.contact);
  });

  describe("ambiente sem a linha", () => {
    beforeEach(async () => {
      await must(admin.from("site_settings").delete().eq("id", true));
    });

    it("admin cria a linha pela RLS; o que a tela não edita recebe a referência", async () => {
      const { updatedAt, settings } = await loadSettingsForEdit(deps("admin"));
      expect(updatedAt).toBeNull();
      expect(settings).toEqual(siteSettings);

      await saveSiteSettings(deps("admin"), actor("admin"), { ...form, tagline: `Primeira ${suffix}` }, null);

      const created = await current();
      expect(created.tagline).toBe(`Primeira ${suffix}`);
      expect(created.manifesto).toEqual(siteSettings.manifesto);
      expect(created.updated_by).toBe(users.admin!.id);
      expect((await fetchSiteSettings(anonClient(), siteSettings)).tagline).toBe(`Primeira ${suffix}`);
    });

    it("duas criações ao mesmo tempo: a segunda recebe conflito", async () => {
      const store = createSupabaseCmsStore(users.admin!.client, supabaseTestEnv.url!);
      await store.saveSettings(baseRow, null);
      await expect(store.saveSettings(baseRow, null)).rejects.toMatchObject({ code: "CONFLICT" });
    });

    it("editor não cria a linha", async () => {
      const store = createSupabaseCmsStore(users.editor!.client, supabaseTestEnv.url!);
      await expect(store.saveSettings(baseRow, null)).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(await must(admin.from("site_settings").select("id"))).toEqual([]);
    });
  });
});
