/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : redirect.test.ts
 Descrição    : Testes contra open redirect e da política de senha.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
 13/10/2026 Vinícius Nishimura Reis  Testes de rotas públicas do painel (ADM-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { isPublicAdminPath, passwordProblems, safeAdminRedirect } from "./redirect";

describe("safeAdminRedirect", () => {
  it("aceita caminhos internos do painel", () => {
    expect(safeAdminRedirect("/admin/cases?status=draft")).toBe("/admin/cases?status=draft");
  });

  it.each([
    ["https://evil.com/admin"],
    ["//evil.com"],
    ["/\\evil.com"],
    ["/servicos"],
    ["/admin/login"],
    ["/admin/../servicos"],
    [null],
    [123],
  ])("bloqueia destino inseguro %s", (value) => {
    expect(safeAdminRedirect(value)).toBe("/admin");
  });
});

describe("passwordProblems", () => {
  it("exige 12+ caracteres com letras e números", () => {
    expect(passwordProblems("curta1")).toContain("Use pelo menos 12 caracteres.");
    expect(passwordProblems("somenteletrasaqui")).toContain("Combine letras e números.");
    expect(passwordProblems("benjamin2026senha")).toEqual([]);
  });
});

describe("isPublicAdminPath", () => {
  it("libera somente login, recuperação e callback", () => {
    expect(isPublicAdminPath("/admin/login")).toBe(true);
    expect(isPublicAdminPath("/admin/auth/callback")).toBe(true);
    expect(isPublicAdminPath("/admin")).toBe(false);
    expect(isPublicAdminPath("/admin/nova-senha")).toBe(false);
    expect(isPublicAdminPath("/admin/login-falso")).toBe(false);
  });
});
