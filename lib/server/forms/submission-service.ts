/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : submission-service.ts
 Descrição    : Processa envios: validação, antispam, idempotência, persistência e notificação.

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
import {
  DEDUPE_WINDOW_MS,
  RATE_LIMIT,
  canonicalContent,
  isSuspectedBot,
  shouldRetryNotification,
} from "@/lib/domain/forms/idempotency";
import {
  buildNotification,
  protocolFromId,
  resolveRecipients,
  routeSubmission,
  type RecipientConfig,
} from "@/lib/domain/forms/routing";
import { parseSubmission, type SubmissionInput, type SubmissionKind } from "@/lib/domain/forms/schemas";
import { AppError, toPublicError, type ErrorCode } from "../errors";
import { logger } from "../logger";
import { DuplicateSubmissionError, type Notifier, type SubmissionRecord, type SubmissionStore } from "./types";

/** Estado devolvido às Server Actions dos formulários (contrato em TECH-02 §5). */
export type FormActionState =
  | { status: "idle" }
  | { status: "success"; protocol: string; duplicate: boolean }
  | {
      status: "error";
      code: ErrorCode;
      message: string;
      requestId: string;
      fieldErrors?: Record<string, string[]>;
      values?: Record<string, string>;
    };

export interface SubmissionDeps {
  store: SubmissionStore;
  notifier: Notifier;
  recipients: RecipientConfig;
  /** HMAC com segredo do ambiente (impressão digital e IP — nunca guardados em claro). */
  hmac: (value: string) => string;
  now: () => Date;
  siteUrl: string;
  serviceName?: (slug: string) => Promise<string | undefined>;
}

export interface SubmissionContext {
  requestId: string;
  ip?: string | null;
}

const TECHNICAL_FIELDS = new Set(["website", "startedAt", "privacyConsent"]);

/** Valores digitados para repreencher o formulário após erro (funciona sem JavaScript). */
function echoValues(raw: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(raw).filter(([key, value]) => typeof value === "string" && !TECHNICAL_FIELDS.has(key)) as [string, string][],
  );
}

const NON_PAYLOAD_FIELDS = new Set(["website", "startedAt", "submissionId", "sourcePath"]);

function stripTechnical(input: SubmissionInput): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input.data).filter(([key]) => !NON_PAYLOAD_FIELDS.has(key)));
}

/**
 * Processa um envio de formulário garantindo (TECH-07):
 * 1. validação no servidor; 2. antispam silencioso; 3. idempotência por `submissionId`
 * e por conteúdo; 4. limite por origem; 5. PERSISTÊNCIA ANTES da notificação;
 * 6. falha de notificação não perde o lead (fica pendente para reenvio).
 */
