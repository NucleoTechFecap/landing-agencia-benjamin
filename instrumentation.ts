/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Config
 Arquivo      : instrumentation.ts
 Descrição    : Registra erros de servidor capturados pelo Next.js em log estruturado sem PII.

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

import type { Instrumentation } from "next";

/**
 * Registra erros de servidor capturados pelo Next.js (renderização, Route Handlers,
 * Server Actions e proxy) em formato estruturado e sem PII (ARC-09). Cabeçalhos e
 * query strings nunca são registrados: podem conter cookies de sessão ou dados pessoais.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const { logger, safePath } = await import("./lib/server/logger");
  logger.error("next.request_error", {
    error,
    method: request.method,
    path: safePath(request.path),
    routePath: context.routePath,
    routeType: context.routeType,
    renderSource: context.renderSource,
    requestId: firstHeader(request.headers["x-request-id"]) ?? firstHeader(request.headers["x-vercel-id"]),
  });
};

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
