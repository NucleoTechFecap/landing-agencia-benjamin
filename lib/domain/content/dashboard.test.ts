/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : dashboard.test.ts
 Descrição    : Testes dos indicadores, conteúdos recentes e atalhos do início do painel.

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

import { describe, expect, it } from "vitest";
import { contentIndicators, quickActions, recentItems } from "./dashboard";
import { assembleOverview, countByStatus, type OverviewGroup, type OverviewItem } from "./overview";
import type { ContentEntityType } from "./types";

const item = (title: string, status: OverviewItem["status"], updatedAt: string, overrides = {}): OverviewItem => ({
  id: title,
  title,
  order: 0,
  status,
  publishedAt: null,
  updatedAt,
  editHref: `/admin/${title}`,
  groupLabel: "Grupo",
  canEdit: true,
  notes: { provisional: false, missing: [], warnings: [] },
  ...overrides,
});

const group = (type: ContentEntityType, adminPath: string, items: OverviewItem[]): OverviewGroup => ({
  type,
  label: type,
  adminPath,
  items,
  counts: countByStatus(items),
});

const value = (indicators: ReturnType<typeof contentIndicators>, key: string) =>
  indicators.find((indicator) => indicator.key === key)?.value;

describe("início do painel", () => {
  const overview = assembleOverview([
    group("case", "/admin/cases", [
      item("publicado", "published", "2026-11-01T10:00:00Z"),
      item("rascunho", "draft", "2026-11-03T10:00:00Z"),
      item("arquivado", "archived", "2026-11-04T10:00:00Z"),
    ]),
    group("service", "/admin/servicos", [
      item("servico", "published", "2026-11-02T10:00:00Z", {
        notes: { provisional: true, missing: [], warnings: [] },
      }),
    ]),
  ]);

  it("os números saem do conteúdo lido, sem contar o arquivado como cadastrado", () => {
    const indicators = contentIndicators(overview);
    expect(value(indicators, "cases")).toBe(2);
    expect(value(indicators, "cases-publicados")).toBe(1);
    expect(value(indicators, "servicos")).toBe(1);
    expect(value(indicators, "rascunhos")).toBe(1);
    expect(value(indicators, "revisao")).toBe(1);
  });

  it("grupo que o papel não vê não vira zero: o indicador não aparece", () => {
    const onlyServices = contentIndicators(
      assembleOverview([group("service", "/admin/servicos", [item("s", "draft", "2026-11-01T10:00:00Z")])]),
    );
    expect(value(onlyServices, "cases")).toBeUndefined();
    expect(value(onlyServices, "cases-publicados")).toBeUndefined();
    expect(value(onlyServices, "servicos")).toBe(1);
    expect(contentIndicators(assembleOverview([]))).toEqual([]);
  });

  it("a revisão só pede atenção quando há o que revisar", () => {
    const highlight = (source: typeof overview) =>
      contentIndicators(source).find((indicator) => indicator.key === "revisao")?.highlight;
    expect(highlight(overview)).toBe(true);
    expect(highlight(assembleOverview([group("case", "/admin/cases", [])]))).toBe(false);
  });

  it("recentes vêm do mais novo ao mais antigo, sem arquivados e com limite", () => {
    expect(recentItems(overview).map((entry) => entry.title)).toEqual(["rascunho", "servico", "publicado"]);
    expect(recentItems(overview, 1)).toHaveLength(1);
  });

  describe("atalhos", () => {
    const keys = (role: Parameters<typeof quickActions>[0], home: string | null = "/admin/paginas/1") =>
      quickActions(role, home).map((action) => action.key);

    it("administrador recebe todos, e o site abre em outra aba", () => {
      expect(keys("admin")).toEqual(["novo-case", "pagina-inicial", "servicos", "informacoes", "site"]);
      expect(quickActions("admin", null).find((action) => action.key === "site")?.external).toBe(true);
    });

    it("editor não altera configurações e leitor só vê o site", () => {
      expect(keys("editor")).not.toContain("informacoes");
      expect(keys("viewer")).toEqual(["site"]);
    });

    it("sem saber o endereço da página inicial, o atalho não aparece", () => {
      expect(keys("admin", null)).not.toContain("pagina-inicial");
    });
  });
});
