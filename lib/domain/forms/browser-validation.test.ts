/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : browser-validation.test.ts
 Descrição    : Testes da validação no navegador.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { browserValidationError } from "./browser-validation";
import { BROWSER_REQUEST_ID } from "./state";

const technical = {
  submissionId: "0b6c2f0e-6f1d-4c8a-9a51-3d2f9f1b7e10",
  website: "",
  startedAt: "1760360000000",
  sourcePath: "/contato",
};
const contact = {
  ...technical,
  name: "João",
  email: "joao@x.com",
  subject: "duvida",
  message: "Gostaria de falar com a agência.",
  privacyConsent: "on",
};

describe("browserValidationError", () => {
  it("envio válido segue para o servidor", () => {
    expect(browserValidationError("contact", contact)).toBeNull();
  });

  it("campo inválido devolve o mesmo erro do servidor, com o texto digitado", () => {
    expect(browserValidationError("contact", { ...contact, email: "joao@" })).toEqual({
      status: "error",
      code: "VALIDATION_FAILED",
      message: "Revise os campos destacados.",
      requestId: BROWSER_REQUEST_ID,
      fieldErrors: { email: ["Informe um e-mail válido."] },
      values: expect.objectContaining({ email: "joao@", message: contact.message }),
    });
  });

  it("feedback: pedir retorno sem e-mail é erro no campo de e-mail", () => {
    const state = browserValidationError("feedback", {
      ...technical,
      profile: "aluno",
      message: "Adorei a palestra sobre social media!",
      allowContact: "on",
      privacyConsent: "on",
    });
    expect(state).toMatchObject({ fieldErrors: { email: ["Informe o e-mail para que possamos responder."] } });
  });

  it("erro só em campo técnico não trava o visitante: quem decide é o servidor", () => {
    expect(browserValidationError("contact", { ...contact, submissionId: "" })).toBeNull();
    expect(browserValidationError("contact", { ...contact, sourcePath: "sem-barra" })).toBeNull();
  });

  it("campo técnico inválido não aparece junto dos erros do visitante", () => {
    const state = browserValidationError("contact", { ...contact, submissionId: "", email: "joao@" });
    expect(state).toMatchObject({ code: "VALIDATION_FAILED" });
    expect(state?.status === "error" && Object.keys(state.fieldErrors ?? {})).toEqual(["email"]);
  });

  it("honeypot preenchido segue para o servidor mesmo com outros erros: o robô não recebe pista", () => {
    expect(browserValidationError("contact", { ...contact, website: "spam.com", email: "joao@" })).toBeNull();
  });
});
