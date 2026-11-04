/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : submission-service.test.ts
 Descrição    : Cenários S1–S13 de sucesso, erro, duplicidade e falhas dos formulários.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-07).
 02/11/2026 Vinícius Nishimura Reis  Tentativas esgotadas fora da fila (TECH-06).
 02/11/2026 Vinícius Nishimura Reis  Serviço forjado e falha ao consultar a lista (TECH-06).
 04/11/2026 Vinícius Nishimura Reis  Envio sem JavaScript: antispam sem o tempo de preenchimento (FORM-08).
 04/11/2026 Vinícius Nishimura Reis  Falha ao registrar o resultado da notificação não chega ao visitante (FORM-08).
 04/11/2026 Vinícius Nishimura Reis  Eventos de log, sem dados pessoais (FORM-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

/** Linhas de log do teste atual, como saem no console. */
const logLines = () =>
  [console.log, console.warn, console.error].flatMap((method) =>
    vi.mocked(method).mock.calls.map(([line]) => String(line)),
  );
const logEntries = () => logLines().map((line) => JSON.parse(line) as { event: string; [key: string]: unknown });
const loggedEvents = () => logEntries().map((entry) => entry.event);

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.clearAllMocks();
  store = new MemorySubmissionStore();
  notifier = new FakeNotifier();
  now = T0;
  deps = {
    store,
    notifier,
    recipients: {
      LEAD_NOTIFICATION_TO: ["comercial@benjamin.test"],
      CONTACT_NOTIFICATION_TO: [],
      FEEDBACK_NOTIFICATION_TO: [],
    },
    hmac: (value) => createHmac("sha256", "segredo-de-teste").update(value).digest("hex"),
    now: () => now,
    siteUrl: "https://benjamin.test",
  };
});

describe("serviço de interesse (TECH-06)", () => {
  const withService = (serviceInterest: string) => lead({ serviceInterest });

  it("serviço da lista vira categoria", async () => {
    deps.serviceName = async (slug) => (slug === "audiovisual" ? "Audiovisual" : undefined);
    await processSubmission("lead", withService("audiovisual"), context, deps);
    expect((await store.findById(ID))?.category).toBe("lead:audiovisual");
  });

  it("valor forjado em formato de slug não vira categoria, nem no e-mail, e o pedido segue", async () => {
    deps.serviceName = async () => undefined;
    const result = await processSubmission("lead", withService("urgente-diretoria"), context, deps);
    expect(result.status).toBe("success");
    const record = await store.findById(ID);
    expect(record?.category).toBe("lead:nao-sei");
    expect(record?.payload).toMatchObject({ serviceInterest: "urgente-diretoria" });
    expect(notifier.sent[0].text).toContain("Categoria: lead:nao-sei");
  });

  it("falha ao consultar a lista não perde o pedido", async () => {
    deps.serviceName = async () => Promise.reject(new Error("CMS fora"));
    const result = await processSubmission("lead", withService("audiovisual"), context, deps);
    expect(result.status).toBe("success");
    expect((await store.findById(ID))?.category).toBe("lead:nao-sei");
  });
});

describe("envio sem JavaScript: campos técnicos vazios (FORM-08)", () => {
  const noScript = (overrides: Record<string, unknown> = {}) => lead({ startedAt: "", sourcePath: "", ...overrides });

  it("é aceito e gravado, sem origem", async () => {
    const result = await processSubmission("lead", noScript(), context, deps);
    expect(result).toMatchObject({ status: "success", protocol: "AB-0B6C2F", duplicate: false });
    expect(store.all()).toHaveLength(1);
    expect(store.all()[0].sourcePath).toBeNull();
  });

  it("o tempo mínimo não se aplica, como a quem omite o campo: não é uma brecha nova", async () => {
    expect((await processSubmission("lead", lead({ startedAt: undefined }), context, deps)).status).toBe("success");
    expect(store.all()).toHaveLength(1);
  });

  it("honeypot preenchido continua recusado em silêncio", async () => {
    const result = await processSubmission("lead", noScript({ website: "spam.com" }), context, deps);
    expect(result).toMatchObject({ status: "success", duplicate: false });
    expect(store.all()).toHaveLength(0);
    expect(notifier.sent).toHaveLength(0);
  });

  it("o limite por origem continua valendo", async () => {
    for (let index = 0; index < 5; index += 1) {
      await processSubmission(
        "lead",
        noScript({
          submissionId: `0b6c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e1${index}`,
          projectDescription: `Projeto número ${index} com detalhes.`,
        }),
        context,
        deps,
      );
    }
    const blocked = await processSubmission(
      "lead",
      noScript({
        submissionId: "0b6c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e19",
        projectDescription: "Projeto número 9 com detalhes.",
      }),
      context,
      deps,
    );
    expect(blocked).toMatchObject({ status: "error", code: "RATE_LIMITED" });
  });

  it("o mesmo conteúdo com outro identificador volta como duplicado", async () => {
    await processSubmission("lead", noScript(), context, deps);
    const again = await processSubmission(
      "lead",
      noScript({ submissionId: "9d1e8f20-1111-4c8a-9a51-3d2f9f1b7e10" }),
      context,
      deps,
    );
    expect(again).toMatchObject({ status: "success", protocol: "AB-0B6C2F", duplicate: true });
    expect(store.all()).toHaveLength(1);
  });
});

