/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : use-submission.ts
 Descrição    : Hook comum dos formulários: estado, identificador de envio e foco no erro.

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

import { useActionState, useEffect, useRef, useState } from "react";
import { INITIAL_FORM_STATE, type FormActionState } from "@/lib/domain/forms/state";

export type FormAction = (state: FormActionState, formData: FormData) => Promise<FormActionState>;

/**
 * Estado comum dos formulários públicos:
 * - `submissionId` e `startedAt` gerados só no navegador, após a montagem (o HTML
 *   prerenderizado não pode carregar um identificador compartilhado entre visitantes);
 * - o mesmo `submissionId` é reutilizado em novas tentativas após erro (idempotência);
 * - foco vai para o primeiro campo inválido ou para a mensagem de erro geral.
 */
export function useSubmission(action: FormAction) {
  const [state, formAction, pending] = useActionState(action, INITIAL_FORM_STATE);
  const [meta, setMeta] = useState({ submissionId: "", startedAt: "", sourcePath: "" });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Valores dependentes do navegador: só existem depois da hidratação.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMeta({ submissionId: crypto.randomUUID(), startedAt: String(Date.now()), sourcePath: window.location.pathname });
  }, []);

  useEffect(() => {
    if (state.status !== "error") return;
    const firstInvalid = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    (firstInvalid ?? formRef.current?.querySelector<HTMLElement>("[data-form-error]"))?.focus();
  }, [state]);

  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const values = state.status === "error" ? state.values ?? {} : {};
  return { state, formAction, pending, meta, formRef, errors, values };
}
