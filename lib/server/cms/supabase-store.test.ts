/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : supabase-store.test.ts
 Descrição    : Testes da tradução dos erros do banco para os códigos do painel.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (DBX-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { toCmsError } from "./supabase-store";

const context = { table: "services", operation: "save" };

describe("toCmsError: versão desatualizada (DBX-04)", () => {
  it.each(["BJ002", "40001"])("%s vira CONFLICT", (code) => {
    expect(toCmsError({ message: "conflito", code }, context).code).toBe("CONFLICT");
  });

  it("código desconhecido continua SERVICE_UNAVAILABLE", () => {
    expect(toCmsError({ message: "falha", code: "XX000" }, context).code).toBe("SERVICE_UNAVAILABLE");
  });
});
