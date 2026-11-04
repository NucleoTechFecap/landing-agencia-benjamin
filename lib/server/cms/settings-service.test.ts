/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : settings-service.test.ts
 Descrição    : Testes das regras de gravação de contato, links e redes sociais, em memória.

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

import { describe, expect, it, vi } from "vitest";
import { siteSettings } from "@/content";
import type { Role } from "@/lib/domain/auth/rbac";
import type { AuditInput } from "../audit";
import type { ContentChange } from "../content/invalidate";
import type { CmsDeps } from "./content-service";
import { createMemoryCmsStore } from "./memory-store";
import { loadSettingsForEdit, saveSiteSettings } from "./settings-service";

const VERSION = "2026-11-01T00:00:00.000Z";
const admin = { id: "admin-1", role: "admin" as Role };

const row = {
  name: "Agência Benjamin",
  short_name: "Benja",
  tagline: "Somando diferenças",
  description: "Agência experimental de comunicação, com projetos reais feitos por estudantes.",
  manifesto: { title: "Manifesto do banco", paragraphs: ["Texto publicado."] },
  about: siteSettings.about,
  contact: { address: "Rua A, 10", mapsUrl: "https://maps.exemplo.com/a" },
  socials: { instagram: "https://www.instagram.com/agenciabenja" },
  keywords: ["benja"],
  updated_at: VERSION,
};

const input = {
  tagline: row.tagline,
  description: row.description,
  email: "",
  phone: "",
  address: row.contact.address,
  mapsUrl: row.contact.mapsUrl,
  instagram: row.socials.instagram,
  tiktok: "",
  linkedin: "",
};

function setup(rows = [row]) {
  const { store, tables } = createMemoryCmsStore({ site_settings: rows });
  const audits: AuditInput[] = [];
  const changes: ContentChange[] = [];
  const deps: CmsDeps = {
    store,
    audit: async (event) => {
      audits.push(event);
    },
    invalidate: (change) => {
      changes.push(change);
    },
    now: () => new Date("2026-11-04T12:00:00.000Z"),
  };
  return { deps, tables, audits, changes };
}

