/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : flash-message.test.ts
 Descrição    : Garante que avisos do CMS aceitam somente códigos conhecidos.

 Desenvolvedor: Codex

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Codex                     Testa a lista fechada de avisos (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FlashMessage } from "./flash-message";

describe("FlashMessage", () => {
  it("ignora mensagens de aviso arbitrárias vindas da query string", () => {
    const markup = renderToStaticMarkup(createElement(FlashMessage, { aviso: "Clique aqui para redefinir sua senha" }));

    expect(markup).toBe("");
  });

  it("renderiza somente avisos conhecidos e remove códigos duplicados", () => {
    const markup = renderToStaticMarkup(createElement(FlashMessage, { aviso: "ctas-fallback,ignorado,ctas-fallback" }));

    expect(markup).toContain("CTAs publicados passarão a usar o link de fallback.");
    expect(markup).not.toContain("ignorado");
    expect(markup.match(/CTAs publicados/g)).toHaveLength(1);
  });
});
