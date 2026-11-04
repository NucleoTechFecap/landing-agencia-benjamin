/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : primitives.test.ts
 Descrição    : Testes das iniciais do avatar.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (reestruturação do painel).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { initialsOf } from "./primitives";

describe("iniciais do avatar", () => {
  it("usa a primeira letra do primeiro e do último nome", () => {
    expect(initialsOf("Beatriz Andrade")).toBe("BA");
    expect(initialsOf("  maria  de   souza ")).toBe("MS");
  });

  it("nome único ou com acento continua legível", () => {
    expect(initialsOf("vinicius.nishimura")).toBe("V");
    expect(initialsOf("Ângela Índio")).toBe("ÂÍ");
  });

  it("nome vazio não quebra", () => {
    expect(initialsOf("   ")).toBe("?");
  });
});
