/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : retention-service.ts
 Descrição    : Simula e executa a retenção dos envios de formulário, com a execução travada até a aprovação dos prazos.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinicius Binda             Criação inicial (DBX-05).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  planRetention,
  RETENTION_PENDING_INSTITUTIONAL_APPROVAL,
  type RetentionPlan,
  type RetentionSubject,
} from "@/lib/domain/forms/retention";
import type { SubmissionKind } from "@/lib/domain/forms/schemas";
import { AppError } from "../errors";

export interface RetentionOutcome {
  deleted: number;
  anonymized: number;
  skipped: number;
}

export interface RetentionSimulation {
  toDelete: number;
  toAnonymize: number;
  kept: number;
}

export interface RetentionStore {
  listSubjects(): Promise<RetentionSubject[]>;
  apply(plan: RetentionPlan, plannedAt: Date): Promise<RetentionOutcome>;
}

interface SubjectRow {
  id: string;
  kind: SubmissionKind;
  last_activity_at: string;
  identified: boolean;
}

/** Usa as funções do banco: o conteúdo dos envios nunca chega à aplicação (TECH-08). */
export function createSupabaseRetentionStore(db: SupabaseClient): RetentionStore {
  return {
    async listSubjects() {
      const { data, error } = await db.rpc("retention_subjects");
      if (error) throw new AppError("SERVICE_UNAVAILABLE", { cause: error, internal: { code: error.code } });
      return ((data ?? []) as SubjectRow[]).map((row) => ({
        id: row.id,
        kind: row.kind,
        lastActivityAt: row.last_activity_at,
        identified: row.identified,
      }));
    },
    async apply(plan, plannedAt) {
      const { data, error } = await db.rpc("apply_retention", {
        p_delete: plan.delete,
        p_anonymize: plan.anonymize,
        p_planned_at: plannedAt.toISOString(),
        p_origin: "rotina",
      });
      if (error) throw new AppError("SERVICE_UNAVAILABLE", { cause: error, internal: { code: error.code } });
      return (data as RetentionOutcome[])[0];
    },
  };
}

/** Só diz quanto a rotina faria. Não grava nada e não devolve ids. */
export async function simulateRetention(store: RetentionStore, now: Date = new Date()): Promise<RetentionSimulation> {
  const plan = planRetention(await store.listSubjects(), now);
  return { toDelete: plan.delete.length, toAnonymize: plan.anonymize.length, kept: plan.keep };
}

/**
 * Executa o plano. Enquanto os prazos não forem aprovados (SEG-02), recusa antes de ler qualquer
 * envio: nenhuma decisão pendente vira exclusão de dado real.
 */
export async function executeRetention(
  store: RetentionStore,
  now: Date = new Date(),
  approved: boolean = !RETENTION_PENDING_INSTITUTIONAL_APPROVAL,
): Promise<RetentionOutcome> {
  if (!approved) {
    throw new AppError("CONFLICT", {
      message: "Os prazos de retenção ainda não foram aprovados (SEG-02). Use a simulação.",
    });
  }
  return store.apply(planRetention(await store.listSubjects(), now), now);
}
