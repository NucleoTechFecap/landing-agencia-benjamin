/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : deps.ts
 Descrição    : Monta as dependências do serviço de envios a partir das variáveis de ambiente.

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
 13/10/2026 Vinícius Nishimura Reis  Armazenamento Supabase e aviso único de segredo efêmero (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { siteEnvironment, siteUrl } from "@/lib/config/public-env";
import { getServerEnv } from "@/lib/config/server-env";
import { listServices } from "../content/repository";
import { AppError } from "../errors";
import { logger } from "../logger";
import { getServiceClient } from "../supabase/admin";
import { MemorySubmissionStore } from "./memory-store";
import { LogNotifier, ResendNotifier } from "./notifier";
import type { SubmissionDeps } from "./submission-service";
import { SupabaseSubmissionStore } from "./supabase-store";
import type { SubmissionStore } from "./types";

let devSecret: string | undefined;
let memoryStore: MemorySubmissionStore | undefined;
let storeOverride: (() => SubmissionStore | null) | undefined;

/**
 * Permite que a camada de dados registre o armazenamento persistente (Supabase)
 * sem que este módulo dependa dele diretamente (ADR-0003).
 */
export function registerSubmissionStore(factory: () => SubmissionStore | null) {
  storeOverride = factory;
}

function resolveStore(): SubmissionStore {
  const persistent = storeOverride?.();
  if (persistent) return persistent;
  const serviceClient = getServiceClient();
  if (serviceClient) return new SupabaseSubmissionStore(serviceClient);
  if (siteEnvironment === "production" || siteEnvironment === "homologation") {
    // Nunca aceitar leads em memória em ambiente real: seriam perdidos (RN-04).
    throw new AppError("SERVICE_UNAVAILABLE", { internal: { reason: "submission_store_not_configured" } });
  }
  memoryStore ??= new MemorySubmissionStore();
  return memoryStore;
}

function hmacFactory(secret: string | undefined) {
  if (!secret && !devSecret) {
    devSecret = randomBytes(32).toString("hex");
    logger.warn("forms.hash_secret.ephemeral", { reason: "SUBMISSION_HASH_SECRET ausente em desenvolvimento" });
  }
  const key = secret ?? devSecret!;
  return (value: string) => createHmac("sha256", key).update(value).digest("hex");
}

/** Monta as dependências do serviço de envios a partir do ambiente (ARC-05). */
export function getSubmissionDeps(): SubmissionDeps {
  const env = getServerEnv();
  const notifier =
    env.NOTIFY_PROVIDER === "resend" && env.RESEND_API_KEY && env.NOTIFICATION_FROM
      ? new ResendNotifier(env.RESEND_API_KEY, env.NOTIFICATION_FROM)
      : new LogNotifier();

  return {
    store: resolveStore(),
    notifier,
    recipients: {
      LEAD_NOTIFICATION_TO: env.LEAD_NOTIFICATION_TO,
      CONTACT_NOTIFICATION_TO: env.CONTACT_NOTIFICATION_TO,
      FEEDBACK_NOTIFICATION_TO: env.FEEDBACK_NOTIFICATION_TO,
    },
    hmac: hmacFactory(env.SUBMISSION_HASH_SECRET),
    now: () => new Date(),
    siteUrl,
    serviceName: async (slug) => (await listServices()).find((service) => service.slug === slug)?.name,
  };
}
