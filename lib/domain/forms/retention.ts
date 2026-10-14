/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : retention.ts
 Descrição    : Regras de retenção, plano de descarte e anonimização de dados pessoais dos envios.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-08).
──────────────────────────────────────────────────────────────────────────────
*/

import type { SubmissionKind } from "./schemas";

export type RetentionAction = "keep" | "delete" | "anonymize";

export interface RetentionRule {
  months: number;
  action: Exclude<RetentionAction, "keep">;
}

/**
 * Prazos propostos em SEG-01 §4. Pendentes de aprovação institucional: alterar aqui
 * e no documento de ciclo de vida (TECH-08) no mesmo PR.
 */
export const RETENTION_RULES = {
  lead: { months: 12, action: "delete" },
  contact: { months: 6, action: "delete" },
  feedbackIdentified: { months: 12, action: "anonymize" },
  feedbackAnonymous: { months: 24, action: "delete" },
} as const satisfies Record<string, RetentionRule>;

export const RETENTION_PENDING_INSTITUTIONAL_APPROVAL = true;

export interface RetentionSubject {
  id: string;
  kind: SubmissionKind;
  /** Data do último andamento (criação ou mudança de status), ISO 8601. */
  lastActivityAt: string;
  /** Feedback com nome ou e-mail. */
  identified: boolean;
  /** Registro com retenção suspensa (ex.: virou contrato, pedido judicial). */
  legalHold?: boolean;
}

function ruleFor(subject: RetentionSubject): RetentionRule {
  if (subject.kind === "feedback") {
    return subject.identified ? RETENTION_RULES.feedbackIdentified : RETENTION_RULES.feedbackAnonymous;
  }
  return RETENTION_RULES[subject.kind];
}

/** Soma meses em UTC preservando o fim de mês (31/01 + 1 mês = 28/29 fev). */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

/** Decide o que fazer com um registro na rotina de retenção (TECH-08 / DBX-05). */
export function retentionActionFor(subject: RetentionSubject, now: Date = new Date()): RetentionAction {
  if (subject.legalHold) return "keep";
  const rule = ruleFor(subject);
  const expiresAt = addMonths(new Date(subject.lastActivityAt), rule.months);
  return now.getTime() >= expiresAt.getTime() ? rule.action : "keep";
}

export interface RetentionPlan {
  delete: string[];
  anonymize: string[];
  keep: number;
}

/** Agrupa as ações para execução em lote (com auditoria do total — TECH-10). */
export function planRetention(subjects: readonly RetentionSubject[], now: Date = new Date()): RetentionPlan {
  const plan: RetentionPlan = { delete: [], anonymize: [], keep: 0 };
  for (const subject of subjects) {
    const action = retentionActionFor(subject, now);
    if (action === "keep") plan.keep += 1;
    else plan[action].push(subject.id);
  }
  return plan;
}

/** Campos pessoais removidos na anonimização de feedback. */
export const FEEDBACK_PERSONAL_FIELDS = ["name", "email"] as const;

/** Remove identificação do feedback mantendo perfil, nota e mensagem. */
export function anonymizeFeedback<T extends { name?: string | null; email?: string | null; allowContact?: boolean }>(
  record: T,
): T {
  return { ...record, name: null, email: null, allowContact: false };
}
