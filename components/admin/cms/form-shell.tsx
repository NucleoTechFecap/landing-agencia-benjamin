/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : form-shell.tsx
 Descrição    : Estrutura comum dos formulários do CMS: estado, campos ocultos de versão e botão salvar.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useActionState, type ReactNode } from "react";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import { CmsFormError } from "./form-error";

export type CmsSaveAction = (state: CmsFormState, formData: FormData) => Promise<CmsFormState>;

export interface FieldHelpers {
  /** Erros do campo vindos do servidor. */
  errors: (name: string) => string[] | undefined;
  /** Valor digitado (após erro) ou o valor salvo. */
  value: (name: string, saved?: string) => string | undefined;
}

/**
 * Formulário de edição do CMS. Guarda id e versão (`updated_at`) em campos ocultos para a
 * concorrência otimista e repreenche o que foi digitado quando o servidor recusa o envio.
 * `readOnly` desabilita tudo (papel sem edição ou item arquivado).
 */
export function CmsFormShell({
  action,
  item,
  readOnly,
  submitLabel,
  children,
}: {
  action: CmsSaveAction;
  item?: { id: string; updatedAt: string };
  readOnly?: boolean;
  submitLabel: string;
  children: (fields: FieldHelpers) => ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, CMS_IDLE);
  const typed = state.status === "error" ? state.values : undefined;
  const fields: FieldHelpers = {
    errors: (name) => (state.status === "error" ? state.fieldErrors?.[name] : undefined),
    value: (name, saved) => typed?.[name] ?? saved,
  };
  return (
    <form action={formAction} noValidate className="space-y-6">
      <CmsFormError state={state} />
      {item ? (
        <>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="expectedUpdatedAt" value={item.updatedAt} />
        </>
      ) : null}
      <fieldset disabled={readOnly || pending} className="space-y-5 disabled:opacity-80">
        {children(fields)}
      </fieldset>
      {readOnly ? null : (
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-benja-verde px-6 py-3 font-bold text-benja-nyanza transition hover:bg-benja-noite disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Salvando…" : submitLabel}
        </button>
      )}
    </form>
  );
}
