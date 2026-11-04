/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : deps.test.ts
 Descrição    : Testes da escolha do armazenamento dos envios por ambiente.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-08).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../errors";
import { getSubmissionDeps } from "./deps";
import { MemorySubmissionStore } from "./memory-store";
import { SupabaseSubmissionStore } from "./supabase-store";

const site = vi.hoisted(() => ({ environment: "development", serviceClient: null as object | null }));

vi.mock("@/lib/config/public-env", () => ({
  siteUrl: "https://benjamin.test",
  get siteEnvironment() {
    return site.environment;
  },
}));
vi.mock("@/lib/config/server-env", () => ({
  getServerEnv: () => ({
    NOTIFY_PROVIDER: "log",
    SUBMISSION_HASH_SECRET: "segredo-de-teste-com-mais-de-32-caracteres",
    LEAD_NOTIFICATION_TO: [],
    CONTACT_NOTIFICATION_TO: [],
    FEEDBACK_NOTIFICATION_TO: [],
  }),
}));
vi.mock("../supabase/admin", () => ({ getServiceClient: () => site.serviceClient }));
vi.mock("../content/repository", () => ({ listServices: async () => [] }));

function storeFailure() {
  try {
    getSubmissionDeps();
  } catch (error) {
    return error;
  }
  return null;
}

beforeEach(() => {
  site.environment = "development";
  site.serviceClient = null;
  vi.stubEnv("VERCEL_ENV", undefined);
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getSubmissionDeps: envio sem armazenamento persistente (S12, RN-04)", () => {
  it.each(["development", "preview"])(
    "Production da Vercel com ambiente do site em %s: recusa, em vez de guardar em memória",
    (environment) => {
      site.environment = environment;
      vi.stubEnv("VERCEL_ENV", "production");

      const failure = storeFailure();
      expect(failure).toBeInstanceOf(AppError);
      expect(failure).toMatchObject({
        code: "SERVICE_UNAVAILABLE",
        internal: { reason: "submission_store_not_configured" },
      });
    },
  );

  it.each(["production", "homologation"])("ambiente do site em %s: recusa em qualquer hospedagem", (environment) => {
    site.environment = environment;
    expect(storeFailure()).toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(storeFailure()).toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });

  it("preview da Vercel continua em memória", () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(getSubmissionDeps().store).toBeInstanceOf(MemorySubmissionStore);
  });

  it("desenvolvimento, build e E2E locais, sem VERCEL_ENV, continuam em memória", () => {
    expect(getSubmissionDeps().store).toBeInstanceOf(MemorySubmissionStore);
  });

  it("com o Supabase configurado, Production da Vercel usa o armazenamento persistente", () => {
    site.serviceClient = {};
    vi.stubEnv("VERCEL_ENV", "production");
    expect(getSubmissionDeps().store).toBeInstanceOf(SupabaseSubmissionStore);
  });
});
