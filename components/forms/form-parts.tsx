/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : form-parts.tsx
 Descrição    : Partes comuns dos formulários: campos técnicos, erro, sucesso e botão.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 25/10/2026 Caio Moraes              Cores de erro via tokens do tema (LAY-04).
 29/10/2026 Caio Moraes              Botão "Enviar outra mensagem" com o estilo padrão (INT-01).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 03/11/2026 Julia                    Asterisco com contraste e aviso de nova aba no link (SEG-07).
 04/11/2026 Vinícius Nishimura Reis  Envio antes da hidratação: botão disponível e "Enviar outra" como link (FORM-08).
 04/11/2026 Vinícius Nishimura Reis  Falha de rede sem código de atendimento: não há log a consultar (FORM-08).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/button-link";
import { BROWSER_REQUEST_ID, type FormActionState } from "@/lib/domain/forms/state";

/** Campos técnicos ocultos: idempotência, tempo de preenchimento e página de origem. */
export function TechnicalFields({ meta }: { meta: { submissionId: string; startedAt: string; sourcePath: string } }) {
  return (
    <>
      <input type="hidden" name="submissionId" value={meta.submissionId} />
      <input type="hidden" name="startedAt" value={meta.startedAt} />
      <input type="hidden" name="sourcePath" value={meta.sourcePath} />
    </>
  );
}

export function PrivacyConsentText() {
  return (
    <>
      Li e estou ciente do{" "}
      <Link href="/privacidade" className="font-bold text-benja-verde underline underline-offset-4" target="_blank">
        aviso de privacidade
        <span className="sr-only"> (abre em nova aba)</span>
      </Link>
      .{" "}
      <span aria-hidden className="text-benja-erro">
        *
      </span>
    </>
  );
}

/** Mensagem geral de erro (falha de servidor, limite, validação). */
export function FormErrorBanner({ state }: { state: FormActionState }) {
  if (state.status !== "error") return null;
  const isValidation = state.code === "VALIDATION_FAILED";
  return (
    <div
      data-form-error
      data-nudge
      tabIndex={-1}
      role="alert"
      className="rounded-2xl border-2 border-benja-erro bg-benja-erro-fundo p-4 text-sm text-benja-erro-texto outline-none"
    >
      <p className="font-bold">{isValidation ? "Revise os campos destacados." : state.message}</p>
      {!isValidation && state.requestId !== BROWSER_REQUEST_ID ? (
        <p className="mt-1">
          Código de atendimento: <code className="font-mono">{state.requestId.slice(0, 8)}</code>
        </p>
      ) : null}
    </div>
  );
}

/** Confirmação de recebimento com protocolo (TECH-06 §5). */
export function FormSuccess({ protocol, title, onReset }: { protocol: string; title: string; onReset: () => void }) {
  return (
    <div
      role="status"
      data-nudge
      className="rounded-3xl border-2 border-benja-noite bg-benja-claro p-8 text-center text-benja-verde shadow-sticker"
    >
      <p className="text-3xl font-black">{title}</p>
      <p className="mt-3 text-benja-noite">
        Protocolo <strong className="font-mono text-lg">{protocol}</strong>. Guarde este número caso precise falar com a
        gente sobre esta mensagem.
      </p>
      {/* Link para a própria página: sem JavaScript ele recarrega o formulário em branco. */}
      <a
        href=""
        onClick={(event) => {
          event.preventDefault();
          onReset();
        }}
        className={buttonClasses("secondary", "mt-6")}
      >
        Enviar outra mensagem
      </a>
    </div>
  );
}

export function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="w-full rounded-full border-2 border-benja-noite bg-benja-verde px-6 py-4 text-lg font-bold text-benja-nyanza shadow-sticker transition hover:bg-benja-lima hover:text-benja-verde disabled:cursor-wait disabled:opacity-70 sm:w-auto"
    >
      {pending ? "Enviando…" : children}
    </button>
  );
}
