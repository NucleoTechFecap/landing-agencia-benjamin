/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : seed-users.test.mjs
 Descrição    : Garante que as contas de teste são fictícias, sem senha fixa, e só valem no Supabase local.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinicius Binda             Criação inicial (ARC-11).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { generatePassword, isLocalApiUrl, TEST_ACCOUNTS } from "./seed-users.mjs";

describe("contas de teste locais (ARC-11)", () => {
  it("só aceita o Supabase local", () => {
    expect(isLocalApiUrl("http://127.0.0.1:54321")).toBe(true);
    expect(isLocalApiUrl("http://localhost:54321/")).toBe(true);
    expect(isLocalApiUrl("https://rjgzixhhvmsimhpcdvyw.supabase.co")).toBe(false);
    expect(isLocalApiUrl("http://127.0.0.1.exemplo.com:54321")).toBe(false);
    expect(isLocalApiUrl("http://localhost:54321.exemplo.com")).toBe(false);
    expect(isLocalApiUrl(undefined)).toBe(false);
  });

  it("uma conta fictícia por papel, em domínio que não recebe e-mail", () => {
    expect(TEST_ACCOUNTS.map((account) => account.role)).toEqual(["admin", "editor", "viewer", "pending"]);
    expect(TEST_ACCOUNTS.every((account) => account.email.endsWith("@teste.local"))).toBe(true);
  });

  it("não guarda senha: gera uma diferente a cada vez, acima do mínimo de produção", () => {
    expect(TEST_ACCOUNTS.some((account) => "password" in account)).toBe(false);
    const [first, second] = [generatePassword(), generatePassword()];
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(12);
  });
});
