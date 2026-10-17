/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : routing.test.ts
 Descrição    : Testes do roteamento, destinatários, protocolo e notificação dos formulários.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { buildNotification, protocolFromId, resolveRecipients, routeSubmission } from "./routing";
import type { SubmissionInput } from "./schemas";

const technical = { submissionId: "0b6c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e10", website: "" };
const lead: SubmissionInput = {
  kind: "lead",
  data: {
    ...technical,
    name: "Maria",
    email: "maria@empresa.com",
    phone: undefined,
    company: "Empresa X",
    serviceInterest: "audiovisual",
    projectDescription: "Vídeo institucional para lançamento.",
    privacyConsent: true,
  },
};
const contact: SubmissionInput = {
  kind: "contact",
  data: {
    ...technical,
    name: "João",
    email: "joao@x.com",
    phone: undefined,
    subject: "imprensa",
    message: "Pauta.",
    privacyConsent: true,
  },
};
const feedback: SubmissionInput = {
  kind: "feedback",
  data: { ...technical, profile: "aluno", rating: 5, message: "Muito bom!", allowContact: false, privacyConsent: true },
};

const config = {
  LEAD_NOTIFICATION_TO: ["comercial@benjamin.test"],
  CONTACT_NOTIFICATION_TO: ["institucional@benjamin.test"],
  FEEDBACK_NOTIFICATION_TO: [],
};

describe("routeSubmission", () => {
  it("diferencia lead, contato e feedback com categoria e permissão de consulta", () => {
    expect(routeSubmission(lead)).toEqual({
      kind: "lead",
      category: "lead:audiovisual",
      recipientKey: "LEAD_NOTIFICATION_TO",
      viewResource: "lead",
      priority: "alta",
    });
    expect(routeSubmission(contact)).toMatchObject({
      category: "contact:imprensa",
      viewResource: "lead",
      priority: "alta",
    });
    expect(routeSubmission(feedback)).toMatchObject({
      category: "feedback:aluno",
      viewResource: "feedback",
      priority: "normal",
    });
  });

  it("usa 'nao-sei' quando o serviço não foi escolhido", () => {
    const withoutService = { ...lead, data: { ...lead.data, serviceInterest: undefined } } as SubmissionInput;
    expect(routeSubmission(withoutService).category).toBe("lead:nao-sei");
  });
});

describe("resolveRecipients", () => {
  it("usa a lista própria de cada tipo e cai para a de leads quando vazia", () => {
    expect(resolveRecipients(routeSubmission(contact), config)).toEqual(["institucional@benjamin.test"]);
    expect(resolveRecipients(routeSubmission(feedback), config)).toEqual(["comercial@benjamin.test"]);
  });
});

describe("protocolo e notificação", () => {
  it("gera protocolo curto a partir do identificador", () => {
    expect(protocolFromId(technical.submissionId)).toBe("AB-0B6C2F");
  });

  it("monta e-mail de lead com reply-to do remetente", () => {
    const content = buildNotification(lead, routeSubmission(lead), {
      protocol: "AB-0B6C2F",
      receivedAt: new Date("2026-10-13T15:00:00Z"),
      siteUrl: "https://benjamin.test",
      serviceName: "Audiovisual",
    });
    expect(content.subject).toBe("[Novo projeto] Maria — Empresa X (AB-0B6C2F)");
    expect(content.replyTo).toBe("maria@empresa.com");
    expect(content.text).toContain("Serviço de interesse: Audiovisual");
    expect(content.text).toContain("https://benjamin.test/admin");
  });

  it("não expõe reply-to em feedback sem pedido de retorno", () => {
    const content = buildNotification(feedback, routeSubmission(feedback), {
      protocol: "AB-1",
      receivedAt: new Date(),
      siteUrl: "https://benjamin.test",
    });
    expect(content.replyTo).toBeUndefined();
    expect(content.text).toContain("Identificação: anônimo");
  });
});
