/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : supabase-store.ts
 Descrição    : Persistência dos envios de formulário na tabela form_submissions.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DuplicateSubmissionError, type SubmissionRecord, type SubmissionStore } from "./types";

const TABLE = "form_submissions";

interface Row {
  id: string;
  protocol: string;
  kind: SubmissionRecord["kind"];
  category: string;
  payload: Record<string, unknown>;
  fingerprint: string;
  ip_hash: string | null;
  source_path: string | null;
  status: "novo";
  notification_status: SubmissionRecord["notificationStatus"];
  notification_attempts: number;
  last_notification_error: string | null;
  created_at: string;
  updated_at: string;
}

const toRecord = (row: Row): SubmissionRecord => ({
  id: row.id,
  protocol: row.protocol,
  kind: row.kind,
  category: row.category,
  payload: row.payload,
  fingerprint: row.fingerprint,
  ipHash: row.ip_hash,
  sourcePath: row.source_path,
  status: row.status,
  notificationStatus: row.notification_status,
  notificationAttempts: row.notification_attempts,
  lastNotificationError: row.last_notification_error,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/** Persistência dos envios no Supabase (tabela form_submissions — migration 0400). */
export class SupabaseSubmissionStore implements SubmissionStore {
  constructor(private readonly db: SupabaseClient) {}

  async findById(id: string) {
    const { data, error } = await this.db.from(TABLE).select("*").eq("id", id).maybeSingle<Row>();
    if (error) throw error;
    return data ? toRecord(data) : null;
  }

  async findRecentByFingerprint(fingerprint: string, since: Date) {
    const { data, error } = await this.db
      .from(TABLE)
      .select("*")
      .eq("fingerprint", fingerprint)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<Row>();
    if (error) throw error;
    return data ? toRecord(data) : null;
  }

  async countRecentByIpHash(ipHash: string, since: Date) {
    const { count, error } = await this.db
      .from(TABLE)
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since.toISOString());
    if (error) throw error;
    return count ?? 0;
  }

  async insert(record: SubmissionRecord) {
    const row: Row = {
      id: record.id,
      protocol: record.protocol,
      kind: record.kind,
      category: record.category,
      payload: record.payload,
      fingerprint: record.fingerprint,
      ip_hash: record.ipHash,
      source_path: record.sourcePath,
      status: record.status,
      notification_status: record.notificationStatus,
      notification_attempts: record.notificationAttempts,
      last_notification_error: record.lastNotificationError,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
    const { error } = await this.db.from(TABLE).insert(row);
    // 23505 = violação de unicidade: o mesmo submissionId já foi gravado (corrida).
    if (error?.code === "23505") throw new DuplicateSubmissionError(record.id);
    if (error) throw error;
  }

  async updateNotification(
    id: string,
    patch: Pick<
      SubmissionRecord,
      "notificationStatus" | "notificationAttempts" | "lastNotificationError" | "updatedAt"
    >,
  ) {
    const { error } = await this.db
      .from(TABLE)
      .update({
        notification_status: patch.notificationStatus,
        notification_attempts: patch.notificationAttempts,
        last_notification_error: patch.lastNotificationError,
        updated_at: patch.updatedAt,
      })
      .eq("id", id);
    if (error) throw error;
  }

  async listNotificationBacklog(limit: number) {
    const { data, error } = await this.db
      .from(TABLE)
      .select("*")
      .in("notification_status", ["pending", "failed"])
      .order("created_at", { ascending: true })
      .limit(limit)
      .returns<Row[]>();
    if (error) throw error;
    return (data ?? []).map(toRecord);
  }
}
