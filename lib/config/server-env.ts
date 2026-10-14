/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : server-env.ts
 Descrição    : Valida as variáveis de servidor por estágio, sem expô-las ao cliente.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ARC-05).
 13/10/2026 Vinícius Nishimura Reis  Segredo do endpoint de invalidação de cache (TECH-09).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { z } from "zod";
import { siteEnvironment, type SiteEnvironment } from "./public-env";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const emailList = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() !== ""
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [],
  z.array(z.email("Destinatário inválido.")),
);

export const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  SUBMISSION_HASH_SECRET: z.preprocess(emptyToUndefined, z.string().min(32, "Use ao menos 32 caracteres.").optional()),
  NOTIFY_PROVIDER: z.preprocess(emptyToUndefined, z.enum(["log", "resend"]).default("log")),
  RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().startsWith("re_").optional()),
  NOTIFICATION_FROM: z.preprocess(emptyToUndefined, z.string().min(3).optional()),
  LEAD_NOTIFICATION_TO: emailList,
  CONTACT_NOTIFICATION_TO: emailList,
  FEEDBACK_NOTIFICATION_TO: emailList,
  LOG_LEVEL: z.preprocess(emptyToUndefined, z.enum(["debug", "info", "warn", "error"]).default("info")),
  // Segredo do endpoint de invalidação de cache chamado por webhook/rotina (TECH-09).
  CONTENT_REVALIDATE_SECRET: z.preprocess(emptyToUndefined, z.string().min(32, "Use ao menos 32 caracteres.").optional()),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Valida as variáveis de servidor. Em produção/homologação os itens necessários ao
 * funcionamento dos formulários são obrigatórios; em desenvolvimento ficam opcionais
 * e a funcionalidade correspondente opera em modo degradado (ex.: notificação em log).
 */
export function parseServerEnv(raw: Record<string, string | undefined>, environment: SiteEnvironment): ServerEnv {
  const result = serverEnvSchema.safeParse(raw);
  const problems = result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);

  if (result.success && (environment === "production" || environment === "homologation")) {
    const env = result.data;
    if (!env.SUBMISSION_HASH_SECRET) problems.push("SUBMISSION_HASH_SECRET: obrigatória fora do desenvolvimento.");
    if (env.NOTIFY_PROVIDER !== "resend") problems.push("NOTIFY_PROVIDER: use \"resend\" fora do desenvolvimento.");
    if (env.NOTIFY_PROVIDER === "resend" && !env.RESEND_API_KEY) problems.push("RESEND_API_KEY: obrigatória com Resend.");
    if (!env.NOTIFICATION_FROM) problems.push("NOTIFICATION_FROM: obrigatória fora do desenvolvimento.");
    if (env.LEAD_NOTIFICATION_TO.length === 0) problems.push("LEAD_NOTIFICATION_TO: informe ao menos um destinatário.");
  }

  if (problems.length > 0) {
    throw new Error(`Variáveis de ambiente de servidor inválidas:\n- ${problems.join("\n- ")}`);
  }
  return (result as { data: ServerEnv }).data;
}

let cached: ServerEnv | undefined;

/** Lê e valida as variáveis de servidor uma única vez por processo. */
export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env, siteEnvironment);
  return cached;
}
