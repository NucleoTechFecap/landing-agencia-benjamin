/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : conteudo-publico.test.ts
 Descrição    : Integração: leitura pública de configuração, páginas e CTAs com a RLS real.

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

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { siteSettings } from "@/content";
import { fetchCtas, fetchPage, fetchSiteSettings } from "@/lib/server/content/supabase/queries";
import { anonClient, hasSupabaseTestEnv, must, serviceClient, testSuffix } from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

describe.runIf(hasSupabaseTestEnv)("conteúdo público no Supabase (DB-03)", () => {
  const admin = hasSupabaseTestEnv ? serviceClient() : (null as never);
  const suffix = testSuffix();
  const past = new Date(Date.now() - 86_400_000).toISOString();
  const future = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const slugs = { published: `sobre-${suffix}`, draft: `rascunho-${suffix}`, scheduled: `agendada-${suffix}` };
  const ids: { pages: string[]; ctas: string[] } = { pages: [], ctas: [] };
  let previousSettings: Record<string, unknown> | null = null;

  beforeAll(async () => {
    const pages = await must(
      admin
        .from("pages")
        .insert([
          { slug: slugs.published, title: "Sobre (teste)", status: "published", published_at: past },
          { slug: slugs.draft, title: "Rascunho (teste)", status: "draft" },
          { slug: slugs.scheduled, title: "Agendada (teste)", status: "published", published_at: future },
        ])
        .select("id, slug"),
    );
    ids.pages = pages.map((page) => page.id);
    const pageId = (slug: string) => pages.find((page) => page.slug === slug)!.id;
    await must(
      admin.from("blocks").insert([
        { page_id: pageId(slugs.published), type: "rich-text", content: { paragraphs: ["Visível."] }, sort_order: 1 },
        { page_id: pageId(slugs.published), type: "html", content: { html: "<b>x</b>" }, sort_order: 2 },
        { page_id: pageId(slugs.draft), type: "rich-text", content: { paragraphs: ["Oculto."] }, sort_order: 1 },
      ]),
    );
    const ctas = await must(
      admin
        .from("ctas")
        .insert([
          {
            label: `Publicado ${suffix}`,
            placement: "footer",
            target_kind: "internal",
            target_path: "/cases",
            status: "published",
            published_at: past,
          },
          { label: `Rascunho ${suffix}`, placement: "footer", target_kind: "contact", status: "draft" },
        ])
        .select("id"),
    );
    ids.ctas = ctas.map((cta) => cta.id);
    [previousSettings] = await must(admin.from("site_settings").select("*").limit(1));
    await must(
      admin.from("site_settings").upsert({
        id: true,
        name: "Agência Benjamin",
        short_name: "Benja",
        tagline: `Tagline ${suffix}`,
        description: "Descrição de teste.",
        manifesto: siteSettings.manifesto,
        about: siteSettings.about,
        contact: { email: "contato@exemplo.com.br" },
        socials: { instagram: "https://www.instagram.com/agenciabenja" },
      }),
    );
  });

  afterAll(async () => {
    await admin.from("ctas").delete().in("id", ids.ctas);
    await admin.from("pages").delete().in("id", ids.pages);
    if (previousSettings) await admin.from("site_settings").upsert(previousSettings);
    else await admin.from("site_settings").delete().eq("id", true);
  });

  it("visitante lê página publicada com blocos válidos; bloco fora do catálogo é descartado", async () => {
    const page = await fetchPage(anonClient(), slugs.published);
    expect(page?.title).toBe("Sobre (teste)");
    expect(page?.blocks).toEqual([
      { id: expect.any(String), type: "rich-text", content: { paragraphs: ["Visível."] }, order: 1 },
    ]);
  });

  it("rascunho e publicação agendada para o futuro não aparecem para o visitante", async () => {
    expect(await fetchPage(anonClient(), slugs.draft)).toBeNull();
    expect(await fetchPage(anonClient(), slugs.scheduled)).toBeNull();
  });

  it("blocos de página em rascunho não vazam nem consultando a tabela direto", async () => {
    const { data } = await anonClient().from("blocks").select("content").eq("page_id", ids.pages[1]);
    expect(data).toEqual([]);
  });

  it("CTAs: visitante recebe só os publicados", async () => {
    const labels = (await fetchCtas(anonClient())).map((cta) => cta.label);
    expect(labels).toContain(`Publicado ${suffix}`);
    expect(labels).not.toContain(`Rascunho ${suffix}`);
  });

  it("configuração institucional vem do banco", async () => {
    const settings = await fetchSiteSettings(anonClient(), siteSettings);
    expect(settings.tagline).toBe(`Tagline ${suffix}`);
    expect(settings.contact).toEqual({ email: "contato@exemplo.com.br" });
  });

  it("visitante não consegue gravar conteúdo (RLS)", async () => {
    const { error } = await anonClient()
      .from("pages")
      .insert({ slug: `invasao-${suffix}`, title: "Invasão" });
    expect(error).not.toBeNull();
  });
});
