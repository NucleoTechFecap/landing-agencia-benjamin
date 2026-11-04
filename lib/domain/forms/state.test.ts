/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : state.test.ts
 Descrição    : Testes da leitura do FormData e do estado de falha de rede.

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

import { describe, expect, it } from "vitest";
import { BROWSER_REQUEST_ID, echoValues, networkFailure, readFormData } from "./state";

describe("readFormData", () => {
  it("descarta os campos que o React acrescenta para a Server Action e os arquivos", () => {
    const formData = new FormData();
    formData.set("$ACTION_REF_1", "");
    formData.set("$ACTION_KEY", "k123");
    formData.set("name", "Maria");
    formData.set("anexo", new File(["x"], "x.txt"));
    expect(readFormData(formData)).toEqual({ name: "Maria" });
  });
});

describe("echoValues", () => {
  it("devolve o que foi digitado, sem honeypot, tempo nem ciência do aviso", () => {
    expect(
      echoValues({ name: "Maria", website: "spam", startedAt: "1", privacyConsent: "on", rating: 5, message: "Oi" }),
    ).toEqual({ name: "Maria", message: "Oi" });
  });
});

describe("networkFailure", () => {
  it("é um erro do navegador, com o texto digitado e sem detalhe técnico", () => {
    const state = networkFailure({ message: "Texto longo", website: "" });
    expect(state).toMatchObject({
      status: "error",
      code: "NETWORK_ERROR",
      requestId: BROWSER_REQUEST_ID,
      values: { message: "Texto longo" },
    });
    expect(state.status === "error" && state.message).toMatch(/o que você digitou continua aqui/);
  });
});
