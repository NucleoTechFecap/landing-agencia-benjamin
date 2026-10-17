/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : types.ts
 Descrição    : Tipos do registro de envio, armazenamento e notificador dos formulários.

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

import "server-only";
import type { SubmissionKind } from "@/lib/domain/forms/schemas";

export type NotificationStatus = "pending" | "sent" | "failed" | "skipped";

/** Registro persistido de um envio de formulário (lead, contato ou feedback). */
export interface SubmissionRecord {
  /** Igual ao `submissionId` gerado no navegador (chave de idempotência). */
  id: string;
  protocol: string;
  kind: SubmissionKind;
  category: string;
  /** Dados validados, sem campos técnicos (honeypot, startedAt). */
  payload: Record<string, unknown>;
  fingerprint: string;
  ipHash: string | null;
  sourcePath: string | null;
  status: "novo";
  notificationStatus: NotificationStatus;
  notificationAttempts: number;
  lastNotificationError: string | null;
  createdAt: string;
  updatedAt: string;
}

export class DuplicateSubmissionError extends Error {
  constructor(readonly submissionId: string) {
    super(`Envio ${submissionId} já registrado.`);
    this.name = "DuplicateSubmissionError";
  }
}

/** Persistência dos envios. Implementações: memória (dev/testes) e Supabase (produção). */
export interface SubmissionStore {
  findById(id: string): Promise<SubmissionRecord | null>;
  findRecentByFingerprint(fingerprint: string, since: Date): Promise<SubmissionRecord | null>;
  countRecentByIpHash(ipHash: string, since: Date): Promise<number>;
  /** Deve lançar `DuplicateSubmissionError` se o `id` já existir (constraint única). */
  insert(record: SubmissionRecord): Promise<void>;
  updateNotification(
    id: string,
    patch: Pick<
      SubmissionRecord,
      "notificationStatus" | "notificationAttempts" | "lastNotificationError" | "updatedAt"
    >,
  ): Promise<void>;
  listNotificationBacklog(limit: number): Promise<SubmissionRecord[]>;
}

export interface OutgoingEmail {
  to: string[];
  subject: string;
  text: string;
  replyTo?: string;
  /** Chave de idempotência do provedor: o mesmo envio nunca gera dois e-mails. */
  idempotencyKey: string;
}

export interface Notifier {
  send(email: OutgoingEmail): Promise<void>;
}
