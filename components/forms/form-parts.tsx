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
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import type { FormActionState } from "@/lib/domain/forms/state";

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
      </Link>
      . <span aria-hidden className="text-benja-laranja">*</span>
    </>
  );
}

/** Mensagem geral de erro (falha de servidor, limite, validação). */
export function FormErrorBanner({ state }: { state: FormActionState }) {
  if (state.status !== "error") return null;
  const isValidation = state.code === "VALIDATION_FAILED";
  return (
    <div data-form-error tabIndex={-1} role="alert" className="rounded-2xl border-2 border-[#9a2e00] bg-[#ffe1d1] p-4 text-sm text-[#5c1b00] outline-none">
      <p className="font-bold">{isValidation ? "Revise os campos destacados." : state.message}</p>
      {!isValidation ? (
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
    <div role="status" className="rounded-3xl border-2 border-benja-noite bg-benja-claro p-8 text-center text-benja-verde shadow-sticker">
      <p className="text-3xl font-black">{title}</p>
      <p className="mt-3 text-benja-noite">
        Protocolo <strong className="font-mono text-lg">{protocol}</strong>. Guarde este número caso precise falar com a
        gente sobre esta mensagem.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-6 rounded-full border-2 border-benja-noite bg-benja-nyanza px-6 py-3 font-bold shadow-sticker"
      >
        Enviar outra mensagem
      </button>
    </div>
  );
}

export function SubmitButton({ pending, ready, children }: { pending: boolean; ready: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending || !ready}
      className="w-full rounded-full border-2 border-benja-noite bg-benja-verde px-6 py-4 text-lg font-bold text-benja-nyanza shadow-sticker transition hover:bg-benja-lima hover:text-benja-verde disabled:cursor-wait disabled:opacity-70 sm:w-auto"
    >
      {pending ? "Enviando…" : children}
    </button>
  );
}
