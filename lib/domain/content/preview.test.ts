/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : preview.test.ts
 Descrição    : Testes dos tipos de item com prévia no painel.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-14).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { isPreviewType, previewPath, previewResource } from "./preview";

describe("prévia", () => {
  it("aceita só os tipos com página própria", () => {
    expect(["servico", "case", "pagina"].every(isPreviewType)).toBe(true);
    for (const value of ["area", "categoria", "toString", "constructor", ""]) {
      expect(isPreviewType(value)).toBe(false);
    }
  });

  it("cada tipo responde à permissão do próprio recurso", () => {
    expect(previewResource("servico")).toBe("service");
    expect(previewResource("case")).toBe("case");
    expect(previewResource("pagina")).toBe("page");
  });

  it("o endereço fica dentro do painel", () => {
    expect(previewPath("case", "abc")).toBe("/admin/previa/case/abc");
  });
});
