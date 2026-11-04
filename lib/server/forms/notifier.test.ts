/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : notifier.test.ts
 Descrição    : Testes dos notificadores: chamada à Resend, erros e metadados de log.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogNotifier, ResendNotifier } from "./notifier";
import type { OutgoingEmail } from "./types";

const API_KEY = "chave-ficticia-de-teste";
const FROM = "Site <site@benjamin.test>";

const email: OutgoingEmail = {
  to: ["comercial@benjamin.test", "coordenacao@benjamin.test"],
  subject: "Novo pedido",
  text: "Corpo da mensagem",
  replyTo: "maria@empresa.test",
  idempotencyKey: "submission-0b6c2f0e",
};

const fakeFetch = (status = 200) => vi.fn<typeof fetch>(async () => new Response("{}", { status }));

/** URL e opções da única chamada feita ao `fetch` falso. */
function onlyCall(fetchImpl: ReturnType<typeof fakeFetch>) {
  expect(fetchImpl).toHaveBeenCalledTimes(1);
  const [url, init] = fetchImpl.mock.calls[0];
  return { url, init: init!, headers: init!.headers as Record<string, string>, body: JSON.parse(String(init!.body)) };
}

describe("ResendNotifier", () => {
  it("faz POST na API da Resend, com autorização e chave de idempotência", async () => {
    const fetchImpl = fakeFetch();
    await new ResendNotifier(API_KEY, FROM, fetchImpl).send(email);

    const { url, init, headers } = onlyCall(fetchImpl);
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    expect(headers).toEqual({
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "Idempotency-Key": "submission-0b6c2f0e",
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("manda remetente, destinatários, assunto, texto e reply_to", async () => {
    const fetchImpl = fakeFetch();
    await new ResendNotifier(API_KEY, FROM, fetchImpl).send(email);

    expect(onlyCall(fetchImpl).body).toEqual({
      from: FROM,
      to: ["comercial@benjamin.test", "coordenacao@benjamin.test"],
      subject: "Novo pedido",
      text: "Corpo da mensagem",
      reply_to: "maria@empresa.test",
    });
  });

  it("sem e-mail de resposta (feedback anônimo), reply_to fica de fora", async () => {
    const fetchImpl = fakeFetch();
    await new ResendNotifier(API_KEY, FROM, fetchImpl).send({ ...email, replyTo: undefined });

    expect(onlyCall(fetchImpl).body).not.toHaveProperty("reply_to");
  });

  it.each([200, 201, 204])("resposta %i é sucesso", async (status) => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response(status === 204 ? null : "{}", { status }));
    await expect(new ResendNotifier(API_KEY, FROM, fetchImpl).send(email)).resolves.toBeUndefined();
  });

  it.each([400, 401, 403, 422, 429, 500, 502, 503])("resposta %i vira exceção com o status", async (status) => {
    await expect(new ResendNotifier(API_KEY, FROM, fakeFetch(status)).send(email)).rejects.toThrow(
      `Resend respondeu ${status}`,
    );
  });

  it("a mensagem de erro, que vai para o banco e o log, não leva chave nem conteúdo", async () => {
    const error = await new ResendNotifier(API_KEY, FROM, fakeFetch(500)).send(email).catch((caught: Error) => caught);
    expect(String(error)).not.toContain(API_KEY);
    expect(String(error)).not.toContain("maria@empresa.test");
    expect(String(error)).not.toContain("Corpo da mensagem");
  });

  it("falha de rede sobe para quem chamou, que a registra para o reenvio", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(new ResendNotifier(API_KEY, FROM, fetchImpl).send(email)).rejects.toThrow("fetch failed");
  });
});

describe("LogNotifier", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.clearAllMocks();
  });

  it("registra só metadados, nunca o conteúdo nem os endereços", async () => {
    await new LogNotifier().send(email);

    const line = String(vi.mocked(console.log).mock.calls[0][0]);
    expect(JSON.parse(line)).toMatchObject({
      event: "forms.notification.logged",
      idempotencyKey: "submission-0b6c2f0e",
      recipients: 2,
      hasReplyTo: true,
    });
    for (const secret of ["maria@empresa.test", "comercial@benjamin.test", "Corpo da mensagem", "Novo pedido"]) {
      expect(line).not.toContain(secret);
    }
  });
});
