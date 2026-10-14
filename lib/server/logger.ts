/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : logger.ts
 Descrição    : Logger estruturado em JSON com mascaramento automático de PII e segredos.

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

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export const REDACTED = "[REDACTED]";

/**
 * Chaves cujo valor nunca vai para o log (PII e credenciais — ARC-09/TECH-08).
 * A comparação ignora maiúsculas, hífens e sublinhados.
 */
const SENSITIVE_KEYS = [
  "email",
  "phone",
  "telefone",
  "name",
  "nome",
  "fullname",
  "username",
  "clientname",
  "contactname",
  "company",
  "empresa",
  "message",
  "mensagem",
  "description",
  "descricao",
  "projectdescription",
  "password",
  "senha",
  "token",
  "accesstoken",
  "refreshtoken",
  "secret",
  "apikey",
  "authorization",
  "cookie",
  "setcookie",
  "cpf",
  "ip",
  "ipaddress",
  "address",
  "endereco",
];

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const PHONE_PATTERN = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}\b/g;
const BEARER_PATTERN = /(bearer\s+)[\w.-]+/gi;
const JWT_PATTERN = /eyJ[\w-]+\.[\w-]+\.[\w-]+/g;

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[-_\s]/g, "");
}

export function isSensitiveKey(key: string): boolean {
  const normalized = normalizeKey(key);
  // Chaves curtas (ip, name, nome) só por igualdade, para não mascarar "relationship" ou "fileName".
  return SENSITIVE_KEYS.some(
    (sensitive) => normalized === sensitive || (sensitive.length >= 5 && normalized.endsWith(sensitive)),
  );
}

/** Mascara e-mails, telefones e tokens que apareçam dentro de textos livres. */
export function scrubString(value: string): string {
  return value
    .replace(JWT_PATTERN, REDACTED)
    .replace(BEARER_PATTERN, `$1${REDACTED}`)
    .replace(EMAIL_PATTERN, "[email]")
    .replace(PHONE_PATTERN, "[telefone]");
}

/** Remove dados sensíveis de qualquer estrutura antes de registrá-la. */
export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[...]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return scrubString(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) return serializeError(value, depth);
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => redact(item, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        isSensitiveKey(key)
          ? REDACTED
          : // Identificadores (requestId, userId…) são opacos: não passam pelo mascaramento de texto.
            typeof item === "string" && /id$/i.test(key)
            ? item
            : redact(item, depth + 1),
      ]),
    );
  }
  return String(value);
}

function serializeError(error: Error, depth: number): Record<string, unknown> {
  const withCode = error as Error & { code?: unknown; digest?: unknown; cause?: unknown };
  return {
    name: error.name,
    message: scrubString(error.message),
    code: withCode.code,
    digest: withCode.digest,
    // Stack só fora de produção: pode conter trechos de dados de entrada.
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack?.split("\n").slice(0, 8).join("\n"),
    cause: withCode.cause ? redact(withCode.cause, depth + 1) : undefined,
  };
}

/** Remove a query string de caminhos (pode carregar e-mail/telefone em links). */
export function safePath(path: string): string {
  return path.split("?")[0];
}

export interface LogEntry {
  level: LogLevel;
  event: string;
  timestamp: string;
  service: "agencia-benjamin";
  environment: string;
  requestId?: string;
  [key: string]: unknown;
}

type LogData = Record<string, unknown> & { requestId?: string };

function currentLevel(): LogLevel {
  const level = process.env.LOG_LEVEL;
  return level === "debug" || level === "info" || level === "warn" || level === "error" ? level : "info";
}

function write(level: LogLevel, event: string, data: LogData = {}) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[currentLevel()]) return;
  const entry: LogEntry = {
    ...(redact(data) as Record<string, unknown>),
    level,
    event,
    timestamp: new Date().toISOString(),
    service: "agencia-benjamin",
    environment: process.env.NEXT_PUBLIC_SITE_ENV ?? "development",
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/**
 * Logger estruturado (JSON por linha) com mascaramento automático de PII.
 * Use eventos estáveis em `dominio.acao` (ex.: "forms.submission.persisted").
 */
export const logger = {
  debug: (event: string, data?: LogData) => write("debug", event, data),
  info: (event: string, data?: LogData) => write("info", event, data),
  warn: (event: string, data?: LogData) => write("warn", event, data),
  error: (event: string, data?: LogData) => write("error", event, data),
  /** Cria um logger com campos fixos (ex.: requestId, módulo). */
  child(bindings: LogData) {
    return {
      debug: (event: string, data?: LogData) => write("debug", event, { ...bindings, ...data }),
      info: (event: string, data?: LogData) => write("info", event, { ...bindings, ...data }),
      warn: (event: string, data?: LogData) => write("warn", event, { ...bindings, ...data }),
      error: (event: string, data?: LogData) => write("error", event, { ...bindings, ...data }),
    };
  },
};
