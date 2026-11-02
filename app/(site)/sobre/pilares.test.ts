/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : pilares.test.ts
 Descrição    : Proposta de valor e modelo de atuação vêm do conteúdo editável.

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
 01/11/2026 Vinícius Nishimura Reis  Testes de aceite da proposta de valor (SOB-02).
──────────────────────────────────────────────────────────────────────────────
*/

import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { siteSettings } from "@/content";

/*
 * Proposta de valor e modelo de atuação vêm da configuração, que o painel sobrescreve quando há
 * bloco Sobre publicado: nada desses textos pode estar fixo na página (SOB-02).
 */
const about = vi.hoisted(() => ({ current: {} as Record<string, unknown> }));
vi.mock("next/cache", () => ({ cacheTag: () => {}, cacheLife: () => {} }));
vi.mock("@/lib/server/content/repository", () => ({
  getSiteSettings: async () => ({ ...siteSettings, about: { ...siteSettings.about, ...about.current } }),
  listAreas: async () => [],
  getPage: async () => null,
}));

const { default: AboutPage } = await import("./page");
const render = async () => renderToStaticMarkup((await AboutPage()) as ReactElement);

describe("proposta de valor e modelo de atuação (SOB-02)", () => {
  it("mostra o texto vindo da configuração, na ordem da seção", async () => {
    about.current = {
      valueProposition: "Proposta editada no painel.",
      howWeWork: "Modelo editado no painel.",
      fecapRelation: "Relação editada no painel.",
    };
    const markup = await render();
    const positions = ["Proposta editada no painel.", "Modelo editado no painel.", "Relação editada no painel."].map(
      (text) => markup.indexOf(text),
    );
    expect(positions.every((position) => position > 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("nenhum texto antigo fica para trás quando o conteúdo muda", async () => {
    about.current = { valueProposition: "Proposta editada no painel." };
    expect(await render()).not.toContain(siteSettings.about.valueProposition);
  });

  it("cada pilar tem um título, para a leitura ser escaneável", async () => {
    about.current = {};
    const markup = await render();
    for (const title of ["Proposta de valor", "Modelo de atuação", "Dentro da FECAP"]) {
      expect(markup).toContain(`>${title}</h3>`);
    }
  });

  it("o selo acompanha o estado de aprovação do texto", async () => {
    about.current = { provisional: true };
    expect(await render()).toContain("Conteúdo provisório");
    about.current = { provisional: false };
    expect(await render()).not.toContain("Conteúdo provisório");
  });
});
