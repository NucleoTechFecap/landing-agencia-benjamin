/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : banco-vazio.test.ts
 Descrição    : Páginas públicas sem conteúdo publicado não quebram.

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

import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { siteSettings } from "@/content";

/*
 * Ambiente recém-criado, sem nada publicado: nenhuma página pública pode quebrar nem mostrar
 * lista em branco (LAY-07). Só as listas vêm vazias; a configuração institucional tem referência.
 */
vi.mock("next/cache", () => ({ cacheTag: () => {}, cacheLife: () => {} }));
vi.mock("@/lib/server/content/repository", () => ({
  getSiteSettings: async () => siteSettings,
  listAreas: async () => [],
  listServices: async () => [],
  listCtas: async () => [],
  listFeaturedCases: async () => [],
  listCases: async () => [],
  listCategories: async () => [],
}));

const render = async (page: () => Promise<ReactElement>) => renderToStaticMarkup(await page());

describe("páginas públicas sem conteúdo publicado (LAY-07)", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));

  it("Home explica cada lista vazia e não mostra contagem zerada", async () => {
    const { default: HomePage } = await import("./page");
    const markup = await render(HomePage);
    expect(markup).toContain("As áreas de atuação estão sendo atualizadas");
    expect(markup).toContain("Os serviços em destaque estão sendo atualizados");
    expect(markup).toContain("Os primeiros cases estão sendo preparados");
    expect(markup).toContain("Nossos serviços estão sendo atualizados.");
    expect(markup).not.toContain("0 serviços");
  });

  it("Serviços oferece o contato como próximo passo", async () => {
    const { default: ServicesPage } = await import("./servicos/page");
    const markup = await render(ServicesPage);
    expect(markup).toContain("Os serviços estão sendo atualizados");
    expect(markup).toContain('href="/contato#formulario"');
    expect(markup).not.toContain("0 serviços");
  });

  it("Áreas não mostra navegação vazia", async () => {
    const { default: AreasPage } = await import("./areas/page");
    const markup = await render(AreasPage);
    expect(markup).toContain("As áreas de atuação estão sendo atualizadas");
    expect(markup).not.toContain("Ir para a área");
  });

  it("Sobre esconde a seção de áreas em vez de deixá-la em branco", async () => {
    const { default: AboutPage } = await import("./sobre/page");
    const markup = await render(AboutPage);
    expect(markup).not.toContain("Seis áreas que trabalham juntas");
    expect(markup).toContain("Como a Benjamin funciona");
  });
});
