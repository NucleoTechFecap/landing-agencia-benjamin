/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : errors.ts
 Descrição    : Erros padronizados (códigos, status HTTP, mensagens seguras) e envelope público.

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

import "server-only";
import { logger } from "./logger";

/** Códigos de erro padronizados da aplicação (ARC-09; contrato HTTP em TECH-02). */
export const ERROR_CODES = {
  BAD_REQUEST: { status: 400, message: "Requisição inválida." },
  UNAUTHENTICATED: { status: 401, message: "Faça login para continuar." },
  FORBIDDEN: { status: 403, message: "Você não tem permissão para esta operação." },
  NOT_FOUND: { status: 404, message: "Conteúdo não encontrado." },
  CONFLICT: { status: 409, message: "O conteúdo foi alterado por outra pessoa. Recarregue e tente novamente." },
  INVALID_TRANSITION: { status: 409, message: "Esta operação não é permitida no estado atual do conteúdo." },
  PAYLOAD_TOO_LARGE: { status: 413, message: "Arquivo ou envio maior que o permitido." },
  UNSUPPORTED_MEDIA_TYPE: { status: 415, message: "Formato de arquivo não aceito." },
  VALIDATION_FAILED: { status: 422, message: "Revise os campos destacados." },
  RATE_LIMITED: { status: 429, message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." },
  INTERNAL_ERROR: { status: 500, message: "Algo deu errado do nosso lado. Tente novamente em instantes." },
  SERVICE_UNAVAILABLE: { status: 503, message: "Serviço temporariamente indisponível. Tente novamente em instantes." },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

/** Detalhe de campo para formulários: { campo: ["mensagem"] }. */
export type FieldErrors = Record<string, string[]>;

/**
 * Erro esperado da aplicação. A `message` é segura para o usuário final; detalhes
 * internos vão em `internal` (somente log, já mascarado).
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fieldErrors?: FieldErrors;
  readonly internal?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    options: { message?: string; fieldErrors?: FieldErrors; internal?: Record<string, unknown>; cause?: unknown } = {},
  ) {
    super(options.message ?? ERROR_CODES[code].message, { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_CODES[code].status;
    this.fieldErrors = options.fieldErrors;
    this.internal = options.internal;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Envelope de erro devolvido ao cliente (API e Server Actions). */
export interface PublicError {
  code: ErrorCode;
  message: string;
  requestId: string;
  fieldErrors?: FieldErrors;
}

/**
 * Converte qualquer erro em resposta segura: erros esperados mantêm código e mensagem;
 * inesperados viram INTERNAL_ERROR genérico e são registrados com stack (sem PII).
 */
export function toPublicError(error: unknown, requestId: string, event = "app.unexpected_error"): PublicError {
  if (isAppError(error)) {
    const level = error.status >= 500 ? "error" : "warn";
    logger[level](`app.error.${error.code.toLowerCase()}`, { requestId, error, internal: error.internal });
    return { code: error.code, message: error.message, requestId, fieldErrors: error.fieldErrors };
  }
  logger.error(event, { requestId, error });
  return { code: "INTERNAL_ERROR", message: ERROR_CODES.INTERNAL_ERROR.message, requestId };
}

/** Identificador para correlacionar log e mensagem exibida ao usuário. */
export function newRequestId(): string {
  return crypto.randomUUID();
}
