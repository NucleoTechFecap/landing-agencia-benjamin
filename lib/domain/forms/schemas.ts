/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : schemas.ts
 Descrição    : Esquemas Zod dos formulários de novo projeto, contato e feedback (pt-BR).

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (FORM-01).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";

/** Tipos de envio — registros distintos por regra de negócio (RN-02 / TECH-06). */
export const SUBMISSION_KINDS = ["lead", "contact", "feedback"] as const;
export type SubmissionKind = (typeof SUBMISSION_KINDS)[number];

export const SUBMISSION_KIND_LABELS: Record<SubmissionKind, string> = {
  lead: "Novo projeto",
  contact: "Contato institucional",
  feedback: "Feedback",
};

export const CONTACT_SUBJECTS = {
  parceria: "Parcerias e eventos",
  imprensa: "Imprensa",
  "fazer-parte": "Quero fazer parte da Benjamin",
  duvida: "Dúvidas gerais",
  outro: "Outro assunto",
} as const;
export type ContactSubject = keyof typeof CONTACT_SUBJECTS;

export const FEEDBACK_PROFILES = {
  cliente: "Cliente",
  parceiro: "Parceiro",
  aluno: "Aluno(a)",
  comunidade: "Comunidade FECAP",
  outro: "Outro",
} as const;
export type FeedbackProfile = keyof typeof FEEDBACK_PROFILES;

/** Valor do seletor de serviço quando a pessoa ainda não sabe qual contratar. */
export const UNKNOWN_SERVICE = "nao-sei";

const LIMITS = {
  name: 120,
  company: 120,
  email: 254,
  message: 3000,
  feedback: 2000,
} as const;

const trimmed = (max: number, label: string) =>
  z
    .string({ error: `Informe ${label}.` })
    .trim()
    .max(max, `${label[0].toUpperCase()}${label.slice(1)} deve ter até ${max} caracteres.`);

const optionalText = (max: number, label: string) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    trimmed(max, label).optional(),
  );

const name = trimmed(LIMITS.name, "seu nome").min(2, "Informe seu nome.");
const email = z
  .string({ error: "Informe seu e-mail." })
  .trim()
  .toLowerCase()
  .max(LIMITS.email, "E-mail muito longo.")
  .pipe(z.email("Informe um e-mail válido."));

/** Telefone brasileiro opcional: guarda apenas dígitos (10 a 13, com ou sem DDI 55). */
const phone = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const digits = value.replace(/\D/g, "");
    return digits === "" ? undefined : digits;
  },
  z
    .string()
    .regex(/^(?:55)?\d{10,11}$/, "Informe um telefone com DDD (ex.: 11 91234-5678).")
    .optional(),
);

const checkbox = (message: string) =>
  z.preprocess((value) => value === true || value === "on" || value === "true", z.literal(true, { error: message }));

const optionalCheckbox = z.preprocess((value) => value === true || value === "on" || value === "true", z.boolean());

/**
 * Campos técnicos comuns (não são dados pessoais): idempotência, antispam e origem.
 * `website` é um honeypot — campo invisível que pessoas reais deixam vazio.
 */
export const technicalFieldsSchema = z.object({
  submissionId: z.uuid("Envio inválido. Recarregue a página e tente novamente."),
  website: z.string().max(0, "Envio recusado.").optional().default(""),
  startedAt: z.coerce.number().int().positive().optional(),
  sourcePath: z
    .string()
    .max(200)
    .regex(/^\/[^\s]*$/)
    .optional(),
});

const privacyConsent = checkbox("É preciso declarar ciência do aviso de privacidade.");

export const leadSchema = technicalFieldsSchema.extend({
  name,
  email,
  phone,
  company: optionalText(LIMITS.company, "a empresa"),
  serviceInterest: optionalText(80, "o serviço"),
  projectDescription: trimmed(LIMITS.message, "a descrição do projeto").min(
    20,
    "Conte um pouco mais sobre o projeto (mín. 20 caracteres).",
  ),
  privacyConsent,
});

export const contactSchema = technicalFieldsSchema.extend({
  name,
  email,
  phone,
  subject: z.enum(Object.keys(CONTACT_SUBJECTS) as [ContactSubject, ...ContactSubject[]], {
    error: "Escolha o assunto.",
  }),
  message: trimmed(LIMITS.message, "a mensagem").min(10, "Escreva sua mensagem (mín. 10 caracteres)."),
  privacyConsent,
});

export const feedbackSchema = technicalFieldsSchema
  .extend({
    profile: z.enum(Object.keys(FEEDBACK_PROFILES) as [FeedbackProfile, ...FeedbackProfile[]], {
      error: "Conte quem você é.",
    }),
    rating: z.preprocess(
      (value) => (value === "" || value === undefined || value === null ? undefined : Number(value)),
      z.number().int().min(1).max(5).optional(),
    ),
    message: trimmed(LIMITS.feedback, "o feedback").min(10, "Escreva seu feedback (mín. 10 caracteres)."),
    // Feedback pode ser anônimo: nome e e-mail são opcionais.
    name: optionalText(LIMITS.name, "seu nome"),
    email: z.preprocess((value) => (value === "" ? undefined : value), email.optional()),
    allowContact: optionalCheckbox,
    privacyConsent,
  })
  .refine((data) => !data.allowContact || Boolean(data.email), {
    path: ["email"],
    message: "Informe o e-mail para que possamos responder.",
  });

export type LeadInput = z.infer<typeof leadSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type SubmissionInput =
  | { kind: "lead"; data: LeadInput }
  | { kind: "contact"; data: ContactInput }
  | { kind: "feedback"; data: FeedbackInput };

export const SCHEMAS = { lead: leadSchema, contact: contactSchema, feedback: feedbackSchema } as const;

export type FieldErrors = Record<string, string[]>;

export type ParseResult = { success: true; value: SubmissionInput } | { success: false; fieldErrors: FieldErrors };

/** Converte FormData/objeto em entrada validada do tipo informado. */
export function parseSubmission(kind: SubmissionKind, raw: Record<string, unknown>): ParseResult {
  const result = SCHEMAS[kind].safeParse(raw);
  if (!result.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return { success: false, fieldErrors };
  }
  return { success: true, value: { kind, data: result.data } as SubmissionInput };
}
