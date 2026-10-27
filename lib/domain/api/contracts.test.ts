/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : contracts.test.ts
 Descrição    : Testes de paginação, validação de query e DTOs públicos.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-02).
 26/10/2026 Vinícius Nishimura Reis  Testes dos DTOs de página e CTA (DB-03).
 26/10/2026 Vinícius Nishimura Reis  Testes de áreas, serviços e mídia (DB-04).
 26/10/2026 Vinícius Nishimura Reis  Id da mídia no mapeamento e fora do DTO (ADM-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { area, caseStudy, service } from "../content/__fixtures__/snapshot";
import {
  caseQuerySchema,
  ctaQuerySchema,
  paginate,
  toAreaDetailDTO,
  toCaseCardDTO,
  toCtaDTO,
  toPageDTO,
  toServiceDTO,
} from "./contracts";

describe("paginação", () => {
  it("calcula meta e fatia os itens", () => {
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual({
      data: [3, 4],
      meta: { page: 2, pageSize: 2, total: 5, totalPages: 3 },
    });
  });

  it("retorna página vazia além do fim e totalPages mínimo 1", () => {
    expect(paginate([], 3, 10)).toEqual({ data: [], meta: { page: 3, pageSize: 10, total: 0, totalPages: 1 } });
  });
});

describe("validação de query", () => {
  it("aplica padrões e converte números", () => {
    expect(caseQuerySchema.parse({ page: "2" })).toMatchObject({ page: 2, pageSize: 12 });
  });

  it("rejeita pageSize acima do máximo e slug inválido", () => {
    expect(caseQuerySchema.safeParse({ pageSize: "500" }).success).toBe(false);
    expect(caseQuerySchema.safeParse({ category: "../admin" }).success).toBe(false);
  });
});

describe("DTOs públicos", () => {
  it("não expõem id interno, status nem campos de controle", () => {
    const dto = toServiceDTO(service("svc-1", ["area-1"], { slug: "audiovisual" }), [
      area("area-1", { slug: "criacao" }),
    ]);
    expect(dto).not.toHaveProperty("id");
    expect(dto).not.toHaveProperty("status");
    expect(dto).not.toHaveProperty("provisional");
    expect(dto).toMatchObject({ slug: "audiovisual", areas: ["criacao"], url: "/servicos/audiovisual" });
  });

  it("monta card de case com categoria resolvida", () => {
    const dto = toCaseCardDTO({
      ...caseStudy("case-1", "cat", ["svc"], { slug: "fecap" }),
      categoryName: "Assessoria",
      categorySlug: "assessoria",
    });
    expect(dto.category).toEqual({ slug: "assessoria", name: "Assessoria" });
    expect(dto.url).toBe("/cases/fecap");
  });
});

describe("páginas e CTAs (DB-03)", () => {
  const page = {
    id: "p1",
    slug: "sobre",
    title: "Sobre",
    status: "published" as const,
    publishedAt: "2026-10-20T00:00:00.000Z",
    updatedAt: "2026-10-20T00:00:00.000Z",
    blocks: [{ id: "b1", type: "rich-text" as const, content: { paragraphs: ["Olá."] }, order: 1 }],
  };

  it("PageDTO traz a rota da página e os blocos sem id nem ordem", () => {
    expect(toPageDTO(page)).toEqual({
      slug: "sobre",
      title: "Sobre",
      description: undefined,
      path: "/sobre",
      blocks: [{ type: "rich-text", content: { paragraphs: ["Olá."] } }],
    });
    expect(toPageDTO({ ...page, slug: "campanha-2026" }).path).toBeNull();
  });

  it("CtaDTO expõe só rótulo e link resolvido", () => {
    expect(toCtaDTO({ label: "Ver cases", link: { href: "/cases", external: false } })).toEqual({
      label: "Ver cases",
      href: "/cases",
      external: false,
    });
  });

  it("placement de CTA é obrigatório e fechado", () => {
    expect(ctaQuerySchema.safeParse({ placement: "home-hero" }).success).toBe(true);
    expect(ctaQuerySchema.safeParse({}).success).toBe(false);
    expect(ctaQuerySchema.safeParse({ placement: "rodape" }).success).toBe(false);
  });
});

describe("detalhe de área (DB-04)", () => {
  it("AreaDetailDTO lista serviços com link, sem ids internos", () => {
    const criacao = area("area-uuid-1", { slug: "criacao", name: "Criação" });
    const audiovisual = service("service-uuid-2", [criacao.id], { slug: "audiovisual", name: "Audiovisual" });
    const dto = toAreaDetailDTO({ area: criacao, services: [audiovisual] });
    expect(dto.url).toBe("/areas#criacao");
    expect(dto.services).toEqual([
      { slug: "audiovisual", name: "Audiovisual", summary: "s", url: "/servicos/audiovisual" },
    ]);
    expect(JSON.stringify(dto)).not.toMatch(/uuid/);
  });
});

describe("mídia nos DTOs (ADM-06)", () => {
  it("o id interno da biblioteca de mídia nunca sai na API pública", () => {
    const dto = toServiceDTO(
      service("s1", [], { image: { id: "media-uuid-9", src: "/brand/x.webp", alt: "Imagem" } }),
      [],
    );
    expect(dto.image).toEqual({ src: "/brand/x.webp", alt: "Imagem", width: undefined, height: undefined });
  });
});
