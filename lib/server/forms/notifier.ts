/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : notifier.ts
 Descrição    : Notificadores de envios: log (dev) e Resend com chave de idempotência.

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
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { logger } from "../logger";
import type { Notifier, OutgoingEmail } from "./types";

/** Desenvolvimento/preview: registra apenas metadados, nunca o conteúdo do e-mail. */
export class LogNotifier implements Notifier {
  async send(email: OutgoingEmail) {
    logger.info("forms.notification.logged", {
      idempotencyKey: email.idempotencyKey,
      recipients: email.to.length,
      hasReplyTo: Boolean(email.replyTo),
    });
  }
}

/** Envio via API REST da Resend com chave de idempotência (sem SDK). */
export class ResendNotifier implements Notifier {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(email: OutgoingEmail) {
    const response = await this.fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": email.idempotencyKey,
      },
      body: JSON.stringify({
        from: this.from,
        to: email.to,
        subject: email.subject,
        text: email.text,
        reply_to: email.replyTo,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Resend respondeu ${response.status}`);
    }
  }
}
