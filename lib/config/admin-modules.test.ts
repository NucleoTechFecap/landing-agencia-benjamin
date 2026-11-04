/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : admin-modules.test.ts
 Descrição    : Testes do registro de módulos do painel: filtro por papel, rotas existentes e item ativo.

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
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { can, type Role } from "@/lib/domain/auth/rbac";
import {
  ADMIN_GROUPS,
  ADMIN_HOME_PATH,
  ADMIN_MODULES,
  breadcrumbsFor,
  isActiveModule,
  modulesFor,
  navigationFor,
} from "./admin-modules";

const names = (role: Role | null | undefined) => modulesFor(role).map((module) => module.name);

describe("módulos do painel (ADM-04)", () => {
  it("cada papel vê exatamente o que a matriz de permissões libera", () => {
    for (const role of ["super_admin", "admin", "editor", "viewer", "pending"] as const) {
      expect(modulesFor(role)).toEqual(ADMIN_MODULES.filter((module) => can(role, module.resource, module.action)));
    }
  });

  it("leads e auditoria não aparecem para quem não tem permissão neles", () => {
    expect(names("admin")).toEqual(expect.arrayContaining(["Contatos e feedbacks", "Trilha de auditoria"]));
    for (const role of ["editor", "viewer"] as const) {
      expect(names(role)).toContain("Cases");
      expect(names(role)).not.toContain("Contatos e feedbacks");
      expect(names(role)).not.toContain("Usuários e papéis");
      expect(names(role)).not.toContain("Trilha de auditoria");
    }
    // O NúcleoTech não lê leads por padrão (TECH-08).
    expect(names("super_admin")).not.toContain("Contatos e feedbacks");
  });

  it("conta pendente, papel ausente ou desconhecido não recebe nenhum módulo", () => {
    expect(modulesFor("pending")).toEqual([]);
    expect(modulesFor(null)).toEqual([]);
    expect(modulesFor(undefined)).toEqual([]);
    expect(modulesFor("root" as Role)).toEqual([]);
  });

  it("todo módulo com link aponta para uma tela que existe e os sem link dizem quem os entrega", () => {
    for (const entry of ADMIN_MODULES) {
      if (entry.href) {
        const route = entry.href.replace(/^\/admin/, "app/admin/(painel)");
        expect(existsSync(`${route}/page.tsx`), `${entry.name}: ${route}/page.tsx`).toBe(true);
      } else {
        expect(entry.issue, `${entry.name} em construção sem issue`).toBeTruthy();
      }
    }
  });

  it("nomes e links não se repetem", () => {
    const hrefs = ADMIN_MODULES.flatMap((module) => module.href ?? []);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(new Set(ADMIN_MODULES.map((module) => module.name)).size).toBe(ADMIN_MODULES.length);
  });
});

describe("item ativo do menu (ADM-04)", () => {
  it.each([
    ["/admin", ADMIN_HOME_PATH, true],
    ["/admin/cases", ADMIN_HOME_PATH, false],
    ["/admin/cases", "/admin/cases", true],
    ["/admin/cases/novo", "/admin/cases", true],
    ["/admin/paginas/1/blocos/2", "/admin/paginas", true],
    ["/admin/categorias", "/admin/cases", false],
    ["/admin/casesx", "/admin/cases", false],
  ])("em %s, %s ativo: %s", (pathname, href, active) => {
    expect(isActiveModule(pathname, href)).toBe(active);
  });

  it("o menu tem grupos na ordem do registro, só com o que tem tela e sem grupo vazio", () => {
    const groups = navigationFor("admin");
    expect(groups.map((group) => group.id)).toEqual(ADMIN_GROUPS.map((group) => group.id));
    expect(groups[0]!.modules[0]!.name).toBe("Início");
    const shown = groups.flatMap((group) => group.modules);
    expect(shown.every((entry) => entry.href)).toBe(true);
    expect(shown.map((entry) => entry.name)).not.toContain("Usuários e papéis");
    expect(shown.map((entry) => entry.name)).not.toContain("Trilha de auditoria");

    const editor = navigationFor("editor");
    expect(editor.flatMap((group) => group.modules).map((entry) => entry.name)).not.toContain("Contatos e feedbacks");
    expect(editor.map((group) => group.id)).not.toContain("comunicacao");
  });

  it("conta sem acesso não recebe menu nenhum", () => {
    for (const role of ["pending", null, undefined, "root" as Role] as const) expect(navigationFor(role)).toEqual([]);
  });

  describe("trilha", () => {
    const labels = (path: string) => breadcrumbsFor(path).map((crumb) => crumb.label);

    it("no início, só o painel, como página atual", () => {
      expect(breadcrumbsFor("/admin")).toEqual([{ label: "Painel" }]);
    });

    it("na lista, o último passo é a tela atual, sem link", () => {
      expect(breadcrumbsFor("/admin/cases")).toEqual([{ label: "Painel", href: "/admin" }, { label: "Cases" }]);
    });

    it("item novo e item aberto voltam para a lista, com o id fora do texto", () => {
      expect(labels("/admin/cases/novo")).toEqual(["Painel", "Cases", "Novo case"]);
      expect(labels("/admin/areas/nova")).toEqual(["Painel", "Áreas de atuação", "Nova área"]);
      const open = breadcrumbsFor("/admin/servicos/11111111-1111-4111-8111-111111111111");
      expect(open[1]).toEqual({ label: "Serviços", href: "/admin/servicos" });
      expect(open[2]).toEqual({ label: "Editar serviço" });
    });

    it("bloco de página volta para a página que o contém", () => {
      const id = "22222222-2222-4222-8222-222222222222";
      expect(breadcrumbsFor(`/admin/paginas/${id}/blocos/novo`)[2]).toEqual({
        label: "Editar página",
        href: `/admin/paginas/${id}`,
      });
      expect(labels(`/admin/paginas/${id}/blocos/novo`).at(-1)).toBe("Novo bloco");
      expect(labels(`/admin/paginas/${id}/blocos/33333333`).at(-1)).toBe("Editar bloco");
    });

    it("o envio aberto não leva dado nenhum para a trilha", () => {
      expect(labels("/admin/leads/44444444-4444-4444-8444-444444444444")).toEqual([
        "Painel",
        "Contatos e feedbacks",
        "Envio recebido",
      ]);
    });

    it("endereço com barra no fim e tela sem módulo não quebram", () => {
      expect(labels("/admin/cases/")).toEqual(["Painel", "Cases"]);
      expect(labels("/admin/desconhecida")).toEqual(["Painel", "Página do painel"]);
    });
  });
});
