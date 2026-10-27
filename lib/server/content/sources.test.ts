/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : sources.test.ts
 Descrição    : Testes da escolha da fonte de conteúdo público.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { resolveContentSource } from "./sources";

describe("resolveContentSource (DB-03)", () => {
  it("sem configuração usa o conteúdo versionado", () => {
    expect(resolveContentSource(undefined, false)).toBe("local");
    expect(resolveContentSource(undefined, true)).toBe("local");
  });

  it("respeita a escolha explícita", () => {
    expect(resolveContentSource("supabase", true)).toBe("supabase");
    expect(resolveContentSource("local", true)).toBe("local");
  });

  it("pedir Supabase sem o projeto configurado é erro, não fallback silencioso", () => {
    expect(() => resolveContentSource("supabase", false)).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