export async function processSubmission(
  kind: SubmissionKind,
  raw: Record<string, unknown>,
  context: SubmissionContext,
  deps: SubmissionDeps,
): Promise<FormActionState> {
  const now = deps.now();
  const log = logger.child({ requestId: context.requestId, kind });

  try {
    const parsed = parseSubmission(kind, raw);
    if (!parsed.success) {
      if (parsed.fieldErrors.website) {
        // Honeypot preenchido: responde como sucesso para não ensinar o robô.
        log.warn("forms.submission.spam_suspected", { reason: "honeypot" });
        return { status: "success", protocol: protocolFromId(String(raw.submissionId ?? "00000000")), duplicate: false };
      }
      throw new AppError("VALIDATION_FAILED", { fieldErrors: parsed.fieldErrors });
    }
    const input = parsed.value;
    const submissionId = input.data.submissionId;
    const protocol = protocolFromId(submissionId);

    if (isSuspectedBot(input.data, now)) {
      log.warn("forms.submission.spam_suspected", { reason: "too_fast", submissionId });
      return { status: "success", protocol, duplicate: false };
    }

    // Idempotência 1: mesmo identificador (duplo clique, reenvio após timeout).
    const sameId = await deps.store.findById(submissionId);
    if (sameId) {
      log.info("forms.submission.duplicate", { submissionId, by: "id" });
      return { status: "success", protocol: sameId.protocol, duplicate: true };
    }

    // Idempotência 2: mesmo conteúdo na janela (página recarregada e enviada de novo).
    const fingerprint = deps.hmac(canonicalContent(input));
    const sameContent = await deps.store.findRecentByFingerprint(fingerprint, new Date(now.getTime() - DEDUPE_WINDOW_MS));
    if (sameContent) {
      log.info("forms.submission.duplicate", { submissionId, by: "fingerprint", originalId: sameContent.id });
      return { status: "success", protocol: sameContent.protocol, duplicate: true };
    }

    const ipHash = context.ip ? deps.hmac(`ip:${context.ip}`) : null;
    if (ipHash) {
      const recent = await deps.store.countRecentByIpHash(ipHash, new Date(now.getTime() - RATE_LIMIT.windowMs));
      if (recent >= RATE_LIMIT.max) throw new AppError("RATE_LIMITED", { internal: { recent } });
    }

    const decision = routeSubmission(input);
    const record: SubmissionRecord = {
      id: submissionId,
      protocol,
      kind,
      category: decision.category,
      payload: stripTechnical(input),
      fingerprint,
      ipHash,
      sourcePath: input.data.sourcePath ?? null,
      status: "novo",
      notificationStatus: "pending",
      notificationAttempts: 0,
      lastNotificationError: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    try {
      await deps.store.insert(record);
    } catch (error) {
      if (error instanceof DuplicateSubmissionError) {
        // Corrida entre dois envios simultâneos do mesmo id: o outro já gravou.
        return { status: "success", protocol, duplicate: true };
      }
      throw new AppError("SERVICE_UNAVAILABLE", { cause: error, internal: { stage: "persist" } });
    }
    log.info("forms.submission.persisted", { submissionId, category: decision.category });

    await deliverNotification(record, input, deps);
    return { status: "success", protocol, duplicate: false };
  } catch (error) {
    const publicError = toPublicError(error, context.requestId, "forms.submission.unexpected_error");
    return {
      status: "error",
      code: publicError.code,
      message: publicError.message,
      requestId: publicError.requestId,
      fieldErrors: publicError.fieldErrors,
      values: echoValues(raw),
    };
  }
}

/** Envia a notificação e registra o resultado; erros nunca sobem para o visitante. */
async function deliverNotification(record: SubmissionRecord, input: SubmissionInput, deps: SubmissionDeps) {
  const decision = routeSubmission(input);
  const recipients = resolveRecipients(decision, deps.recipients);
  const attempts = record.notificationAttempts + 1;
  const updatedAt = deps.now().toISOString();

  if (recipients.length === 0) {
    logger.warn("forms.notification.skipped", { submissionId: record.id, reason: "no_recipients" });
    await deps.store.updateNotification(record.id, {
      notificationStatus: "skipped",
      notificationAttempts: record.notificationAttempts,
      lastNotificationError: "Sem destinatário configurado.",
      updatedAt,
    });
    return;
  }

  try {
    const serviceSlug = input.kind === "lead" ? input.data.serviceInterest : undefined;
    const content = buildNotification(input, decision, {
      protocol: record.protocol,
      receivedAt: new Date(record.createdAt),
      siteUrl: deps.siteUrl,
      serviceName: serviceSlug && deps.serviceName ? await deps.serviceName(serviceSlug) : undefined,
    });
    await deps.notifier.send({ ...content, to: recipients, idempotencyKey: `submission-${record.id}` });
    await deps.store.updateNotification(record.id, {
      notificationStatus: "sent",
      notificationAttempts: attempts,
      lastNotificationError: null,
      updatedAt,
    });
    logger.info("forms.notification.sent", { submissionId: record.id, attempts });
  } catch (error) {
    await deps.store.updateNotification(record.id, {
      notificationStatus: "failed",
      notificationAttempts: attempts,
      lastNotificationError: error instanceof Error ? error.message.slice(0, 200) : "erro desconhecido",
      updatedAt,
    });
    logger.error("forms.notification.failed", { submissionId: record.id, attempts, error });
  }
}

/** Reenvia notificações pendentes/falhas respeitando o backoff (rotina agendada). */
export async function retryPendingNotifications(deps: SubmissionDeps, limit = 20): Promise<{ retried: number }> {
  const now = deps.now();
  const backlog = await deps.store.listNotificationBacklog(limit);
  let retried = 0;
  for (const record of backlog) {
    if (record.notificationStatus === "failed" && !shouldRetryNotification(record, now)) continue;
    const input = { kind: record.kind, data: { ...record.payload, submissionId: record.id } } as SubmissionInput;
    await deliverNotification(record, input, deps);
    retried += 1;
  }
  return { retried };
}
