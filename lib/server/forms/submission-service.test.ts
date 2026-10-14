/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : submission-service.test.ts
 Descrição    : Cenários S1–S10 de sucesso, erro, duplicidade e falhas dos formulários.

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

import { createHmac } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemorySubmissionStore } from "./memory-store";
import { processSubmission, retryPendingNotifications, type SubmissionDeps } from "./submission-service";
import type { Notifier, OutgoingEmail } from "./types";

const T0 = new Date("2026-10-13T15:00:00.000Z");
const ID = "0b6c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e10";

class FakeNotifier implements Notifier {
  sent: OutgoingEmail[] = [];
  failNext = 0;
  async send(email: OutgoingEmail) {
    if (this.failNext > 0) {
      this.failNext -= 1;
      throw new Error("Resend respondeu 503");
    }
    this.sent.push(email);
  }
}

const lead = (overrides: Record<string, unknown> = {}) => ({
  submissionId: ID,
  website: "",
  startedAt: String(T0.getTime() - 60_000),
  name: "Maria",
  email: "maria@empresa.com",
  projectDescription: "Precisamos de um vídeo institucional para o lançamento.",
  privacyConsent: "on",
  ...overrides,
});

let store: MemorySubmissionStore;
let notifier: FakeNotifier;
let now: Date;
let deps: SubmissionDeps;
const context = { requestId: "req-1", ip: "203.0.113.10" };

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  store = new MemorySubmissionStore();
  notifier = new FakeNotifier();
  now = T0;
  deps = {
    store,
    notifier,
    recipients: { LEAD_NOTIFICATION_TO: ["comercial@benjamin.test"], CONTACT_NOTIFICATION_TO: [], FEEDBACK_NOTIFICATION_TO: [] },
    hmac: (value) => createHmac("sha256", "segredo-de-teste").update(value).digest("hex"),
    now: () => now,
    siteUrl: "https://benjamin.test",
  };
});

describe("processSubmission — cenários (TECH-07)", () => {
  it("S1 sucesso: persiste, notifica e devolve protocolo", async () => {
    const result = await processSubmission("lead", lead(), context, deps);
    expect(result).toEqual({ status: "success", protocol: "AB-0B6C2F", duplicate: false });
    expect(store.all()).toHaveLength(1);
    expect(store.all()[0]).toMatchObject({ notificationStatus: "sent", notificationAttempts: 1, category: "lead:nao-sei" });
    expect(store.all()[0].ipHash).not.toContain("203.0.113.10");
    expect(notifier.sent[0]).toMatchObject({ to: ["comercial@benjamin.test"], idempotencyKey: `submission-${ID}` });
  });

  it("S2 validação: devolve erros por campo e repreenche valores, sem persistir", async () => {
    const result = await processSubmission("lead", lead({ email: "x" }), context, deps);
    expect(result).toMatchObject({ status: "error", code: "VALIDATION_FAILED", values: { email: "x", name: "Maria" } });
    expect(result.status === "error" && result.fieldErrors?.email).toBeTruthy();
    expect(store.all()).toHaveLength(0);
  });

  it("S3 duplo clique: mesmo submissionId não duplica nem renotifica", async () => {
    await processSubmission("lead", lead(), context, deps);
    const second = await processSubmission("lead", lead(), context, deps);
    expect(second).toEqual({ status: "success", protocol: "AB-0B6C2F", duplicate: true });
    expect(store.all()).toHaveLength(1);
    expect(notifier.sent).toHaveLength(1);
  });

  it("S4 reenvio após recarregar: mesmo conteúdo com outro id em 10 min é duplicado", async () => {
    await processSubmission("lead", lead(), context, deps);
    now = new Date(T0.getTime() + 5 * 60_000);
    const again = await processSubmission(
      "lead",
      lead({ submissionId: "9d1e8f20-1111-4c8a-9a51-3d2f9f1b7e10", startedAt: String(now.getTime() - 60_000) }),
      context,
      deps,
    );
    expect(again).toMatchObject({ status: "success", protocol: "AB-0B6C2F", duplicate: true });
    expect(store.all()).toHaveLength(1);
  });

  it("S5 mesmo conteúdo após a janela vira novo registro", async () => {
    await processSubmission("lead", lead(), context, deps);
    now = new Date(T0.getTime() + 11 * 60_000);
    const later = await processSubmission(
      "lead",
      lead({ submissionId: "9d1e8f20-1111-4c8a-9a51-3d2f9f1b7e10", startedAt: String(now.getTime() - 60_000) }),
      context,
      deps,
    );
    expect(later).toMatchObject({ status: "success", duplicate: false });
    expect(store.all()).toHaveLength(2);
  });

  it("S6 honeypot e envio rápido demais: sucesso silencioso sem persistir", async () => {
    expect(await processSubmission("lead", lead({ website: "spam.com" }), context, deps)).toMatchObject({ status: "success" });
    expect(await processSubmission("lead", lead({ startedAt: String(T0.getTime() - 500) }), context, deps)).toMatchObject({
      status: "success",
    });
    expect(store.all()).toHaveLength(0);
    expect(notifier.sent).toHaveLength(0);
  });

  it("S7 falha no banco: erro SERVICE_UNAVAILABLE e nada notificado", async () => {
    store.insert = async () => {
      throw new Error("connection refused");
    };
    const result = await processSubmission("lead", lead(), context, deps);
    expect(result).toMatchObject({ status: "error", code: "SERVICE_UNAVAILABLE", requestId: "req-1" });
    expect(notifier.sent).toHaveLength(0);
  });

  it("S8 falha na notificação: lead preservado, usuário vê sucesso e reenvio posterior entrega", async () => {
    notifier.failNext = 1;
    const result = await processSubmission("lead", lead(), context, deps);
    expect(result).toMatchObject({ status: "success", duplicate: false });
    expect(store.all()[0]).toMatchObject({ notificationStatus: "failed", notificationAttempts: 1 });

    now = new Date(T0.getTime() + 30_000);
    expect(await retryPendingNotifications(deps)).toEqual({ retried: 0 }); // ainda no backoff
    now = new Date(T0.getTime() + 2 * 60_000);
    expect(await retryPendingNotifications(deps)).toEqual({ retried: 1 });
    expect(store.all()[0]).toMatchObject({ notificationStatus: "sent", notificationAttempts: 2 });
    expect(notifier.sent).toHaveLength(1);
  });

  it("S9 limite por origem: sexto envio em 10 min é bloqueado", async () => {
    for (let index = 0; index < 5; index += 1) {
      const id = `0b6c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e1${index}`;
      await processSubmission("lead", lead({ submissionId: id, projectDescription: `Projeto número ${index} com detalhes.` }), context, deps);
    }
    const blocked = await processSubmission(
      "lead",
      lead({ submissionId: "0b6c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e19", projectDescription: "Projeto número 9 com detalhes." }),
      context,
      deps,
    );
    expect(blocked).toMatchObject({ status: "error", code: "RATE_LIMITED" });
  });

  it("S10 sem destinatário configurado: registro salvo com notificação 'skipped'", async () => {
    deps.recipients = { LEAD_NOTIFICATION_TO: [], CONTACT_NOTIFICATION_TO: [], FEEDBACK_NOTIFICATION_TO: [] };
    await processSubmission("lead", lead(), context, deps);
    expect(store.all()[0].notificationStatus).toBe("skipped");
  });
});