describe("saveSiteSettings (ADM-10)", () => {
  it.each<Role>(["admin", "super_admin"])("%s salva, audita e renova o cache do site", async (role) => {
    const { deps, tables, audits, changes } = setup();
    const changed = await saveSiteSettings(
      deps,
      { id: "u1", role },
      { ...input, email: "contato@exemplo.com.br", instagram: "https://www.instagram.com/benja-nova" },
      VERSION,
    );

    expect(changed).toEqual(["email", "instagram"]);
    expect(tables.site_settings[0].contact).toEqual({
      email: "contato@exemplo.com.br",
      address: row.contact.address,
      mapsUrl: row.contact.mapsUrl,
    });
    expect(tables.site_settings[0].socials).toEqual({ instagram: "https://www.instagram.com/benja-nova" });
    expect(tables.site_settings[0].updated_at).not.toBe(VERSION);
    expect(changes).toEqual([{ entity: "settings" }]);
    expect(audits).toEqual([
      {
        event: "settings.updated",
        resourceId: "site_settings",
        outcome: "success",
        metadata: { entity: "settings", kind: "email,instagram", count: 2 },
      },
    ]);
  });

  it("a auditoria guarda só os nomes dos campos, nunca os valores", async () => {
    const { deps, audits } = setup();
    await saveSiteSettings(deps, admin, { ...input, email: "pessoa@exemplo.com.br", phone: "(11) 3333-3333" }, VERSION);
    const logged = JSON.stringify(audits);
    expect(logged).not.toContain("pessoa@exemplo.com.br");
    expect(logged).not.toContain("3333-3333");
  });

  it("manifesto, Sobre, nome e palavras-chave não mudam: a tela não edita esses campos", async () => {
    const { deps, tables } = setup();
    await saveSiteSettings(deps, admin, { ...input, tagline: "Novo slogan" }, VERSION);
    const [saved] = tables.site_settings;
    expect(saved.tagline).toBe("Novo slogan");
    expect(saved.manifesto).toEqual(row.manifesto);
    expect(saved.about).toEqual(row.about);
    expect(saved.name).toBe(row.name);
    expect(saved.keywords).toEqual(row.keywords);
  });

  it("campo apagado sai da configuração, e o site deixa de mostrar o item", async () => {
    const { deps, tables } = setup();
    await saveSiteSettings(deps, admin, { ...input, mapsUrl: "", instagram: "" }, VERSION);
    expect(tables.site_settings[0].contact).toEqual({ address: row.contact.address });
    expect(tables.site_settings[0].socials).toEqual({});
  });

  it.each<Role>(["editor", "viewer", "pending"])("%s não salva: nada muda, nada é auditado", async (role) => {
    const { deps, tables, audits, changes } = setup();
    await expect(
      saveSiteSettings(deps, { id: "u1", role }, { ...input, tagline: "Invasão" }, VERSION),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(tables.site_settings[0].tagline).toBe(row.tagline);
    expect(audits).toEqual([]);
    expect(changes).toEqual([]);
  });

  it("link perigoso devolve erro no campo e não grava", async () => {
    const { deps, tables, audits } = setup();
    await expect(
      saveSiteSettings(deps, admin, { ...input, instagram: "javascript:alert(1)", phone: "ligue já" }, VERSION),
    ).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      fieldErrors: {
        instagram: expect.arrayContaining(["Use um link completo, começando com https://."]),
        phone: [expect.stringContaining("Use só números")],
      },
    });
    expect(tables.site_settings[0].socials).toEqual(row.socials);
    expect(audits).toEqual([]);
  });

  it("versão desatualizada é conflito e não sobrescreve quem salvou antes", async () => {
    const { deps, tables, audits, changes } = setup();
    await saveSiteSettings(deps, admin, { ...input, tagline: "Primeira pessoa" }, VERSION);
    audits.length = 0;
    changes.length = 0;

    await expect(saveSiteSettings(deps, admin, { ...input, tagline: "Segunda pessoa" }, VERSION)).rejects.toMatchObject(
      {
        code: "CONFLICT",
      },
    );
    expect(tables.site_settings[0].tagline).toBe("Primeira pessoa");
    expect(audits).toEqual([]);
    expect(changes).toEqual([]);
  });

  it("sem alteração real não grava, não audita e não renova o cache", async () => {
    const { deps, tables, audits, changes } = setup();
    expect(await saveSiteSettings(deps, admin, input, VERSION)).toEqual([]);
    expect(tables.site_settings[0].updated_at).toBe(VERSION);
    expect(audits).toEqual([]);
    expect(changes).toEqual([]);
  });

  it("sem auditoria nada é gravado: evento crítico aborta a operação", async () => {
    const { deps, tables, changes } = setup();
    deps.audit = vi.fn().mockRejectedValue(new Error("auditoria fora do ar"));
    await expect(saveSiteSettings(deps, admin, { ...input, tagline: "Novo" }, VERSION)).rejects.toThrow(
      "auditoria fora do ar",
    );
    expect(tables.site_settings[0].tagline).toBe(row.tagline);
    expect(changes).toEqual([]);
  });

  it("gravação que falha fica na auditoria como falha e não renova o cache", async () => {
    const { deps, audits, changes } = setup();
    deps.store.saveSettings = vi.fn().mockRejectedValue(new Error("banco fora do ar"));
    await expect(saveSiteSettings(deps, admin, { ...input, tagline: "Novo" }, VERSION)).rejects.toThrow(
      "banco fora do ar",
    );
    expect(audits.map((event) => event.outcome)).toEqual(["success", "failure"]);
    expect(changes).toEqual([]);
  });

  describe("ambiente sem a linha no banco", () => {
    it("o painel mostra os valores de referência, sem versão", async () => {
      const { deps } = setup([]);
      expect(await loadSettingsForEdit(deps)).toEqual({ settings: siteSettings, updatedAt: null });
    });

    it("a primeira gravação cria a linha, com referência no que a tela não edita", async () => {
      const { deps, tables } = setup([]);
      await saveSiteSettings(
        deps,
        admin,
        {
          ...input,
          tagline: "Novo slogan",
          address: siteSettings.contact.address,
          mapsUrl: siteSettings.contact.mapsUrl,
          instagram: siteSettings.socials.instagram,
          tiktok: siteSettings.socials.tiktok,
          linkedin: siteSettings.socials.linkedin,
        },
        null,
      );
      expect(tables.site_settings).toHaveLength(1);
      const [created] = tables.site_settings;
      expect(created.tagline).toBe("Novo slogan");
      expect(created.name).toBe(siteSettings.name);
      expect(created.short_name).toBe(siteSettings.shortName);
      expect(created.manifesto).toEqual(siteSettings.manifesto);
      expect(created.about).toEqual(siteSettings.about);
      expect(created.keywords).toEqual(siteSettings.keywords);
      expect(created.socials).toEqual(siteSettings.socials);
    });

    it("quem abriu a tela antes da linha existir recebe conflito", async () => {
      const { deps, tables } = setup();
      await expect(saveSiteSettings(deps, admin, { ...input, tagline: "Novo" }, null)).rejects.toMatchObject({
        code: "CONFLICT",
      });
      expect(tables.site_settings[0].tagline).toBe(row.tagline);
    });
  });
});
