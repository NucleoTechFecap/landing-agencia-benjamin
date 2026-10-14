/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : env.test.ts
 Descrição    : Testes da validação de variáveis de ambiente públicas e de servidor.

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
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "./public-env";
import { parseServerEnv } from "./server-env";

describe("parsePublicEnv", () => {
  it("aceita ambiente de desenvolvimento sem Supabase", () => {
    const env = parsePublicEnv({ NEXT_PUBLIC_SITE_ENV: "development" });
    expect(env.NEXT_PUBLIC_SITE_ENV).toBe("development");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBeUndefined();
  });

  it("usa development como padrão e trata string vazia como ausente", () => {
    const env = parsePublicEnv({ NEXT_PUBLIC_SITE_ENV: "", NEXT_PUBLIC_SITE_URL: "" });
    expect(env.NEXT_PUBLIC_SITE_ENV).toBe("development");
  });

  it("exige URL do site em produção", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SITE_ENV: "production" })).toThrow(/NEXT_PUBLIC_SITE_URL/);
  });

  it("exige URL e chave do Supabase juntas", () => {
    expect(() =>
      parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("rejeita ambiente desconhecido", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SITE_ENV: "staging" })).toThrow();
  });
});

describe("parseServerEnv", () => {
  const productionBase = {
    SUBMISSION_HASH_SECRET: "x".repeat(40),
    NOTIFY_PROVIDER: "resend",
    RESEND_API_KEY: "re_123456789",
    NOTIFICATION_FROM: "Agência Benjamin <nao-responda@exemplo.com.br>",
    LEAD_NOTIFICATION_TO: "comercial@exemplo.com.br, coordenacao@exemplo.com.br",
  };

  it("aplica padrões em desenvolvimento", () => {
    const env = parseServerEnv({}, "development");
    expect(env.NOTIFY_PROVIDER).toBe("log");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.LEAD_NOTIFICATION_TO).toEqual([]);
  });

  it("separa destinatários por vírgula", () => {
    const env = parseServerEnv(productionBase, "production");
    expect(env.LEAD_NOTIFICATION_TO).toEqual(["comercial@exemplo.com.br", "coordenacao@exemplo.com.br"]);
  });

  it("exige segredo, Resend e destinatário em produção", () => {
    expect(() => parseServerEnv({}, "production")).toThrow(/SUBMISSION_HASH_SECRET/);
    expect(() => parseServerEnv({ ...productionBase, LEAD_NOTIFICATION_TO: "" }, "production")).toThrow(
      /LEAD_NOTIFICATION_TO/,
    );
    expect(() => parseServerEnv({ ...productionBase, NOTIFY_PROVIDER: "log" }, "homologation")).toThrow(
      /NOTIFY_PROVIDER/,
    );
  });

  it("rejeita destinatário com e-mail inválido", () => {
    expect(() => parseServerEnv({ LEAD_NOTIFICATION_TO: "nao-e-email" }, "development")).toThrow();
  });

  it("rejeita segredo curto", () => {
    expect(() => parseServerEnv({ SUBMISSION_HASH_SECRET: "curto" }, "development")).toThrow(/32/);
  });
});
