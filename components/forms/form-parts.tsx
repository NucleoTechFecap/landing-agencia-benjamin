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
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { buttonClasses } from "@/components/ui/button-link";
import type { ResolvedPage } from "@/lib/domain/content/catalog";
import type { FORMULARIOS } from "@/lib/domain/content/catalog/formularios";
import { BROWSER_REQUEST_ID, type FormActionState } from "@/lib/domain/forms/state";

/** Textos comuns aos formulários. Vêm da página, que é componente de servidor: aqui só chega o valor. */
export type TextosComuns = ResolvedPage<typeof FORMULARIOS>["comum"];

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

export function PrivacyConsentText({ textos }: { textos: TextosComuns }) {
  return (
    <>
      {textos.consentimento}{" "}
      <Link
        href={textos.consentimentoLink.href}
        className="font-bold text-benja-verde underline underline-offset-4"
        target="_blank"
      >
        {textos.consentimentoLink.label}
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
export function FormErrorBanner({ state, textos }: { state: FormActionState; textos: TextosComuns }) {
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
      <p className="font-bold">{isValidation ? textos.revise : state.message}</p>
      {!isValidation && state.requestId !== BROWSER_REQUEST_ID ? (
        <p className="mt-1">
          {textos.codigo} <code className="font-mono">{state.requestId.slice(0, 8)}</code>
        </p>
      ) : null}
    </div>
  );
}

/** Confirmação de recebimento com protocolo (TECH-06 §5). */
export function FormSuccess({
  protocol,
  title,
  onReset,
  textos,
}: {
  protocol: string;
  title: string;
  onReset: () => void;
  textos: TextosComuns;
}) {
  // O número aparece mesmo se a marca {protocolo} sair do texto: sem ele, a pessoa perde a referência.
  const [antes, depois = ""] = textos.protocolo.split("{protocolo}");
  return (
    <div
      role="status"
      data-nudge
      className="rounded-3xl border-2 border-benja-noite bg-benja-claro p-8 text-center text-benja-verde shadow-sticker"
    >
      <p className="text-3xl font-black">{title}</p>
      <p className="mt-3 text-benja-noite">
        {antes}
        <strong className="font-mono text-lg">{protocol}</strong>
        {depois}
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
        {textos.enviarOutra}
      </a>
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
  textos,
}: {
  pending: boolean;
  children: string;
  textos: TextosComuns;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="w-full rounded-full border-2 border-benja-noite bg-benja-verde px-6 py-4 text-lg font-bold text-benja-nyanza shadow-sticker transition hover:bg-benja-lima hover:text-benja-verde disabled:cursor-wait disabled:opacity-70 sm:w-auto"
    >
      {pending ? textos.enviando : children}
    </button>
  );
}