describe("falha ao registrar o resultado da notificação (FORM-08)", () => {
  let attemptedStatuses: string[];

  beforeEach(() => {
    attemptedStatuses = [];
    store.updateNotification = async (_id, patch) => {
      attemptedStatuses.push(String(patch.notificationStatus));
      throw new Error("connection refused");
    };
  });

  it("e-mail enviado: o visitante vê sucesso, e o envio não é marcado como falha", async () => {
    const result = await processSubmission("lead", lead(), context, deps);
    expect(result).toEqual({ status: "success", protocol: "AB-0B6C2F", duplicate: false });
    expect(notifier.sent).toHaveLength(1);
    expect(attemptedStatuses).toEqual(["sent"]);
    expect(loggedEvents()).toEqual(expect.arrayContaining(["forms.notification.status_update_failed"]));
    expect(loggedEvents()).not.toContain("forms.notification.failed");
    expect(loggedEvents()).not.toContain("forms.submission.unexpected_error");
  });

  it("e-mail recusado: o visitante vê sucesso e os dois problemas ficam no log", async () => {
    notifier.failNext = 1;
    const result = await processSubmission("lead", lead(), context, deps);
    expect(result).toMatchObject({ status: "success", duplicate: false });
    expect(attemptedStatuses).toEqual(["failed"]);
    expect(loggedEvents()).toEqual(
      expect.arrayContaining(["forms.notification.failed", "forms.notification.status_update_failed"]),
    );
  });

  it("sem destinatário: o visitante vê sucesso", async () => {
    deps.recipients = { LEAD_NOTIFICATION_TO: [], CONTACT_NOTIFICATION_TO: [], FEEDBACK_NOTIFICATION_TO: [] };
    const result = await processSubmission("lead", lead(), context, deps);
    expect(result).toMatchObject({ status: "success", duplicate: false });
    expect(attemptedStatuses).toEqual(["skipped"]);
    expect(loggedEvents()).toEqual(expect.arrayContaining(["forms.notification.status_update_failed"]));
  });

  it("o reenvio agendado não para no primeiro registro com problema", async () => {
    const update = store.updateNotification;
    store.updateNotification = async () => {};
    notifier.failNext = 2;
    await processSubmission("lead", lead(), context, deps);
    await processSubmission(
      "lead",
      lead({ submissionId: "9d1e8f20-1111-4c8a-9a51-3d2f9f1b7e10", projectDescription: "Outro projeto com detalhes." }),
      context,
      deps,
    );
    store.updateNotification = update;

    now = new Date(T0.getTime() + 2 * 60_000);
    expect(await retryPendingNotifications(deps)).toEqual({ retried: 2 });
    expect(notifier.sent).toHaveLength(2);
  });
});

