/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : services-summary.test.ts
 Descrição    : Testes da frase que resume os serviços na Home.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (HOME-07).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { servicesSummary } from "./services-summary";

describe("servicesSummary (HOME-07)", () => {
  it("sem serviço publicado, explica em vez de mostrar zero", () => {
    expect(servicesSummary([])).toBe("Nossos serviços estão sendo atualizados.");
  });

  it("um serviço fica no singular e sem 'e mais'", () => {
    expect(servicesSummary(["Audiovisual"])).toBe("1 serviço — Audiovisual.");
  });

  it("até quatro, lista todos sem prometer mais nada", () => {
    expect(servicesSummary(["A", "B"])).toBe("2 serviços — A e B.");
    expect(servicesSummary(["A", "B", "C", "D"])).toBe("4 serviços — A, B, C e D.");
  });

  it("acima de quatro, mostra os quatro primeiros e avisa que há mais", () => {
    expect(servicesSummary(["A", "B", "C", "D", "E"])).toBe("5 serviços — A, B, C, D e mais.");
  });
});
