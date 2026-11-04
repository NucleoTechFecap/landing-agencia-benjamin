/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : content-board.test.ts
 Descrição    : Testes da lista de conteúdo: filtro, cartões, capa e arquivados.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (reestruturação do painel).
──────────────────────────────────────────────────────────────────────────────
*/

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContentBoard, matchesBoardFilter, type BoardItem } from "./content-board";

const base = { title: "Assessoria de Imprensa", subtitle: "Instituto Exemplo · Comunicação", status: "draft" } as const;

const boardItem = (overrides: Partial<BoardItem> = {}): BoardItem => ({
  id: "1",
  title: "Blog da Editora",
  order: 0,
  status: "published",
  publishedAt: "2026-10-01T10:00:00Z",
  updatedAt: "2026-10-02T10:00:00Z",
  ...overrides,
});

const render = (items: BoardItem[]) =>
  renderToStaticMarkup(
    createElement(ContentBoard, {
      items,
      basePath: "/admin/cases",
      itemLabel: "case",
      storageKey: "teste",
      empty: "Lista vazia",
    }),
  );

describe("filtro da lista", () => {
  it("sem termo nem estado, mostra tudo", () => {
    expect(matchesBoardFilter(base, "", "")).toBe(true);
    expect(matchesBoardFilter(base, "   ", "")).toBe(true);
  });

  it("casa com o nome e com a linha de apoio, sem diferenciar acento nem caixa", () => {
    expect(matchesBoardFilter(base, "ASSESSORIA", "")).toBe(true);
    expect(matchesBoardFilter(base, "comunicacao", "")).toBe(true);
    expect(matchesBoardFilter(base, "copywriting", "")).toBe(false);
  });

  it("o estado filtra junto com o termo", () => {
    expect(matchesBoardFilter(base, "", "draft")).toBe(true);
    expect(matchesBoardFilter(base, "", "published")).toBe(false);
    expect(matchesBoardFilter(base, "assessoria", "published")).toBe(false);
  });
});

describe("lista de conteúdo", () => {
  it("lista vazia mostra o aviso, sem filtros que não têm o que filtrar", () => {
    const markup = render([]);
    expect(markup).toContain("Lista vazia");
    expect(markup).not.toContain("Buscar case");
  });

  it("o título é o link de edição, e o estado vem em texto", () => {
    const markup = render([boardItem()]);
    expect(markup).toMatch(/<a [^>]*href="\/admin\/cases\/1"[^>]*>Blog da Editora<\/a>/);
    expect(markup).toContain("Publicado");
  });

  it("a capa é decorativa: não repete o nome do item para leitores de tela", () => {
    expect(render([boardItem({ coverSrc: "/capa.webp" })])).toMatch(/<img [^>]*alt=""/);
  });

  it("case sem capa avisa, em vez de deixar um espaço vazio", () => {
    expect(render([boardItem({ coverSrc: "" })])).toContain("Sem capa");
  });

  it("arquivados ficam à parte, recolhidos", () => {
    const markup = render([boardItem(), boardItem({ id: "2", title: "Antigo", status: "archived" })]);
    expect(markup).toContain("Arquivados (1)");
    expect(markup).not.toMatch(/<details[^>]*open/);
  });
});
