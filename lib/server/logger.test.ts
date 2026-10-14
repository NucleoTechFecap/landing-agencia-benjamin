/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : logger.test.ts
 Descrição    : Testes de mascaramento de dados sensíveis e formato dos logs.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ARC-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterEach, describe, expect, it, vi } from "vitest";
import { REDACTED, isSensitiveKey, logger, redact, safePath, scrubString } from "./logger";

describe("redact", () => {
  it("mascara chaves sensíveis em qualquer profundidade", () => {
    const result = redact({
      requestId: "req-1",
      lead: { name: "Maria", email: "maria@exemplo.com", phone: "11 91234-5678", serviceSlug: "audiovisual" },
      auth: { password: "123", accessToken: "abc", Authorization: "Bearer x" },
    }) as Record<string, Record<string, unknown>>;
    expect(result.requestId).toBe("req-1");
    expect(result.lead).toEqual({ name: REDACTED, email: REDACTED, phone: REDACTED, serviceSlug: "audiovisual" });
    expect(Object.values(result.auth).every((value) => value === REDACTED)).toBe(true);
  });

  it("mascara e-mail, telefone e tokens dentro de textos livres", () => {
    expect(scrubString("contato de joao@empresa.com.br pelo (11) 98765-4321")).toBe("contato de [email] pelo [telefone]");
    expect(scrubString("header Bearer abc.def")).toBe(`header Bearer ${REDACTED}`);
    expect(scrubString("jwt eyJhbGciOi.eyJzdWIi.c2lnbmF0dXJl")).toBe(`jwt ${REDACTED}`);
  });

  it("serializa erros sem perder código e sem PII na mensagem", () => {
    const error = Object.assign(new Error("falha ao enviar para ana@x.com"), { code: "E_SMTP" });
    const result = redact({ error }) as { error: Record<string, unknown> };
    expect(result.error).toMatchObject({ name: "Error", code: "E_SMTP", message: "falha ao enviar para [email]" });
  });

  it("não confunde chaves curtas com sufixos", () => {
    expect(isSensitiveKey("ip")).toBe(true);
    expect(isSensitiveKey("relationship")).toBe(false);
    expect(isSensitiveKey("clientName")).toBe(true);
    expect(isSensitiveKey("contact_email")).toBe(true);
  });

  it("remove query string de caminhos", () => {
    expect(safePath("/contato?email=a@b.com")).toBe("/contato");
  });
});

describe("logger", () => {
  afterEach(() => vi.restoreAllMocks());

  it("escreve JSON estruturado com evento, nível e ambiente", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logger.info("forms.submission.persisted", { requestId: "r1", email: "x@y.com" });
    const entry = JSON.parse(spy.mock.calls[0][0] as string);
    expect(entry).toMatchObject({ level: "info", event: "forms.submission.persisted", requestId: "r1", email: REDACTED });
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("respeita o nível mínimo configurado", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.stubEnv("LOG_LEVEL", "warn");
    logger.info("ignorado");
    expect(spy).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
