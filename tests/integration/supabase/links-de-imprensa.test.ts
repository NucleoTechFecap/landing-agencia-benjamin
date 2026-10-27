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
 Modificado em: 27/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (CASE-10).
 27/10/2026 Vinícius Nishimura Reis  Massa própria no teste, sem depender de dados do banco local (CASE-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { fetchCasesAndCategories } from "@/lib/server/content/supabase/queries";
import { anonClient, hasSupabaseTestEnv, must, serviceClient, supabaseTestEnv, testSuffix } from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});

describe.runIf(hasSupabaseTestEnv)("links de imprensa no banco (CASE-10)", () => {
  const admin = hasSupabaseTestEnv ? serviceClient() : (null as never);
  const suffix = testSuffix();
  const slug = `clipping-${suffix}`;
  const ids = { category: "", media: "" };
  const published = { status: "published", published_at: new Date(Date.now() - 60_000).toISOString() };

  // Massa própria: o teste roda num banco recém-criado (db reset), sem depender de dados locais.
  beforeAll(async () => {
    const [category] = await must(
      admin
        .from("case_categories")
        .insert({ ...published, slug: `categoria-clipping-${suffix}`, name: "Categoria clipping" })
        .select("id"),
    );
    const [media] = await must(
      admin
        .from("media_assets")
        .insert({
          path: `testes/clipping-${suffix}.webp`,
          mime_type: "image/webp",
          width: 1200,
          height: 750,
          alt_text: "Capa do teste de clipping",
        })
        .select("id"),
    );
    ids.category = category.id;
    ids.media = media.id;
  });

  afterAll(async () => {
    await admin.from("cases").delete().eq("slug", slug);
    await admin.from("case_categories").delete().eq("id", ids.category);
    await admin.from("media_assets").delete().eq("id", ids.media);
  });

  it("a constraint de external_links aceita veículo e data, e o site lê de volta", async () => {
    await must(
      admin.from("cases").insert({
        ...published,
        slug,
        title: "Clipping de teste",
        client_name: "FECAP",
        category_id: ids.category,
        summary: "Releases e matérias conquistadas para a FECAP na imprensa.",
        cover_media_id: ids.media,
        external_links: [
          { label: "Matéria no portal", url: "https://exemplo.com.br/materia", source: "Estadão", date: "2026-09-15" },
          { label: "Release", url: "https://www.fecap.br/release" },
        ],
      }),
    );
    const { cases } = await fetchCasesAndCategories(anonClient(), supabaseTestEnv.url!);
    expect(cases.find((item) => item.slug === slug)?.externalLinks).toEqual([
      { label: "Matéria no portal", url: "https://exemplo.com.br/materia", source: "Estadão", date: "2026-09-15" },
      { label: "Release", url: "https://www.fecap.br/release" },
    ]);
  });
});
