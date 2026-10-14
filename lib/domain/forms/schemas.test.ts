/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : schemas.test.ts
 Descrição    : Testes de validação e normalização dos formulários públicos.

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

import { describe, expect, it } from "vitest";
import { parseSubmission } from "./schemas";

const technical = { submissionId: "0b6c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e10", website: "", startedAt: "1760360000000" };

describe("formulário de novo projeto (lead)", () => {
  const valid = {
    ...technical,
    name: "  Maria Souza ",
    email: "Maria@Empresa.com.br",
    phone: "(11) 91234-5678",
    company: "",
    serviceInterest: "audiovisual",
    projectDescription: "Precisamos de um vídeo institucional para o lançamento.",
    privacyConsent: "on",
  };

  it("normaliza nome, e-mail e telefone", () => {
    const result = parseSubmission("lead", valid);
    expect(result.success).toBe(true);
    if (result.success && result.value.kind === "lead") {
      expect(result.value.data).toMatchObject({
        name: "Maria Souza",
        email: "maria@empresa.com.br",
        phone: "11912345678",
        company: undefined,
      });
    }
  });

  it("exige campos obrigatórios com mensagens em português", () => {
    const result = parseSubmission("lead", { ...technical });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(result.fieldErrors)).toEqual(
        expect.arrayContaining(["name", "email", "projectDescription", "privacyConsent"]),
      );
      expect(result.fieldErrors.privacyConsent[0]).toMatch(/aviso de privacidade/);
    }
  });

  it("rejeita telefone sem DDD e e-mail inválido", () => {
    const result = parseSubmission("lead", { ...valid, phone: "1234-5678", email: "maria@" });
    expect(result.success).toBe(false);
    if (!result.success) expect(Object.keys(result.fieldErrors).sort()).toEqual(["email", "phone"]);
  });

  it("recusa envio com honeypot preenchido ou sem submissionId", () => {
    expect(parseSubmission("lead", { ...valid, website: "spam.com" }).success).toBe(false);
    expect(parseSubmission("lead", { ...valid, submissionId: "123" }).success).toBe(false);
  });
});

describe("contato institucional", () => {
  it("valida o assunto a partir da lista fechada", () => {
    const base = { ...technical, name: "João", email: "joao@x.com", message: "Gostaria de propor uma parceria.", privacyConsent: true };
    expect(parseSubmission("contact", { ...base, subject: "parceria" }).success).toBe(true);
    expect(parseSubmission("contact", { ...base, subject: "vendas" }).success).toBe(false);
  });
});

describe("feedback", () => {
  const base = { ...technical, profile: "aluno", message: "Adorei a palestra sobre social media!", privacyConsent: "on" };

  it("aceita feedback anônimo", () => {
    const result = parseSubmission("feedback", base);
    expect(result.success).toBe(true);
    if (result.success && result.value.kind === "feedback") {
      expect(result.value.data.email).toBeUndefined();
      expect(result.value.data.allowContact).toBe(false);
    }
  });

  it("exige e-mail quando a pessoa pede retorno", () => {
    const result = parseSubmission("feedback", { ...base, allowContact: "on" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors.email).toBeDefined();
  });

  it("valida nota de 1 a 5", () => {
    expect(parseSubmission("feedback", { ...base, rating: "5" }).success).toBe(true);
    expect(parseSubmission("feedback", { ...base, rating: "9" }).success).toBe(false);
  });
});
