/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : about-preview.test.ts
 Descrição    : Testes do bloco Quem é a Benjamin com o texto da configuração.

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
 01/11/2026 Vinícius Nishimura Reis  Testes de aceite do bloco Quem é a Benjamin (HOME-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { siteSettings } from "@/content";
import { AboutPreview } from "./about-preview";

const render = (about: Partial<typeof siteSettings.about> = {}, solutionsSummary = "9 serviços e mais.") =>
  renderToStaticMarkup(
    createElement(AboutPreview, {
      settings: { ...siteSettings, about: { ...siteSettings.about, ...about } },
      solutionsSummary,
    }),
  );

describe('bloco "Quem é a Benjamin" (HOME-02)', () => {
  it("mostra apresentação, proposta, atuação e entregas com o texto da configuração", () => {
    const markup = render({
      title: "Título vindo do painel",
      intro: "Quem somos, editado.",
      valueProposition: "Proposta, editada.",
      howWeWork: "Atuação, editada.",
    });
    for (const text of [
      "Título vindo do painel",
      "Quem somos, editado.",
      "Proposta, editada.",
      "Atuação, editada.",
      "9 serviços e mais.",
    ]) {
      expect(markup).toContain(text);
    }
  });

  it("o caminho para saber mais leva à página Sobre", () => {
    expect(render()).toContain('href="/sobre"');
  });

  it("o selo aparece só em texto provisório", () => {
    expect(render({ provisional: true })).toContain("Conteúdo provisório");
    expect(render({ provisional: false })).not.toContain("Conteúdo provisório");
  });

  it("os tópicos são títulos reais, para quem navega por leitor de tela", () => {
    expect(render().match(/<h3/g)).toHaveLength(4);
  });
});
