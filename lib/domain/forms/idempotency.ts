/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : idempotency.ts
 Descrição    : Regras de idempotência, antispam, limite de envios e backoff de notificações.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-07).
──────────────────────────────────────────────────────────────────────────────
*/

import type { SubmissionInput } from "./schemas";

/** Janela em que o mesmo conteúdo reenviado é tratado como duplicado (TECH-07). */
export const DEDUPE_WINDOW_MS = 10 * 60 * 1000;
/** Tempo mínimo de preenchimento; abaixo disso o envio é tratado como automatizado. */
export const MIN_FILL_TIME_MS = 3_000;
/** Limite de envios por origem (IP com HMAC) dentro da janela. */
export const RATE_LIMIT = { max: 5, windowMs: 10 * 60 * 1000 } as const;
/** Reenvio de notificação: tentativas e espera crescente entre elas. */
export const NOTIFICATION_RETRY = { maxAttempts: 5, baseDelayMs: 60_000 } as const;

const collapse = (value: string | undefined) => (value ?? "").toLocaleLowerCase("pt-BR").replace(/\s+/g, " ").trim();

/**
 * Texto canônico usado na impressão digital do envio: mesmo tipo + mesmo remetente +
 * mesma mensagem = mesmo conteúdo, ainda que o `submissionId` seja outro (ex.: a
 * pessoa recarregou a página e enviou de novo).
 */
export function canonicalContent(input: SubmissionInput): string {
  switch (input.kind) {
    case "lead":
      return ["lead", collapse(input.data.email), collapse(input.data.projectDescription)].join("|");
    case "contact":
      return ["contact", collapse(input.data.email), input.data.subject, collapse(input.data.message)].join("|");
    case "feedback":
      return ["feedback", collapse(input.data.email), input.data.profile, collapse(input.data.message)].join("|");
  }
}

/** Indício de robô: honeypot preenchido ou formulário enviado rápido demais. */
export function isSuspectedBot(technical: { website?: string; startedAt?: number }, now: Date): boolean {
  if (technical.website) return true;
  if (technical.startedAt === undefined) return false;
  const elapsed = now.getTime() - technical.startedAt;
  return elapsed >= 0 && elapsed < MIN_FILL_TIME_MS;
}

/** Espera antes da próxima tentativa de notificação (1, 2, 4, 8… minutos). */
export function nextRetryDelayMs(attempts: number): number {
  return NOTIFICATION_RETRY.baseDelayMs * 2 ** Math.max(0, attempts - 1);
}

export function shouldRetryNotification(record: { notificationAttempts: number; updatedAt: string }, now: Date): boolean {
  if (record.notificationAttempts >= NOTIFICATION_RETRY.maxAttempts) return false;
  return now.getTime() - Date.parse(record.updatedAt) >= nextRetryDelayMs(record.notificationAttempts);
}
