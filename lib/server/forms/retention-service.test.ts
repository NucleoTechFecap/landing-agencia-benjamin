/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : retention-service.test.ts
 Descrição    : Testes da simulação e da trava de aprovação da rotina de retenção.

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

import { describe, expect, it, vi } from "vitest";
import { executeRetention, simulateRetention, type RetentionStore } from "./retention-service";

const NOW = new Date("2026-11-04T12:00:00Z");
const OLD = "2024-01-01T00:00:00Z";
const RECENT = "2026-10-01T00:00:00Z";

function fakeStore(): RetentionStore {
  return {
    listSubjects: vi.fn(async () => [
      { id: "lead-vencido", kind: "lead" as const, lastActivityAt: OLD, identified: true },
      { id: "feedback-vencido", kind: "feedback" as const, lastActivityAt: "2025-06-01T00:00:00Z", identified: true },
      { id: "contato-recente", kind: "contact" as const, lastActivityAt: RECENT, identified: true },
    ]),
    apply: vi.fn(async () => ({ deleted: 1, anonymized: 1, skipped: 0 })),
  };
}

describe("simulateRetention", () => {
  it("só conta: não grava e não devolve ids", async () => {
    const store = fakeStore();
    await expect(simulateRetention(store, NOW)).resolves.toEqual({ toDelete: 1, toAnonymize: 1, kept: 1 });
    expect(store.apply).not.toHaveBeenCalled();
  });
});

describe("executeRetention", () => {
  it("com os prazos pendentes de aprovação, recusa sem ler nem gravar", async () => {
    const store = fakeStore();
    await expect(executeRetention(store, NOW)).rejects.toMatchObject({
      code: "CONFLICT",
      message: expect.stringContaining("SEG-02"),
    });
    expect(store.listSubjects).not.toHaveBeenCalled();
    expect(store.apply).not.toHaveBeenCalled();
  });

  it("aprovado, aplica exatamente o plano", async () => {
    const store = fakeStore();
    await expect(executeRetention(store, NOW, true)).resolves.toEqual({ deleted: 1, anonymized: 1, skipped: 0 });
    expect(store.apply).toHaveBeenCalledWith(
      { delete: ["lead-vencido"], anonymize: ["feedback-vencido"], keep: 1 },
      NOW,
    );
  });
});
