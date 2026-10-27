/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : links-de-imprensa.test.ts
 Descrição    : Integração: links de clipping com veículo e data gravados e lidos do banco (CASE-10).

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (CASE-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterAll, describe, expect, it, vi } from "vitest";
import { fetchCasesAndCategories } from "@/lib/server/content/supabase/queries";
import { anonClient, hasSupabaseTestEnv, must, serviceClient, supabaseTestEnv, testSuffix } from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});

describe.runIf(hasSupabaseTestEnv)("links de imprensa no banco (CASE-10)", () => {
  const admin = hasSupabaseTestEnv ? serviceClient() : (null as never);
  const slug = `clipping-${testSuffix()}`;

  afterAll(async () => {
    await admin.from("cases").delete().eq("slug", slug);
  });

  it("a constraint de external_links aceita veículo e data, e o site lê de volta", async () => {
    const [category] = await must(admin.from("case_categories").select("id").eq("status", "published").limit(1));
    const [cover] = await must(admin.from("media_assets").select("id").limit(1));
    expect(category && cover, "precisa de uma categoria publicada e uma mídia no banco local").toBeTruthy();
    await must(
      admin.from("cases").insert({
        slug,
        title: "Clipping de teste",
        client_name: "FECAP",
        category_id: category.id,
        summary: "Releases e matérias conquistadas para a FECAP na imprensa.",
        cover_media_id: cover.id,
        external_links: [
          { label: "Matéria no portal", url: "https://exemplo.com.br/materia", source: "Estadão", date: "2026-09-15" },
          { label: "Release", url: "https://www.fecap.br/release" },
        ],
        status: "published",
        published_at: new Date(Date.now() - 60_000).toISOString(),
      }),
    );
    const { cases } = await fetchCasesAndCategories(anonClient(), supabaseTestEnv.url!);
    expect(cases.find((item) => item.slug === slug)?.externalLinks).toEqual([
      { label: "Matéria no portal", url: "https://exemplo.com.br/materia", source: "Estadão", date: "2026-09-15" },
      { label: "Release", url: "https://www.fecap.br/release" },
    ]);
  });
});
