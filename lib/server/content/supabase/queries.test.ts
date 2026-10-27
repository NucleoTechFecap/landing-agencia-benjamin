/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : queries.test.ts
 Descrição    : Testes das consultas públicas ao CMS com cliente Supabase falso.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it, vi } from "vitest";
import { siteSettings } from "@/content";
import { fakeSupabase } from "@/tests/stubs/fake-supabase";
import { fetchCtas, fetchPage, fetchSiteSettings } from "./queries";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});

const control = {
  provisional: false,
  published_at: "2026-10-20T12:00:00+00:00",
  archived_at: null,
  updated_at: "2026-10-20T12:00:00+00:00",
};

describe("consultas públicas do CMS (DB-03)", () => {
  it("CTAs: pede só publicados e as colunas declaradas", async () => {
    const { client, calls } = fakeSupabase({
      ctas: {
        data: [
          {
            ...control,
            id: "c1",
            status: "published",
            label: "Ver cases",
            placement: "home-highlight",
            target_kind: "internal",
            target_path: "/cases",
            sort_order: 1,
          },
          {
            ...control,
            id: "c2",
            status: "draft",
            label: "Rascunho",
            placement: "home-hero",
            target_kind: "internal",
            target_path: "/",
            sort_order: 1,
          },
        ],
      },
    });
    const ctas = await fetchCtas(client);
    expect(ctas.map((cta) => cta.id)).toEqual(["c1"]);
    expect(calls[0].filters).toContainEqual(["status", "published"]);
    expect(calls[0].columns).toContain("target_kind");
  });

  it("página: devolve publicada com blocos e null para rascunho ou inexistente", async () => {
    const { client } = fakeSupabase({
      pages: {
        data: [
          { ...control, id: "p1", slug: "sobre", status: "published", title: "Sobre", description: "Quem somos" },
          { ...control, id: "p2", slug: "privacidade", status: "draft", title: "Privacidade", description: null },
        ],
      },
      blocks: {
        data: [
          { id: "b1", page_id: "p1", type: "rich-text", content: { paragraphs: ["Olá."] }, sort_order: 1 },
          { id: "b9", page_id: "p2", type: "rich-text", content: { paragraphs: ["Não aparece."] }, sort_order: 1 },
        ],
      },
    });
    const page = await fetchPage(client, "sobre");
    expect(page?.blocks.map((block) => block.id)).toEqual(["b1"]);
    expect(await fetchPage(client, "privacidade")).toBeNull();
    expect(await fetchPage(client, "inexistente")).toBeNull();
  });

  it("configurações: sem linha no banco usa a configuração versionada", async () => {
    const { client } = fakeSupabase({ site_settings: { data: [] } });
    expect(await fetchSiteSettings(client, siteSettings)).toBe(siteSettings);
  });

  it("falha do banco vira SERVICE_UNAVAILABLE com mensagem segura", async () => {
    const { client } = fakeSupabase({ ctas: { error: { message: "connection refused", code: "08006" } } });
    await expect(fetchCtas(client)).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      message: expect.not.stringContaining("connection"),
    });
  });
});
