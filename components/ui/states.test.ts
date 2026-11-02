/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : states.test.ts
 Descrição    : Testes dos estados de carregamento, lista vazia e erro.

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
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
──────────────────────────────────────────────────────────────────────────────
*/

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CardsSkeleton, EmptyState, ErrorState, LoadingState } from "./states";

describe("estados globais (LAY-07)", () => {
  it("carregamento é anunciado por leitor de tela, e a animação fica escondida dele", () => {
    const markup = renderToStaticMarkup(createElement(LoadingState, { label: "Carregando cases…" }));
    expect(markup).toContain('role="status"');
    expect(markup).toContain("Carregando cases…");
    expect(markup).toContain('aria-hidden="true"');
  });

  it("espaço reservado da grade não é lido como conteúdo", () => {
    const markup = renderToStaticMarkup(createElement(CardsSkeleton, { count: 2 }));
    expect(markup).toContain('aria-hidden="true"');
    expect(markup.match(/<li/g)).toHaveLength(2);
  });

  it("vazio mostra o próximo passo só quando ele existe", () => {
    const withAction = renderToStaticMarkup(
      createElement(EmptyState, { action: { href: "/cases", label: "Ver todos" }, children: "Nada aqui." }),
    );
    expect(withAction).toContain('href="/cases"');
    expect(renderToStaticMarkup(createElement(EmptyState, { children: "Nada aqui." }))).not.toContain("<a");
  });

  it("erro mostra o código de atendimento só quando existe, e oferece as saídas", () => {
    const render = (digest?: string) =>
      renderToStaticMarkup(
        createElement(ErrorState, {
          error: Object.assign(new Error("detalhe interno"), { digest }),
          retry: vi.fn(),
          description: "Tente de novo.",
        }),
      );
    expect(render("abc123")).toContain("abc123");
    expect(render()).not.toContain("Código de atendimento");
    expect(render()).toContain("Tentar novamente");
    expect(render()).toContain('href="/"');
    // A mensagem interna do erro nunca chega ao visitante.
    expect(render("abc123")).not.toContain("detalhe interno");
  });
});
