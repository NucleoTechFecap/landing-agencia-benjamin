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
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { navigationFor } from "@/lib/config/admin-modules";
import { PanelMenu } from "./panel-menu";
import { PanelShell } from "./panel-shell";

const pathname = vi.hoisted(() => ({ current: "/admin" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.current }));

const render = (role: Parameters<typeof navigationFor>[0] = "admin", collapsed = false) =>
  renderToStaticMarkup(createElement(PanelMenu, { navigation: navigationFor(role), collapsed }));

const shellProps = (initialCollapsed: boolean): Omit<ComponentProps<typeof PanelShell>, "children"> => ({
  navigation: navigationFor("admin"),
  user: { name: "Pessoa de Teste", roleLabel: "Administrador (Benjamin)" },
  signOut: async () => {},
  initialCollapsed,
});

const renderShell = (initialCollapsed = false) =>
  renderToStaticMarkup(
    createElement(PanelShell, { ...shellProps(initialCollapsed), children: "conteúdo" } as ComponentProps<
      typeof PanelShell
    >),
  );

const currentLinks = (markup: string) => markup.match(/<a[^>]*aria-current="page"[^>]*>.*?<\/a>/g) ?? [];

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

  it("mostra os grupos e só o que veio filtrado pelo papel", () => {
    expect(render("admin")).toContain("Conteúdo do site");
    expect(render("admin")).toContain("Contatos e feedbacks");
    expect(render("viewer")).not.toContain("Contatos e feedbacks");
    expect(render("viewer")).toContain("Cases");
  });

  it("não mostra módulo sem tela", () => {
    expect(render("admin")).not.toContain("Em construção");
    expect(render("admin")).not.toContain("Usuários e papéis");
  });

  it("todo item tem área de toque de ao menos 44 px", () => {
    for (const element of render().match(/<a [^>]*>/g) ?? []) expect(element).toContain("min-h-11");
  });

  it("recolhido, o nome continua no link para leitores de tela", () => {
    const markup = render("admin", true);
    expect(markup).toMatch(/<a [^>]*href="\/admin\/cases"[^>]*>.*?<span class="[^"]*lg:sr-only[^"]*">Cases<\/span>/);
  });
});

describe("casca do painel", () => {
  beforeEach(() => {
    pathname.current = "/admin/cases";
  });

  it("no celular a gaveta começa fechada e o botão diz o estado", () => {
    const markup = renderShell();
    expect(markup).toMatch(/<button[^>]*aria-expanded="false"[^>]*aria-label="Abrir menu"/);
    expect(markup).toMatch(/<aside[^>]*class="[^"]*invisible -translate-x-full/);
    expect(markup).not.toContain(" inert");
  });

  it("o menu recolhido vem do que o servidor leu no cookie, sem piscar ao carregar", () => {
    expect(renderShell(true)).toContain("lg:w-studio-menu-recolhido");
    expect(renderShell(true)).toContain("Expandir menu");
    expect(renderShell(false)).toContain("Recolher menu");
  });

  it("identifica a pessoa, oferece a saída e abre o site em outra aba", () => {
    const markup = renderShell();
    expect(markup).toContain("Pessoa de Teste");
    expect(markup).toContain("Administrador (Benjamin)");
    expect(markup).toContain("Sair");
    expect(markup).toMatch(/<a [^>]*target="_blank"[^>]*>.*?Ver site.*?\(abre em nova aba\)/);
  });

  it("traz a trilha da tela atual e o atalho para o conteúdo", () => {
    const markup = renderShell();
    expect(markup).toContain('aria-label="Trilha"');
    expect(markup).toContain("Pular para o conteúdo");
    expect(markup).toContain('id="conteudo"');
  });
});
