/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.test.ts
 Descrição    : Testes das Server Actions dos formulários públicos.

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

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/server/errors";
import { getSubmissionDeps } from "@/lib/server/forms/deps";
import { submitContact } from "./actions";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/server/forms/deps", () => ({ getSubmissionDeps: vi.fn() }));

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("submit: armazenamento fora do ar antes de processar (S12)", () => {
  it("devolve o erro com o texto digitado, para o envio sem JavaScript repreencher o formulário", async () => {
    vi.mocked(getSubmissionDeps).mockImplementation(() => {
      throw new AppError("SERVICE_UNAVAILABLE");
    });
    const state = await submitContact(
      { status: "idle" },
      form({ $ACTION_KEY: "k1", name: "Maria", message: "Mensagem digitada", privacyConsent: "on" }),
    );
    expect(state).toMatchObject({
      status: "error",
      code: "SERVICE_UNAVAILABLE",
      values: { name: "Maria", message: "Mensagem digitada" },
    });
    expect(state.status === "error" && state.values).not.toHaveProperty("$ACTION_KEY");
  });
});
