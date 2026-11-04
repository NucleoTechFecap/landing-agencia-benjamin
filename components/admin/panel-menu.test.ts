/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : panel-menu.test.ts
 Descrição    : Testes do menu do painel: item atual, módulo em construção e estado inicial no celular.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-04).
 04/11/2026 Vinícius Nishimura Reis  Exemplo de módulo em construção não depende de uma tela (FORM-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { modulesFor } from "@/lib/config/admin-modules";
import { PanelMenu } from "./panel-menu";

const pathname = vi.hoisted(() => ({ current: "/admin" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

const render = (role: Parameters<typeof modulesFor>[0] = "admin") =>
  renderToStaticMarkup(createElement(PanelMenu, { modules: modulesFor(role) }));

const currentLinks = (markup: string) => markup.match(/<a[^>]*aria-current="page"[^>]*>[^<]*/g) ?? [];

describe("menu do painel (ADM-04)", () => {
  beforeEach(() => {
    pathname.current = "/admin";
  });

  it("marca com aria-current só o início em /admin", () => {
    const links = currentLinks(render());
    expect(links).toHaveLength(1);
    expect(links[0]).toContain("Início");
  });

  it("mantém o módulo marcado nas telas internas", () => {
    pathname.current = "/admin/cases/novo";
    const links = currentLinks(render());
    expect(links).toHaveLength(1);
    expect(links[0]).toContain("Cases");
  });

  it("módulo em construção aparece com o aviso e sem link", () => {
    // Módulo próprio do teste: cada tela entregue sai do registro, e o exemplo não pode depender dela.
    const markup = renderToStaticMarkup(
      createElement(PanelMenu, {
        modules: [{ name: "Módulo de exemplo", resource: "page", action: "view", issue: "ADM-00" }],
      }),
    );
    expect(markup).toMatch(/<p[^>]*>Módulo de exemplo<span[^>]*>Em construção<\/span><\/p>/);
    expect(markup).not.toMatch(/<a[^>]*>Módulo de exemplo/);
  });

  it("só mostra o que veio filtrado pelo papel", () => {
    expect(render("admin")).toContain("Leads e feedbacks");
    expect(render("viewer")).not.toContain("Leads e feedbacks");
    expect(render("viewer")).toContain("Cases");
  });

  it("no celular começa fechado, com o botão ligado ao menu; nas telas grandes o menu fica sempre aberto", () => {
    const markup = render();
    const navId = markup.match(/<nav id="([^"]+)"/)?.[1];
    expect(markup).toContain(`aria-controls="${navId}"`);
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain("Abrir menu");
    expect(markup).toMatch(/<nav[^>]*aria-label="Módulos do painel"[^>]*class="hidden [^"]*lg:block/);
  });

  it("todo item tem área de toque de ao menos 44 px", () => {
    const markup = render();
    for (const element of markup.match(/<a [^>]*>/g) ?? []) expect(element).toContain("min-h-11");
    expect(markup).toMatch(/<button[^>]*min-h-12/);
  });
});
