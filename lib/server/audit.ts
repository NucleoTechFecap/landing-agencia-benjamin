/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : audit.ts
 Descrição    : Grava eventos na trilha de auditoria via função do banco (crítico aborta).

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-10).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { AUDIT_EVENTS, sanitizeAuditMetadata, type AuditEventName, type AuditOutcome } from "@/lib/domain/audit/events";
import { AppError } from "./errors";
import { logger } from "./logger";
import { createSessionClient } from "./supabase/server";

export interface AuditInput {
  event: AuditEventName;
  resourceId?: string | null;
  outcome?: AuditOutcome;
  metadata?: Record<string, unknown>;
  requestId?: string;
}

/**
 * Grava um evento na trilha de auditoria (TECH-10) via `record_audit_event`: o banco
 * define ator, papel e horário a partir da sessão — o cliente não consegue forjá-los.
 * Evento crítico sem registro aborta a operação (lança SERVICE_UNAVAILABLE).
 */
export async function recordAuditEvent(input: AuditInput): Promise<void> {
  const definition = AUDIT_EVENTS[input.event];
  const metadata = sanitizeAuditMetadata(input.metadata);
  try {
    const supabase = await createSessionClient();
    const { error } = await supabase.rpc("record_audit_event", {
      p_event: input.event,
      p_resource_type: definition.resourceType,
      p_resource_id: input.resourceId ?? null,
      p_outcome: input.outcome ?? "success",
      p_metadata: metadata,
      p_request_id: input.requestId ?? null,
    });
    if (error) throw error;
  } catch (error) {
    logger.error("audit.record_failed", { event: input.event, critical: definition.critical, error });
    if (definition.critical) {
      throw new AppError("SERVICE_UNAVAILABLE", {
        message: "Não foi possível registrar a operação na auditoria; ela não foi concluída. Tente novamente.",
        cause: error,
      });
    }
  }
}
