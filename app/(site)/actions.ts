/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Server Actions dos formulários de novo projeto, contato e feedback.

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

"use server";

import { headers } from "next/headers";
import type { SubmissionKind } from "@/lib/domain/forms/schemas";
import type { FormActionState } from "@/lib/domain/forms/state";
import { newRequestId, toPublicError } from "@/lib/server/errors";
import { getSubmissionDeps } from "@/lib/server/forms/deps";
import { processSubmission } from "@/lib/server/forms/submission-service";

/** IP do visitante (somente para HMAC do limite de envios — nunca gravado em claro). */
async function clientIp(): Promise<string | null> {
  const requestHeaders = await headers();
  return requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || requestHeaders.get("x-real-ip");
}

async function submit(kind: SubmissionKind, formData: FormData): Promise<FormActionState> {
  const requestId = newRequestId();
  const raw: Record<string, unknown> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !key.startsWith("$ACTION")) raw[key] = value;
  });
  // Sem JavaScript o navegador não gera o identificador: o servidor gera um novo
  // (a deduplicação por conteúdo continua valendo — TECH-07).
  if (!raw.submissionId) raw.submissionId = crypto.randomUUID();

  try {
    return await processSubmission(kind, raw, { requestId, ip: await clientIp() }, getSubmissionDeps());
  } catch (error) {
    const publicError = toPublicError(error, requestId, "forms.action.unexpected_error");
    return { status: "error", code: publicError.code, message: publicError.message, requestId };
  }
}

/** Formulário de novos projetos (prospecção — FORM-03). */
export async function submitLead(_prev: FormActionState, formData: FormData) {
  return submit("lead", formData);
}

/** Formulário de contato institucional (FORM-04). */
export async function submitContact(_prev: FormActionState, formData: FormData) {
  return submit("contact", formData);
}

/** Formulário de feedback (FORM-05). */
export async function submitFeedback(_prev: FormActionState, formData: FormData) {
  return submit("feedback", formData);
}
