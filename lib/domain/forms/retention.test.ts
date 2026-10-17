/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : retention.test.ts
 Descrição    : Testes das regras de retenção e anonimização.

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

import { describe, expect, it } from "vitest";
import { addMonths, anonymizeFeedback, planRetention, retentionActionFor, type RetentionSubject } from "./retention";

const NOW = new Date("2026-10-13T12:00:00.000Z");
const subject = (overrides: Partial<RetentionSubject>): RetentionSubject => ({
  id: "1",
  kind: "lead",
  lastActivityAt: "2026-10-01T00:00:00.000Z",
  identified: true,
  ...overrides,
});

describe("retenção", () => {
  it("mantém lead dentro de 12 meses e exclui depois", () => {
    expect(retentionActionFor(subject({ lastActivityAt: "2025-10-14T00:00:00Z" }), NOW)).toBe("keep");
    expect(retentionActionFor(subject({ lastActivityAt: "2025-10-12T00:00:00Z" }), NOW)).toBe("delete");
  });

  it("contato vence em 6 meses", () => {
    expect(retentionActionFor(subject({ kind: "contact", lastActivityAt: "2026-04-12T00:00:00Z" }), NOW)).toBe(
      "delete",
    );
    expect(retentionActionFor(subject({ kind: "contact", lastActivityAt: "2026-05-01T00:00:00Z" }), NOW)).toBe("keep");
  });

  it("anonimiza feedback identificado e exclui anônimo após 24 meses", () => {
    expect(retentionActionFor(subject({ kind: "feedback", lastActivityAt: "2025-09-01T00:00:00Z" }), NOW)).toBe(
      "anonymize",
    );
    expect(
      retentionActionFor(subject({ kind: "feedback", identified: false, lastActivityAt: "2025-09-01T00:00:00Z" }), NOW),
    ).toBe("keep");
    expect(
      retentionActionFor(subject({ kind: "feedback", identified: false, lastActivityAt: "2024-09-01T00:00:00Z" }), NOW),
    ).toBe("delete");
  });

  it("respeita retenção suspensa (legal hold)", () => {
    expect(retentionActionFor(subject({ lastActivityAt: "2020-01-01T00:00:00Z", legalHold: true }), NOW)).toBe("keep");
  });

  it("agrupa o plano de execução", () => {
    const plan = planRetention(
      [
        subject({ id: "a", lastActivityAt: "2020-01-01T00:00:00Z" }),
        subject({ id: "b", kind: "feedback", lastActivityAt: "2020-01-01T00:00:00Z" }),
        subject({ id: "c" }),
      ],
      NOW,
    );
    expect(plan).toEqual({ delete: ["a"], anonymize: ["b"], keep: 1 });
  });

  it("soma meses preservando fim de mês", () => {
    expect(addMonths(new Date("2026-01-31T00:00:00Z"), 1).toISOString()).toBe("2026-02-28T00:00:00.000Z");
  });

  it("anonimização remove nome e e-mail e desliga retorno", () => {
    expect(anonymizeFeedback({ name: "Ana", email: "ana@x.com", allowContact: true, message: "ok" })).toEqual({
      name: null,
      email: null,
      allowContact: false,
      message: "ok",
    });
  });
});
