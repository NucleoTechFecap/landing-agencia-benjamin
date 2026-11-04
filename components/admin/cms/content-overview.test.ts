/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : content-overview.test.ts
 Descrição    : Testes da tela de visão geral: fila de revisão, estados vazios e link por papel.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-18).
──────────────────────────────────────────────────────────────────────────────
*/

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  assembleOverview,
  countByStatus,
  type OverviewGroup,
  type OverviewItem,
  type ReviewNotes,
} from "@/lib/domain/content/overview";
import { ContentOverviewView } from "./content-overview";

const NO_NOTES: ReviewNotes = { provisional: false, missing: [], warnings: [] };

const item = (overrides: Partial<OverviewItem> & { id: string }): OverviewItem => ({
  title: `Item ${overrides.id}`,
  order: 0,
  status: "published",
  publishedAt: "2026-10-20T12:00:00.000Z",
  updatedAt: "2026-10-20T12:00:00.000Z",
  editHref: `/admin/servicos/${overrides.id}`,
  groupLabel: "Serviços",
  canEdit: true,
  notes: NO_NOTES,
  ...overrides,
});

const group = (items: OverviewItem[]): OverviewGroup => ({
  type: "service",
  label: "Serviços",
  adminPath: "/admin/servicos",
  items,
  counts: countByStatus(items),
});

const render = (groups: OverviewGroup[]) =>
  renderToStaticMarkup(createElement(ContentOverviewView, { overview: assembleOverview(groups) }));

describe("tela de visão geral (ADM-18)", () => {
  it("mostra na fila o motivo de cada item, com título adequado ao estado", () => {
    const markup = render([
      group([
        item({ id: "a", title: "No ar", notes: { ...NO_NOTES, missing: ["Serviço sem área de atuação."] } }),
        item({
          id: "b",
          title: "Rascunho",
          status: "draft",
          publishedAt: null,
          notes: { ...NO_NOTES, missing: ["Resumo: preencha."] },
        }),
        item({ id: "c", title: "Provisório", provisional: true, notes: { ...NO_NOTES, provisional: true } }),
        item({ id: "d", title: "Com aviso", notes: { ...NO_NOTES, warnings: ["Serviço publicado sem área."] } }),
      ]),
    ]);
    expect(markup).toContain("Precisa de revisão (4)");
    expect(markup).toContain("No ar com pendências:");
    expect(markup).toContain("Serviço sem área de atuação.");
    expect(markup).toContain("Para publicar, falta:");
    expect(markup).toContain("Resumo: preencha.");
    expect(markup).toContain("Textos provisórios, sem outra pendência (1)");
    expect(markup).toContain("Aguardam aprovação da Benjamin.");
    expect(markup).toContain("Avisos:");
    expect(markup).toContain("Provisório</span>");
  });

  it("dá o link de edição a quem edita e o de leitura a quem só lê", () => {
    const notes = { ...NO_NOTES, provisional: true };
    expect(render([group([item({ id: "a", notes })])])).toMatch(
      /href="\/admin\/servicos\/a"[^>]*>Editar<span class="sr-only"> Item a<\/span>/,
    );
    const readOnly = render([group([item({ id: "a", notes, canEdit: false })])]);
    expect(readOnly).toMatch(/href="\/admin\/servicos\/a"[^>]*>Ver<span class="sr-only"> Item a<\/span>/);
    expect(readOnly).not.toContain(">Editar<");
  });

  it("resume cada item na tabela do grupo, com estado e data de atualização", () => {
    const markup = render([
      group([
        item({ id: "a", title: "Em dia" }),
        item({ id: "b", title: "Completo", status: "draft", publishedAt: null }),
        item({
          id: "c",
          title: "Pendente",
          status: "draft",
          publishedAt: null,
          notes: { ...NO_NOTES, missing: ["Um.", "Dois."] },
        }),
        item({ id: "d", title: "Provisório", provisional: true, notes: { ...NO_NOTES, provisional: true } }),
        item({
          id: "e",
          title: "Guardado",
          status: "archived",
          publishedAt: null,
          archivedAt: "2026-10-20T12:00:00.000Z",
        }),
      ]),
    ]);
    expect(markup).toContain("2 publicados · 2 rascunhos · 1 arquivado");
    for (const summary of ["Em dia", "Pronto para publicar", "2 pendências", "Aprovar texto"]) {
      expect(markup).toContain(summary);
    }
    expect(markup).toContain("Arquivados (1)");
    // 20/10/2026 12:00 UTC no fuso de São Paulo.
    expect(markup).toContain("20/10/2026");
  });

  it("o que tem pendência fica à vista; o que é só provisório fica recolhido, com a contagem", () => {
    const markup = render([
      group([
        item({ id: "a", title: "Só provisório", provisional: true, notes: { ...NO_NOTES, provisional: true } }),
        item({
          id: "b",
          title: "Provisório e pendente",
          provisional: true,
          notes: { ...NO_NOTES, provisional: true, missing: ["Falta algo."] },
        }),
      ]),
    ]);
    const details = markup.slice(markup.indexOf("<details"), markup.indexOf("</details>"));
    expect(details).toContain("Só provisório");
    expect(details).not.toContain("Provisório e pendente");
    expect(markup.slice(0, markup.indexOf("<details"))).toContain("Provisório e pendente");
    expect(details).toContain("sem outra pendência (1)");
    expect(details).not.toContain(" open");
  });

  it("sem item só provisório, a lista recolhida não aparece", () => {
    const markup = render([group([item({ id: "a", notes: { ...NO_NOTES, missing: ["Falta algo."] } })])]);
    expect(markup).not.toContain("Textos provisórios");
  });

  it("estado vazio distingue base sem conteúdo, nada a revisar e papel sem acesso", () => {
    expect(render([group([])])).toContain("Ainda não há conteúdo cadastrado.");
    expect(render([group([])])).toContain("Nenhum item cadastrado ainda.");
    expect(render([group([item({ id: "a" })])])).toContain("Nada por aqui");
    expect(render([])).toContain("não dá acesso a nenhum tipo de conteúdo");
    expect(render([])).not.toContain("Precisa de revisão");
  });
});
