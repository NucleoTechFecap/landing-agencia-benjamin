/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : cms-form.test.ts
 Descrição    : Testes dos códigos de aviso reconhecidos pelo CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinícius Nishimura Reis  Códigos de aviso permitidos (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { CMS_WARNING, isCmsWarning } from "./cms-form";

describe("avisos do CMS", () => {
  it("reconhece somente códigos conhecidos", () => {
    expect(isCmsWarning("vinculos")).toBe(true);
    expect(isCmsWarning("ctas")).toBe(true);
    expect(isCmsWarning("texto montado por terceiros")).toBe(false);
    expect(isCmsWarning("<script>alert(1)</script>")).toBe(false);
    expect(isCmsWarning(undefined)).toBe(false);
  });

  it("mapeia códigos para mensagens fixas", () => {
    expect(CMS_WARNING.vinculos).toContain("cases");
    expect(CMS_WARNING.ctas).toContain("fallback");
  });
});
