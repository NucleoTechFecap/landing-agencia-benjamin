/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : jornada-lead.test.ts
 Descrição    : Teste integrado da jornada de lead até a consulta interna (J3).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-12).
 02/11/2026 Vinícius Nishimura Reis  Jornadas de contato e feedback (TECH-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { can } from "@/lib/domain/auth/rbac";
import { routeSubmission } from "@/lib/domain/forms/routing";
import { planRetention } from "@/lib/domain/forms/retention";
import { MemorySubmissionStore } from "@/lib/server/forms/memory-store";
import { processSubmission } from "@/lib/server/forms/submission-service";
import type { OutgoingEmail } from "@/lib/server/forms/types";

/**
 * J3 — envio → persistência → notificação → consulta interna (TECH-12), integrando
 * schema, idempotência, roteamento, notificação, RBAC de consulta e retenção.
 */
describe("J3 · lead enviado chega ao destinatário e só o admin consulta", () => {
  it("fluxo positivo e regras de acesso", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const store = new MemorySubmissionStore();
    const sent: OutgoingEmail[] = [];
    const now = new Date("2026-10-20T15:00:00.000Z");
    const deps = {
      store,
      notifier: { send: async (email: OutgoingEmail) => void sent.push(email) },
      recipients: {
        LEAD_NOTIFICATION_TO: ["comercial@benjamin.test"],
        CONTACT_NOTIFICATION_TO: [],
        FEEDBACK_NOTIFICATION_TO: [],
      },
      hmac: (value: string) => createHmac("sha256", "segredo").update(value).digest("hex"),
      now: () => now,
      siteUrl: "https://benjamin.test",
      serviceName: async () => "Audiovisual",
    };

    const result = await processSubmission(
      "lead",
      {
        submissionId: "7d1c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e10",
        startedAt: String(now.getTime() - 60_000),
        name: "Cliente Teste",
        email: "cliente@empresa.test",
        serviceInterest: "audiovisual",
        projectDescription: "Vídeo institucional para a convenção anual da empresa.",
        privacyConsent: "on",
      },
      { requestId: "req-j3", ip: "198.51.100.7" },
      deps,
    );

    // Persistência + notificação
    expect(result).toMatchObject({ status: "success", duplicate: false });
    const [record] = store.all();
    expect(record).toMatchObject({ kind: "lead", category: "lead:audiovisual", notificationStatus: "sent" });
    expect(sent[0].text).toContain("Serviço de interesse: Audiovisual");

    // Consulta interna: só quem tem lead:view
    const decision = routeSubmission({ kind: "lead", data: record.payload as never });
    expect(can("admin", decision.viewResource, "view")).toBe(true);
    expect(can("editor", decision.viewResource, "view")).toBe(false);
    expect(can("super_admin", decision.viewResource, "view")).toBe(false);

    // Retenção: mantido dentro do prazo
    expect(
      planRetention([{ id: record.id, kind: "lead", lastActivityAt: record.createdAt, identified: true }], now),
    ).toEqual({
      delete: [],
      anonymize: [],
      keep: 1,
    });
    vi.restoreAllMocks();
  });
});

/**
 * Contato e feedback pelo mesmo caminho do lead (TECH-06): cada tipo segue seu fluxo, com
 * destinatário, categoria e permissão de consulta próprios, sem se misturar.
 */
describe("J3 · contato e feedback seguem fluxos separados do lead", () => {
  const now = new Date("2026-10-20T15:00:00.000Z");
  const technical = (submissionId: string) => ({ submissionId, startedAt: String(now.getTime() - 60_000) });
  const context = { requestId: "req-j3b", ip: "198.51.100.8" };

  function setup() {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const store = new MemorySubmissionStore();
    const sent: OutgoingEmail[] = [];
    const deps = {
      store,
      notifier: { send: async (email: OutgoingEmail) => void sent.push(email) },
      recipients: {
        LEAD_NOTIFICATION_TO: ["comercial@benjamin.test"],
        CONTACT_NOTIFICATION_TO: ["institucional@benjamin.test"],
        FEEDBACK_NOTIFICATION_TO: [],
      },
      hmac: (value: string) => createHmac("sha256", "segredo").update(value).digest("hex"),
      now: () => now,
      siteUrl: "https://benjamin.test",
    };
    return { store, sent, deps };
  }

  it("contato vai ao destinatário próprio, com retorno para quem escreveu, e exige lead:view", async () => {
    const { store, sent, deps } = setup();
    const result = await processSubmission(
      "contact",
      {
        ...technical("7d1c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e11"),
        name: "Jornalista Teste",
        email: "pauta@redacao.test",
        subject: "imprensa",
        message: "Gostaria de uma entrevista sobre a agência experimental.",
        privacyConsent: "on",
      },
      context,
      deps,
    );

    expect(result).toMatchObject({ status: "success", duplicate: false });
    const [record] = store.all();
    expect(record).toMatchObject({ kind: "contact", category: "contact:imprensa", notificationStatus: "sent" });
    expect(sent[0]).toMatchObject({ to: ["institucional@benjamin.test"], replyTo: "pauta@redacao.test" });
    expect(sent[0].text).toContain("Prioridade sugerida: alta");

    const decision = routeSubmission({ kind: "contact", data: record.payload as never });
    expect(decision.viewResource).toBe("lead");
    expect(can("admin", decision.viewResource, "view")).toBe(true);
    expect(can("editor", decision.viewResource, "view")).toBe(false);
    vi.restoreAllMocks();
  });

  it("feedback anônimo cai no destinatário de leads, sem retorno, e exige feedback:view", async () => {
    const { store, sent, deps } = setup();
    await processSubmission(
      "feedback",
      {
        ...technical("7d1c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e12"),
        profile: "aluno",
        rating: "5",
        message: "A palestra sobre social media foi ótima.",
        privacyConsent: "on",
      },
      context,
      deps,
    );

    const [record] = store.all();
    expect(record).toMatchObject({ kind: "feedback", category: "feedback:aluno", notificationStatus: "sent" });
    expect(sent[0].to).toEqual(["comercial@benjamin.test"]);
    expect(sent[0].replyTo).toBeUndefined();
    expect(sent[0].text).toContain("Identificação: anônimo");

    const decision = routeSubmission({ kind: "feedback", data: record.payload as never });
    expect(decision.viewResource).toBe("feedback");
    expect(can("admin", decision.viewResource, "view")).toBe(true);
    expect(can("super_admin", decision.viewResource, "view")).toBe(false);
    vi.restoreAllMocks();
  });

  it("mesma pessoa e mesma mensagem em tipos diferentes geram registros distintos", async () => {
    const { store, sent, deps } = setup();
    const person = { name: "Pessoa Teste", email: "pessoa@empresa.test", privacyConsent: "on" };
    const message = "Mensagem igual enviada em dois formulários diferentes.";

    await processSubmission(
      "contact",
      { ...technical("7d1c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e13"), ...person, subject: "duvida", message },
      context,
      deps,
    );
    const second = await processSubmission(
      "feedback",
      { ...technical("7d1c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e14"), ...person, profile: "cliente", message },
      context,
      deps,
    );

    expect(second).toMatchObject({ status: "success", duplicate: false });
    expect(store.all().map((record) => record.kind)).toEqual(["contact", "feedback"]);
    expect(sent).toHaveLength(2);
    vi.restoreAllMocks();
  });
});
