/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : http.test.ts
 Descrição    : Testes do envelope de erro e do wrapper de Route Handlers.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterEach, describe, expect, it, vi } from "vitest";
import { caseQuerySchema } from "@/lib/domain/api/contracts";
import { AppError } from "./errors";
import { apiRoute, parseQuery } from "./http";

describe("apiRoute", () => {
  afterEach(() => vi.restoreAllMocks());

  it("propaga o x-request-id recebido", async () => {
    const handler = apiRoute(async (_req, _ctx, requestId) => Response.json({ data: requestId }));
    const response = await handler(new Request("http://x/api", { headers: { "x-request-id": "abc" } }), {});
    expect(await response.json()).toEqual({ data: "abc" });
  });

  it("converte AppError no envelope padronizado com status HTTP", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const handler = apiRoute(async () => {
      throw new AppError("NOT_FOUND", { message: "Case não encontrado." });
    });
    const response = await handler(new Request("http://x/api", { headers: { "x-request-id": "r1" } }), {});
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "NOT_FOUND", message: "Case não encontrado.", requestId: "r1" } });
  });

  it("esconde erro inesperado como INTERNAL_ERROR 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const handler = apiRoute(async () => {
      throw new Error("boom");
    });
    const response = await handler(new Request("http://x/api"), {});
    expect(response.status).toBe(500);
    expect((await response.json()).error.code).toBe("INTERNAL_ERROR");
  });
});

describe("parseQuery", () => {
  it("lança BAD_REQUEST com campos inválidos", () => {
    expect(() => parseQuery(new Request("http://x/api?pageSize=999"), caseQuerySchema)).toThrowError(AppError);
  });
});
