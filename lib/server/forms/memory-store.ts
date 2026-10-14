/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : memory-store.ts
 Descrição    : Armazenamento de envios em memória para desenvolvimento e testes.

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
import { DuplicateSubmissionError, type SubmissionRecord, type SubmissionStore } from "./types";

/**
 * Armazenamento em memória para desenvolvimento e testes. NÃO usar em produção:
 * os dados se perdem a cada reinício e não são compartilhados entre instâncias.
 */
export class MemorySubmissionStore implements SubmissionStore {
  private readonly records = new Map<string, SubmissionRecord>();

  async findById(id: string) {
    return this.records.get(id) ?? null;
  }

  async findRecentByFingerprint(fingerprint: string, since: Date) {
    for (const record of this.records.values()) {
      if (record.fingerprint === fingerprint && Date.parse(record.createdAt) >= since.getTime()) return record;
    }
    return null;
  }

  async countRecentByIpHash(ipHash: string, since: Date) {
    let count = 0;
    for (const record of this.records.values()) {
      if (record.ipHash === ipHash && Date.parse(record.createdAt) >= since.getTime()) count += 1;
    }
    return count;
  }

  async insert(record: SubmissionRecord) {
    if (this.records.has(record.id)) throw new DuplicateSubmissionError(record.id);
    this.records.set(record.id, structuredClone(record));
  }

  async updateNotification(id: string, patch: Partial<SubmissionRecord>) {
    const current = this.records.get(id);
    if (current) this.records.set(id, { ...current, ...patch });
  }

  async listNotificationBacklog(limit: number) {
    return [...this.records.values()]
      .filter((record) => record.notificationStatus === "pending" || record.notificationStatus === "failed")
      .slice(0, limit);
  }

  /** Apenas para testes. */
  all() {
    return [...this.records.values()];
  }
}
