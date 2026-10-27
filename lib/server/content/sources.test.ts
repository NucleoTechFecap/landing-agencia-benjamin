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
 26/10/2026 Vinícius Nishimura Reis  Testes de áreas, serviços e mídia (DB-04).
 26/10/2026 Vinícius Nishimura Reis  CMS como fonte padrão com Supabase; provisório recusado em hml/prd (INT-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { localSource, resolveContentSource } from "./sources";

describe("resolveContentSource (DB-03)", () => {
  it("sem escolha explícita: CMS quando o Supabase está configurado, senão o versionado (INT-02)", () => {
    expect(resolveContentSource(undefined, false)).toBe("local");
    expect(resolveContentSource(undefined, true)).toBe("supabase");
  });

  it("homologação e produção nunca usam o conteúdo provisório (INT-02)", () => {
    expect(resolveContentSource(undefined, true, "production")).toBe("supabase");
    expect(() => resolveContentSource(undefined, false, "production")).toThrow(/vem do CMS/);
    expect(() => resolveContentSource("local", true, "homologation")).toThrow(/vem do CMS/);
    expect(resolveContentSource("local", true, "preview")).toBe("local");
  });

  it("respeita a escolha explícita", () => {
    expect(resolveContentSource("supabase", true)).toBe("supabase");
    expect(resolveContentSource("local", true)).toBe("local");
  });

  it("pedir Supabase sem o projeto configurado é erro, não fallback silencioso", () => {
    expect(() => resolveContentSource("supabase", false)).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});

describe("localSource.slugExists (DB-04)", () => {
  it("reconhece serviço e case publicados no conteúdo versionado", async () => {
    expect(await localSource.slugExists("servicos", "audiovisual")).toBe(true);
    expect(await localSource.slugExists("cases", "audiovisual")).toBe(false);
  });
});