describe("logs dos envios: eventos estáveis e sem dados pessoais (FORM-06)", () => {
  /** Nada do que a pessoa digitou pode aparecer nas linhas de log. */
  function expectNoPersonalData() {
    const lines = logLines().join("\n");
    expect(lines.length).toBeGreaterThan(0);
    expect(lines).not.toMatch(/maria/i);
    expect(lines).not.toContain("empresa.com");
    expect(lines).not.toContain("vídeo institucional");
    expect(lines).not.toContain("203.0.113.10");
  }

  it("envio válido: forms.submission.persisted e forms.notification.sent", async () => {
    await processSubmission("lead", lead(), context, deps);
    expect(logEntries()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ event: "forms.submission.persisted", level: "info", submissionId: ID }),
        expect.objectContaining({ event: "forms.notification.sent", level: "info", submissionId: ID, attempts: 1 }),
      ]),
    );
    expectNoPersonalData();
  });

  // O logger só inclui a pilha do erro fora de produção, e ela não é mascarada: aqui vale o que sai em produção.
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falha na notificação: forms.notification.failed, mesmo com o e-mail na mensagem do erro", async () => {
    vi.stubEnv("NODE_ENV", "production");
    notifier.send = async () => {
      throw new Error("Falha ao entregar para maria@empresa.com");
    };
    await processSubmission("lead", lead(), context, deps);
    expect(logEntries()).toContainEqual(
      expect.objectContaining({ event: "forms.notification.failed", level: "error", submissionId: ID, attempts: 1 }),
    );
    expectNoPersonalData();
  });

  it("honeypot: forms.submission.spam_suspected com o motivo", async () => {
    await processSubmission("lead", lead({ website: "spam.com" }), context, deps);
    expect(logEntries()).toContainEqual(
      expect.objectContaining({ event: "forms.submission.spam_suspected", level: "warn", reason: "honeypot" }),
    );
    expectNoPersonalData();
  });

  it("envio rápido demais: forms.submission.spam_suspected com o motivo", async () => {
    await processSubmission("lead", lead({ startedAt: String(T0.getTime() - 500) }), context, deps);
    expect(logEntries()).toContainEqual(
      expect.objectContaining({ event: "forms.submission.spam_suspected", level: "warn", reason: "too_fast" }),
    );
    expectNoPersonalData();
  });

  it("validação recusada: o log diz o que aconteceu, sem o que foi digitado", async () => {
    await processSubmission("lead", lead({ email: "maria@" }), context, deps);
    expect(loggedEvents()).toContain("app.error.validation_failed");
    expectNoPersonalData();
  });
});

describe("processSubmission — cenários (TECH-07)", () => {
  it("S1 sucesso: persiste, notifica e devolve protocolo", async () => {
    const result = await processSubmission("lead", lead(), context, deps);
    expect(result).toEqual({ status: "success", protocol: "AB-0B6C2F", duplicate: false });
    expect(store.all()).toHaveLength(1);
    expect(store.all()[0]).toMatchObject({
      notificationStatus: "sent",
      notificationAttempts: 1,
      category: "lead:nao-sei",
    });
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
    expect(await processSubmission("lead", lead({ website: "spam.com" }), context, deps)).toMatchObject({
      status: "success",
    });
    expect(
      await processSubmission("lead", lead({ startedAt: String(T0.getTime() - 500) }), context, deps),
    ).toMatchObject({
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
      await processSubmission(
        "lead",
        lead({ submissionId: id, projectDescription: `Projeto número ${index} com detalhes.` }),
        context,
        deps,
      );
    }
    const blocked = await processSubmission(
      "lead",
      lead({
        submissionId: "0b6c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e19",
        projectDescription: "Projeto número 9 com detalhes.",
      }),
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

  it("S13 tentativas esgotadas não travam a fila: envios novos continuam sendo reenviados", async () => {
    for (let index = 0; index < 20; index += 1) {
      await store.insert({
        id: `1b6c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e${String(index).padStart(2, "0")}`,
        protocol: `AB-E${index}`,
        kind: "lead",
        category: "lead:nao-sei",
        payload: {},
        fingerprint: `esgotado-${index}`,
        ipHash: null,
        sourcePath: null,
        status: "novo",
        notificationStatus: "failed",
        notificationAttempts: 5,
        lastNotificationError: "Resend respondeu 503",
        createdAt: new Date(T0.getTime() - 86_400_000).toISOString(),
        updatedAt: new Date(T0.getTime() - 86_400_000).toISOString(),
      });
    }
    notifier.failNext = 1;
    await processSubmission("lead", lead(), context, deps);

    now = new Date(T0.getTime() + 2 * 60_000);
    expect(await retryPendingNotifications(deps)).toEqual({ retried: 1 });
    expect(await store.findById(ID)).toMatchObject({ notificationStatus: "sent", notificationAttempts: 2 });
    // Esgotados continuam registrados como falha, para a conferência semanal (handoff).
    expect(store.all().filter((record) => record.notificationStatus === "failed")).toHaveLength(20);
  });
});
