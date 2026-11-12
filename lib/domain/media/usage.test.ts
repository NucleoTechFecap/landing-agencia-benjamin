/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : usage.test.ts
 Descrição    : Testes da busca de usos de um arquivo da biblioteca.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-09).
 12/11/2026 Codex                     Amplia gestão editorial e segurança do painel.
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import type { PageBlock } from "@/lib/domain/content/blocks";
import type { CaseStudy, Page, Service } from "@/lib/domain/content/types";
import { describeMediaUsage, findMediaUsage, mediaDisplayName, usageRequiresAlt, type MediaIdentity } from "./usage";

const asset: MediaIdentity = {
  id: "m1",
  src: "https://projeto.supabase.co/storage/v1/object/public/media/2026/11/abc-foto.webp",
  path: "2026/11/abc-foto.webp",
};
const ref = (id: string) => ({ id, src: `/x/${id}.webp`, alt: "Texto" });
const service = (over: Partial<Service>) => ({ id: "s1", name: "Social", status: "draft", ...over }) as Service;
const study = (over: Partial<CaseStudy>) =>
  ({ id: "c1", title: "Meridiano", status: "draft", gallery: [], ...over }) as unknown as CaseStudy;
const team = (src: string): PageBlock => ({
  id: "b1",
  type: "team",
  order: 0,
  content: { members: [{ name: "Ana" }, { name: "Bia", photo: { src, alt: "Bia sorrindo" } }] },
});
const page = (blocks: PageBlock[], over: Partial<Page> = {}) =>
  ({ id: "p1", slug: "sobre", title: "Sobre", status: "draft", blocks, ...over }) as Page;
const content = (over: Partial<Parameters<typeof findMediaUsage>[1]> = {}) => ({
  services: [],
  cases: [],
  pages: [],
  ...over,
});

describe("findMediaUsage", () => {
  it("arquivo sem uso devolve lista vazia", () => {
    expect(findMediaUsage(asset, content({ services: [service({ image: ref("outro") })] }))).toEqual([]);
  });

  it("encontra imagem de serviço, capa e galeria, em qualquer estado", () => {
    const usage = findMediaUsage(
      asset,
      content({
        services: [service({ image: ref("m1"), status: "archived" })],
        cases: [study({ cover: ref("m1") }), study({ id: "c2", title: "Outro", gallery: [ref("m1")] })],
      }),
    );
    expect(usage.map(({ entity, place, status }) => [entity, place, status])).toEqual([
      ["service", "imagem", "archived"],
      ["case", "capa", "draft"],
      ["case", "galeria", "draft"],
    ]);
  });

  it("encontra a foto do bloco Nosso time, que não tem FK no banco", () => {
    const usage = findMediaUsage(asset, content({ pages: [page([team(asset.src)])] }));
    expect(usage).toMatchObject([{ entity: "page", id: "p1", place: "foto do time" }]);
  });

  it("identifica imagem de bloco para impedir exclusão e perda de texto alternativo", () => {
    const image: PageBlock = {
      id: "b1",
      type: "image",
      order: 0,
      content: { image: { id: asset.id, src: asset.src, alt: "Descrição" } },
    };
    const usage = findMediaUsage(asset, content({ pages: [page([image])] }));
    expect(usage).toMatchObject([{ entity: "page", place: "imagem do bloco" }]);
    expect(usageRequiresAlt(usage[0]!)).toBe(true);
  });

  it("reconhece a foto pelo caminho quando o endereço do projeto mudou", () => {
    const moved = `https://outro.supabase.co/storage/v1/object/public/media/${asset.path}`;
    expect(findMediaUsage(asset, content({ pages: [page([team(moved)])] }))).toHaveLength(1);
  });

  it("não confunde arquivo com nome parecido", () => {
    const other = `https://projeto.supabase.co/storage/v1/object/public/media/2026/11/xabc-foto.webp`;
    expect(findMediaUsage(asset, content({ pages: [page([team(other)])] }))).toEqual([]);
  });

  it("arquivo de /public só casa com o caminho exato", () => {
    const local: MediaIdentity = { id: "m2", src: "/brand/foto.webp", path: "/brand/foto.webp" };
    expect(findMediaUsage(local, content({ pages: [page([team("/brand/foto.webp")])] }))).toHaveLength(1);
    expect(findMediaUsage(local, content({ pages: [page([team("/outra/brand/foto.webp")])] }))).toEqual([]);
  });

  it("uma página com a mesma foto em duas pessoas conta uma vez", () => {
    const block = team(asset.src);
    const usage = findMediaUsage(asset, content({ pages: [page([block, { ...block, id: "b2" }])] }));
    expect(usage).toHaveLength(1);
  });
});

describe("textos e regras", () => {
  it("descreve tipo, nome, lugar e estado", () => {
    const [usage] = findMediaUsage(asset, content({ cases: [study({ cover: ref("m1"), status: "published" })] }));
    expect(describeMediaUsage(usage)).toBe('Case "Meridiano": capa (publicado)');
  });

  it("exige texto alternativo em conteúdo publicado e na foto do time", () => {
    const base = { entity: "case" as const, id: "c1", slug: "x", name: "X" };
    expect(usageRequiresAlt({ ...base, status: "published", place: "capa" })).toBe(true);
    expect(usageRequiresAlt({ ...base, status: "draft", place: "capa" })).toBe(false);
    expect(usageRequiresAlt({ ...base, status: "draft", place: "foto do time" })).toBe(true);
  });

  it("nome de exibição tira pasta e UUID", () => {
    expect(mediaDisplayName("2026/11/11111111-2222-4333-8444-555555555555-capa.webp")).toBe("capa.webp");
    expect(mediaDisplayName("/brand/cases/fecap.webp")).toBe("fecap.webp");
  });
});
