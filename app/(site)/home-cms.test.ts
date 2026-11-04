/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : home-cms.test.ts
 Descrição    : Home com o que o painel publica: sem CTA, sem destaque e acima do limite de destaques.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (HOME-07).
──────────────────────────────────────────────────────────────────────────────
*/

import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedSnapshot, siteSettings } from "@/content";
import type { Service } from "@/lib/domain/content/types";

type Link = { id: string; label: string; link: { href: string; external: boolean } };

const data = vi.hoisted(() => ({
  hero: [] as Link[],
  highlight: [] as Link[],
  featured: [] as Service[],
  services: [] as Service[],
}));

vi.mock("next/cache", () => ({ cacheTag: () => {}, cacheLife: () => {} }));
vi.mock("@/lib/server/content/repository", () => ({
  getSiteSettings: async () => siteSettings,
  getPage: async () => null,
  listAreas: async () => [],
  listServices: async (options: { featuredOnly?: boolean } = {}) =>
    options.featuredOnly ? data.featured : data.services,
  listCtas: async (placement: string) => (placement === "home-hero" ? data.hero : data.highlight),
  listFeaturedCases: async () => [],
}));

const render = async () => {
  const { default: HomePage } = await import("./page");
  return renderToStaticMarkup((await HomePage()) as ReactElement);
};

const link = (label: string, href: string, external = false): Link => ({
  id: label,
  label,
  link: { href, external },
});

const CLOSING_TITLE = "Tem um projeto em mente?";
const HERO_BUTTONS = 'data-motion="intro-cta"';
const service = (slug: string): Service => ({ ...seedSnapshot.services[0], id: slug, slug, name: `Serviço ${slug}` });

describe("Home com o que o painel publica (HOME-07)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    data.hero = [];
    data.highlight = [];
    data.featured = [];
    data.services = [];
  });

  it("sem CTA publicado, não sobra caixa de botões no topo nem convite sem botão no fim", async () => {
    const markup = await render();
    expect(markup).toContain(siteSettings.manifesto.title);
    expect(markup).not.toContain(HERO_BUTTONS);
    expect(markup).not.toContain(CLOSING_TITLE);
    expect(markup).not.toContain('id="cta-final-titulo"');
  });

  it("com CTA publicado, os dois blocos voltam, com o destino resolvido", async () => {
    data.hero = [link("Botão do topo", "/servicos/audiovisual")];
    data.highlight = [link("Botão final", "https://exemplo.com", true)];
    const markup = await render();
    expect(markup).toContain(HERO_BUTTONS);
    expect(markup).toContain('href="/servicos/audiovisual"');
    expect(markup).toContain(CLOSING_TITLE);
    expect(markup).toContain('href="https://exemplo.com"');
  });

  it("só um dos blocos com CTA: o outro continua de fora", async () => {
    data.hero = [link("Botão do topo", "/sobre")];
    const markup = await render();
    expect(markup).toContain(HERO_BUTTONS);
    expect(markup).not.toContain(CLOSING_TITLE);
  });

  it("sem serviço em destaque, a seção avisa em vez de ficar em branco", async () => {
    expect(await render()).toContain("Os serviços em destaque estão sendo atualizados");
  });

  it("acima do limite, mostra só os 6 primeiros que recebeu", async () => {
    data.featured = ["um", "dois", "tres", "quatro", "cinco", "seis", "sete"].map(service);
    const markup = await render();
    expect(markup).toContain('href="/servicos/seis"');
    expect(markup).not.toContain('href="/servicos/sete"');
  });

  it("o resumo acompanha a quantidade publicada", async () => {
    data.services = [service("um")];
    const markup = await render();
    expect(markup).toContain("1 serviço — Serviço um.");
    expect(markup).not.toContain("e mais");
  });
});
