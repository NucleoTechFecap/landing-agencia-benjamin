/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : routing.ts
 Descrição    : Roteamento de envios: categoria, destinatário configurável, permissão, protocolo e e-mail interno.

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

import type { Resource } from "../auth/rbac";
import {
  CONTACT_SUBJECTS,
  FEEDBACK_PROFILES,
  SUBMISSION_KIND_LABELS,
  UNKNOWN_SERVICE,
  type SubmissionInput,
  type SubmissionKind,
} from "./schemas";

/** Variáveis de configuração com os destinatários de cada tipo (nunca e-mails fixos — RN-03). */
export type RecipientKey = "LEAD_NOTIFICATION_TO" | "CONTACT_NOTIFICATION_TO" | "FEEDBACK_NOTIFICATION_TO";

export type RecipientConfig = Record<RecipientKey, string[]>;

export interface RoutingDecision {
  kind: SubmissionKind;
  /** Categoria para filtro no painel: "lead:audiovisual", "contact:imprensa", "feedback:aluno". */
  category: string;
  recipientKey: RecipientKey;
  /** Recurso RBAC exigido para consultar o registro no painel. */
  viewResource: Extract<Resource, "lead" | "feedback">;
  /** Prioridade de atendimento sugerida. */
  priority: "alta" | "normal";
}

const RECIPIENT_BY_KIND: Record<SubmissionKind, RecipientKey> = {
  lead: "LEAD_NOTIFICATION_TO",
  contact: "CONTACT_NOTIFICATION_TO",
  feedback: "FEEDBACK_NOTIFICATION_TO",
};

/** Decide categoria, destinatário e permissão de consulta de um envio validado (TECH-06). */
export function routeSubmission(input: SubmissionInput): RoutingDecision {
  switch (input.kind) {
    case "lead":
      return {
        kind: "lead",
        category: `lead:${input.data.serviceInterest || UNKNOWN_SERVICE}`,
        recipientKey: RECIPIENT_BY_KIND.lead,
        viewResource: "lead",
        priority: "alta",
      };
    case "contact":
      return {
        kind: "contact",
        category: `contact:${input.data.subject}`,
        recipientKey: RECIPIENT_BY_KIND.contact,
        // Contato também contém dados pessoais: mesma restrição de consulta dos leads.
        viewResource: "lead",
        priority: input.data.subject === "imprensa" ? "alta" : "normal",
      };
    case "feedback":
      return {
        kind: "feedback",
        category: `feedback:${input.data.profile}`,
        recipientKey: RECIPIENT_BY_KIND.feedback,
        viewResource: "feedback",
        priority: input.data.allowContact ? "alta" : "normal",
      };
  }
}

/**
 * Destinatários configurados para a decisão. Contato e feedback caem para a lista de
 * leads quando não houver configuração própria; lista vazia = notificação pendente.
 */
export function resolveRecipients(decision: RoutingDecision, config: RecipientConfig): string[] {
  const own = config[decision.recipientKey];
  return own.length > 0 ? own : config.LEAD_NOTIFICATION_TO;
}

/** Protocolo curto e legível exibido ao usuário, derivado do identificador do envio. */
export function protocolFromId(submissionId: string): string {
  return `AB-${submissionId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export interface NotificationContent {
  subject: string;
  text: string;
  /** E-mail do remetente do formulário para "Responder" no cliente de e-mail. */
  replyTo?: string;
}

/** Monta o e-mail interno de notificação. Conteúdo vai apenas aos destinatários configurados. */
export function buildNotification(
  input: SubmissionInput,
  decision: RoutingDecision,
  meta: { protocol: string; receivedAt: Date; siteUrl: string; serviceName?: string },
): NotificationContent {
  const when = meta.receivedAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const header = [`Protocolo: ${meta.protocol}`, `Recebido em: ${when}`, `Categoria: ${decision.category}`];
  const footer = ["", `Consulte no painel: ${meta.siteUrl}/admin`, "Mensagem automática da plataforma Agência Benjamin."];

  switch (input.kind) {
    case "lead": {
      const data = input.data;
      return {
        subject: `[Novo projeto] ${data.name}${data.company ? ` — ${data.company}` : ""} (${meta.protocol})`,
        replyTo: data.email,
        text: [
          ...header,
          "",
          `Nome: ${data.name}`,
          `E-mail: ${data.email}`,
          `Telefone: ${data.phone ?? "não informado"}`,
          `Empresa: ${data.company ?? "não informada"}`,
          `Serviço de interesse: ${meta.serviceName ?? data.serviceInterest ?? "Ainda não sabe"}`,
          "",
          "Descrição do projeto:",
          data.projectDescription,
          ...footer,
        ].join("\n"),
      };
    }
    case "contact": {
      const data = input.data;
      return {
        subject: `[Contato] ${CONTACT_SUBJECTS[data.subject]} — ${data.name} (${meta.protocol})`,
        replyTo: data.email,
        text: [
          ...header,
          "",
          `Nome: ${data.name}`,
          `E-mail: ${data.email}`,
          `Telefone: ${data.phone ?? "não informado"}`,
          `Assunto: ${CONTACT_SUBJECTS[data.subject]}`,
          "",
          "Mensagem:",
          data.message,
          ...footer,
        ].join("\n"),
      };
    }
    case "feedback": {
      const data = input.data;
      return {
        subject: `[${SUBMISSION_KIND_LABELS.feedback}] ${FEEDBACK_PROFILES[data.profile]}${data.rating ? ` — nota ${data.rating}` : ""} (${meta.protocol})`,
        replyTo: data.allowContact ? data.email : undefined,
        text: [
          ...header,
          "",
          `Perfil: ${FEEDBACK_PROFILES[data.profile]}`,
          `Nota: ${data.rating ?? "não informada"}`,
          `Identificação: ${data.name ?? "anônimo"}`,
          `Deseja retorno: ${data.allowContact ? `sim (${data.email})` : "não"}`,
          "",
          "Feedback:",
          data.message,
          ...footer,
        ].join("\n"),
      };
    }
  }
}
