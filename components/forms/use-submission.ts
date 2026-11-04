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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 04/11/2026 Vinícius Nishimura Reis  Envio nativo vai à página estática do formulário (FORM-08).
 04/11/2026 Vinícius Nishimura Reis  Falha de rede vira aviso no formulário, sem derrubar a página (FORM-08).
 04/11/2026 Vinícius Nishimura Reis  Valida no navegador antes do POST, com o esquema do servidor (FORM-04).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { type FormEvent, useActionState, useEffect, useRef, useState, useTransition } from "react";
import { browserValidationError } from "@/lib/domain/forms/browser-validation";
import type { SubmissionKind } from "@/lib/domain/forms/schemas";
import { INITIAL_FORM_STATE, networkFailure, readFormData, type FormActionState } from "@/lib/domain/forms/state";

export type FormAction = (state: FormActionState, formData: FormData) => Promise<FormActionState>;

/**
 * Estado comum dos formulários públicos:
 * - `submissionId` e `startedAt` gerados só no navegador, após a montagem (o HTML
 *   prerenderizado não pode carregar um identificador compartilhado entre visitantes);
 * - o mesmo `submissionId` é reutilizado em novas tentativas após erro (idempotência);
 * - foco vai para o primeiro campo inválido ou para a mensagem de erro geral.
 *
 * São dois caminhos de envio (FORM-08):
 * - Sem JavaScript, ou antes da hidratação, o navegador faz o POST sozinho, com os campos `$ACTION_*` que o
 *   `useActionState` põe no HTML. Por isso ele recebe a Server Action pura: uma função em volta dela apagaria
 *   esses campos. `permalink` é a página estática do formulário: com Partial Prerendering o Next renderiza a
 *   resposta do POST por `resume`, que não recebe o estado da action, e em /contato o resultado sumiria.
 * - Hidratado, o `onSubmit` assume: valida com o esquema do servidor, que segue sendo a regra efetiva, e chama
 *   a action dentro de `try/catch`. No `useActionState`, a rejeição de rede subiria para o `error.tsx` e levaria
 *   junto o texto digitado.
 */
export function useSubmission(kind: SubmissionKind, action: FormAction, permalink?: string) {
  const [postback, formAction] = useActionState(action, INITIAL_FORM_STATE, permalink);
  const [result, setResult] = useState<FormActionState | null>(null);
  const [pending, startSending] = useTransition();
  const state = result ?? postback;
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
    // Grupo de opções (perfil do feedback): o foco vai para a primeira opção.
    const target = firstInvalid?.matches("fieldset") ? firstInvalid.querySelector<HTMLElement>("input") : firstInvalid;
    (target ?? formRef.current?.querySelector<HTMLElement>("[data-form-error]"))?.focus();
  }, [state]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const formData = new FormData(event.currentTarget);
    const invalid = browserValidationError(kind, readFormData(formData));
    if (invalid) {
      setResult(invalid);
      return;
    }
    startSending(async () => {
      const outcome = await sendSafely(action, formData);
      startSending(() => setResult(outcome));
    });
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};
  return { state, formAction, onSubmit, pending, meta, formRef, errors, values };
}

async function sendSafely(action: FormAction, formData: FormData): Promise<FormActionState> {
  try {
    return await action(INITIAL_FORM_STATE, formData);
  } catch {
    return networkFailure(readFormData(formData));
  }
}
