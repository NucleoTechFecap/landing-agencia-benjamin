/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : sitemap.test.ts
 Descrição    : Testes das URLs publicadas no sitemap.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  SEO e compartilhamento das páginas públicas (SEG-09).
 12/11/2026 Codex                     Exercita artigos no sitemap (FUT-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it, vi } from "vitest";

/*
 * A capa de um case vem da biblioteca: caminho em /public ou URL absoluta do Storage. Nos dois
 * casos o sitemap precisa publicar uma URL válida (SEG-09).
 */
const STORAGE = "https://projeto.supabase.co/storage/v1/object/public/media/capa.webp";

vi.mock("next/cache", () => ({ cacheTag: () => {}, cacheLife: () => {} }));
vi.mock("@/lib/config/public-env", () => ({ siteUrl: "https://agencia.exemplo", isIndexable: true }));
vi.mock("@/lib/server/blog/repository", () => ({
  listArticles: async () => [{ slug: "artigo", updated_at: "2026-10-20T00:00:00.000Z" }],
}));
vi.mock("@/lib/server/content/repository", () => ({
  listServices: async () => [{ slug: "social-media", updatedAt: "2026-10-20T00:00:00.000Z" }],
  listCases: async () => [
    { slug: "no-storage", updatedAt: "2026-10-20T00:00:00.000Z", cover: { src: STORAGE, alt: "Capa" } },
    { slug: "no-public", updatedAt: "2026-10-20T00:00:00.000Z", cover: { src: "/brand/capa.webp", alt: "Capa" } },
    { slug: "sem-capa", updatedAt: "2026-10-20T00:00:00.000Z" },
  ],
}));

const { default: sitemap } = await import("./sitemap");

describe("sitemap (SEG-09)", () => {
  it("inclui artigos publicados", async () => {
    expect((await sitemap()).some((entry) => entry.url === "https://agencia.exemplo/blog/artigo")).toBe(true);
  });
  const imagesOf = async (slug: string) =>
    (await sitemap()).find((entry) => entry.url === `https://agencia.exemplo/cases/${slug}`)?.images;

  it("capa do Storage mantém a URL absoluta, sem o domínio do site na frente", async () => {
    expect(await imagesOf("no-storage")).toEqual([STORAGE]);
  });

  it("capa em /public vira URL absoluta do site", async () => {
    expect(await imagesOf("no-public")).toEqual(["https://agencia.exemplo/brand/capa.webp"]);
  });

  it("case sem capa não declara imagem", async () => {
    expect(await imagesOf("sem-capa")).toBeUndefined();
  });

  it("toda URL é válida e usa o domínio do site", async () => {
    const entries = await sitemap();
    for (const entry of entries) expect(new URL(entry.url).origin).toBe("https://agencia.exemplo");
    expect(entries.flatMap((entry) => entry.images ?? []).every((image) => URL.canParse(image))).toBe(true);
  });
});
