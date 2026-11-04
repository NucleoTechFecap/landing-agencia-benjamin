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
──────────────────────────────────────────────────────────────────────────────
*/

import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { can, type Role } from "@/lib/domain/auth/rbac";
import { ADMIN_HOME_PATH, ADMIN_MODULES, isActiveModule, modulesFor } from "./admin-modules";

const names = (role: Role | null | undefined) => modulesFor(role).map((module) => module.name);

describe("módulos do painel (ADM-04)", () => {
  it("cada papel vê exatamente o que a matriz de permissões libera", () => {
    for (const role of ["super_admin", "admin", "editor", "viewer", "pending"] as const) {
      expect(modulesFor(role)).toEqual(ADMIN_MODULES.filter((module) => can(role, module.resource, module.action)));
    }
  });

  it("leads e auditoria não aparecem para quem não tem permissão neles", () => {
    expect(names("admin")).toEqual(expect.arrayContaining(["Leads e feedbacks", "Trilha de auditoria"]));
    for (const role of ["editor", "viewer"] as const) {
      expect(names(role)).toContain("Cases");
      expect(names(role)).not.toContain("Leads e feedbacks");
      expect(names(role)).not.toContain("Usuários e papéis");
      expect(names(role)).not.toContain("Trilha de auditoria");
    }
    // O NúcleoTech não lê leads por padrão (TECH-08).
    expect(names("super_admin")).not.toContain("Leads e feedbacks");
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
});
