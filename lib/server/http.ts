/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : http.ts
 Descrição    : Utilitários HTTP da API: respostas padronizadas, validação de query e requestId.

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

import "server-only";
import type { z } from "zod";
import { searchParamsToObject, zodFieldErrors, type ApiErrorBody, type ApiSuccess } from "@/lib/domain/api/contracts";
import { AppError, newRequestId, toPublicError } from "./errors";

/** Cache de CDN para leituras públicas: 5 min frescas + 1 h servindo stale enquanto revalida. */
export const PUBLIC_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=3600";

function requestIdFrom(request: Request): string {
  return request.headers.get("x-request-id") ?? request.headers.get("x-vercel-id") ?? newRequestId();
}

export function jsonOk<T>(body: ApiSuccess<T>, init: { requestId: string; cacheControl?: string; status?: number }) {
  return Response.json(body, {
    status: init.status ?? 200,
    headers: {
      "X-Request-Id": init.requestId,
      "Cache-Control": init.cacheControl ?? "no-store",
    },
  });
}

export function jsonError(error: unknown, requestId: string) {
  const publicError = toPublicError(error, requestId, "api.unexpected_error");
  const status = error instanceof AppError ? error.status : 500;
  const body: ApiErrorBody = { error: publicError };
  return Response.json(body, { status, headers: { "X-Request-Id": requestId, "Cache-Control": "no-store" } });
}

/** Valida a query string com Zod; parâmetros desconhecidos são ignorados. */
export function parseQuery<S extends z.ZodType>(request: Request, schema: S): z.infer<S> {
  const result = schema.safeParse(searchParamsToObject(new URL(request.url).searchParams));
  if (!result.success) {
    throw new AppError("BAD_REQUEST", {
      message: "Parâmetros de consulta inválidos.",
      fieldErrors: zodFieldErrors(result.error),
    });
  }
  return result.data;
}

/**
 * Envolve um Route Handler da API pública: gera/propaga requestId e converte qualquer
 * exceção no envelope de erro padronizado (TECH-02 / ADR-0004).
 */
export function apiRoute<C>(handler: (request: Request, context: C, requestId: string) => Promise<Response>) {
  return async (request: Request, context: C): Promise<Response> => {
    const requestId = requestIdFrom(request);
    try {
      return await handler(request, context, requestId);
    } catch (error) {
      return jsonError(error, requestId);
    }
  };
}
