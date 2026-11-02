/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : case-card.test.ts
 Descrição    : Testes do card de case: dados, capa opcional e selo de provisório.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Foco visível no card e testes do portfólio (CASE-01).
──────────────────────────────────────────────────────────────────────────────
*/

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CaseCard, type CaseCardData } from "./case-card";

const base = {
  id: "c1",
  slug: "meridiano",
  title: "Social media para a Meridiano",
  client: "Meridiano",
  summary: "Resumo do case.",
  categoryName: "Social Media & Criação",
  status: "published",
  publishedAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  gallery: [],
  externalLinks: [],
  team: [],
  serviceIds: [],
  featured: false,
  order: 0,
} as unknown as CaseCardData;

const render = (item: Partial<CaseCardData> = {}) =>
  renderToStaticMarkup(createElement(CaseCard, { item: { ...base, ...item } }));

describe("card de case (CASE-01)", () => {
  it("mostra capa, cliente, categoria e leva ao detalhe", () => {
    const markup = render({ cover: { src: "/brand/capa.webp", alt: "Capa do case" } });
    expect(markup).toContain('alt="Capa do case"');
    expect(markup).toContain("Meridiano");
    expect(markup).toContain("Social Media &amp; Criação");
    expect(markup).toContain('href="/cases/meridiano"');
  });

  it("sem capa nem categoria, não deixa espaço reservado", () => {
    const markup = render({ categoryName: "" });
    expect(markup).not.toContain("<img");
    expect(markup).not.toContain("aspect-[16/10]");
  });

  it("selo de provisório só no conteúdo provisório", () => {
    expect(render({ provisional: true })).toContain("Conteúdo provisório");
    expect(render({ provisional: false })).not.toContain("Conteúdo provisório");
  });
});
