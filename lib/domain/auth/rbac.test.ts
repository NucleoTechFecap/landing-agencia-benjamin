/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : rbac.test.ts
 Descrição    : Testes positivos e negativos da matriz RBAC e da atribuição de papéis.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { ACTIONS, RESOURCES, ROLES, can, canAccessPanel, canAssignRole, listGrants, type Role } from "./rbac";

describe("RBAC — negar por padrão", () => {
  it("pending não tem nenhuma permissão", () => {
    for (const resource of RESOURCES) {
      for (const action of ACTIONS) expect(can("pending", resource, action)).toBe(false);
    }
  });

  it("papel ausente, nulo ou forjado é negado", () => {
    expect(can(null, "service", "view")).toBe(false);
    expect(can(undefined, "service", "view")).toBe(false);
    expect(can("owner" as Role, "service", "view")).toBe(false);
    expect(canAccessPanel(null)).toBe(false);
  });

  it("ação não listada é negada mesmo para super_admin", () => {
    expect(can("super_admin", "service", "export")).toBe(false);
  });
});

describe("RBAC — casos positivos", () => {
  it("todos os papéis ativos entram no painel", () => {
    for (const role of ["super_admin", "admin", "editor", "viewer"] as const) expect(canAccessPanel(role)).toBe(true);
  });

  it("editor cria, edita, publica e arquiva conteúdo", () => {
    for (const action of ["create", "edit", "publish", "archive"] as const) {
      expect(can("editor", "case", action)).toBe(true);
      expect(can("editor", "service", action)).toBe(true);
    }
  });

  it("admin lê e exporta leads e lê feedbacks", () => {
    expect(can("admin", "lead", "view")).toBe(true);
    expect(can("admin", "lead", "export")).toBe(true);
    expect(can("admin", "feedback", "view")).toBe(true);
  });
});

describe("RBAC — casos negativos (entregues aos executores)", () => {
  const negatives: Array<[Role, (typeof RESOURCES)[number], (typeof ACTIONS)[number]]> = [
    ["editor", "service", "delete"],
    ["editor", "case", "delete"],
    ["editor", "media", "delete"],
    ["editor", "lead", "view"],
    ["editor", "feedback", "view"],
    ["editor", "settings", "edit"],
    ["editor", "user", "view"],
    ["editor", "audit", "view"],
    ["viewer", "case", "edit"],
    ["viewer", "case", "publish"],
    ["viewer", "media", "create"],
    ["viewer", "lead", "view"],
    ["super_admin", "lead", "view"],
    ["super_admin", "feedback", "view"],
    ["admin", "user", "manage"],
  ];

  it.each(negatives)("%s não pode %s:%s", (role, resource, action) => {
    expect(can(role, resource, action)).toBe(false);
  });
});

describe("canAssignRole", () => {
  const superAdmin = { id: "u1", role: "super_admin" as const };
  const admin = { id: "u2", role: "admin" as const };
  const editor = { id: "u3", role: "editor" as const };

  it("super_admin atribui qualquer papel a outra pessoa", () => {
    expect(canAssignRole(superAdmin, { id: "x", currentRole: "pending" }, "admin")).toBe(true);
  });

  it("ninguém altera o próprio papel", () => {
    expect(canAssignRole(superAdmin, { id: "u1", currentRole: "super_admin" }, "admin")).toBe(false);
    expect(canAssignRole(admin, { id: "u2", currentRole: "admin" }, "super_admin")).toBe(false);
  });

  it("admin só gerencia editor, viewer e pending", () => {
    expect(canAssignRole(admin, { id: "x", currentRole: "pending" }, "editor")).toBe(true);
    expect(canAssignRole(admin, { id: "x", currentRole: "editor" }, "admin")).toBe(false);
    expect(canAssignRole(admin, { id: "x", currentRole: "admin" }, "viewer")).toBe(false);
  });

  it("editor não atribui papéis", () => {
    expect(canAssignRole(editor, { id: "x", currentRole: "pending" }, "viewer")).toBe(false);
  });
});

describe("listGrants", () => {
  it("gera lista plana sem duplicatas e sem permissões para pending", () => {
    const grants = listGrants();
    const keys = grants.map((grant) => `${grant.role}:${grant.resource}:${grant.action}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(grants.some((grant) => grant.role === "pending")).toBe(false);
    expect(ROLES).toHaveLength(5);
  });
});
