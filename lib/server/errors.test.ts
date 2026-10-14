/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : errors.test.ts
 Descrição    : Testes do mapeamento de erros e do envelope público.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ARC-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterEach, describe, expect, it, vi } from "vitest";
import { AppError, ERROR_CODES, toPublicError } from "./errors";

describe("AppError e toPublicError", () => {
  afterEach(() => vi.restoreAllMocks());

  it("mapeia código para status HTTP e mensagem segura", () => {
    const error = new AppError("FORBIDDEN");
    expect(error.status).toBe(403);
    expect(error.message).toBe(ERROR_CODES.FORBIDDEN.message);
  });

  it("preserva erros esperados e seus campos inválidos", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = new AppError("VALIDATION_FAILED", { fieldErrors: { email: ["E-mail inválido."] } });
    expect(toPublicError(error, "req-1")).toEqual({
      code: "VALIDATION_FAILED",
      message: ERROR_CODES.VALIDATION_FAILED.message,
      requestId: "req-1",
      fieldErrors: { email: ["E-mail inválido."] },
    });
  });

  it("esconde detalhes de erros inesperados e registra no log", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = toPublicError(new Error("relation \"leads\" does not exist"), "req-2");
    expect(result).toEqual({ code: "INTERNAL_ERROR", message: ERROR_CODES.INTERNAL_ERROR.message, requestId: "req-2" });
    expect(spy.mock.calls[0][0]).toContain("does not exist");
  });
});
