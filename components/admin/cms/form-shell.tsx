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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Campos remontados após erro preservam seleções (ADM-08).
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import { UnsavedGuard } from "../ui/unsaved-guard";
import { CmsFormError } from "./form-error";

export type CmsSaveAction = (state: CmsFormState, formData: FormData) => Promise<CmsFormState>;

export interface FieldHelpers {
  /** Erros do campo vindos do servidor. */
  errors: (name: string) => string[] | undefined;
  /** Valor digitado (após erro) ou o valor salvo. */
  value: (name: string, saved?: string) => string | undefined;
  /** Algum campo com este nome, ou dentro dele, voltou com erro? */
  hasErrors: (name: string) => boolean;
  /** Valores digitados de um campo repetido, se houve erro. */
  values: (name: string) => string[] | undefined;
  /** Quantas linhas de uma lista foram enviadas, se houve erro. */
  count: (name: string) => number | undefined;
  /** Mudança que o formulário não percebe sozinho: botão que remonta um campo ou mexe numa lista. */
  markEdited: () => void;
}

interface CmsFormShellProps {
  action: CmsSaveAction;
  item?: { id: string; updatedAt: string };
  readOnly?: boolean;
  submitLabel: string;
  /** Para onde "Cancelar" leva. Com alteração pendente, o aviso de saída pergunta antes. */
  cancelHref?: string;
  children: (fields: FieldHelpers) => ReactNode;
}

/**
 * Formulário de edição do CMS. Guarda id e versão (`updated_at`) em campos ocultos para a
 * concorrência otimista e repreenche o que foi digitado quando o servidor recusa o envio.
 * `readOnly` desabilita tudo (papel sem edição ou item arquivado). Cada versão salva remonta o
 * formulário: o aviso de alteração pendente e o erro da tentativa anterior não sobrevivem ao sucesso.
 */
export function CmsFormShell(props: CmsFormShellProps) {
  return <FormBody key={props.item?.updatedAt ?? "novo"} {...props} />;
}

function FormBody({ action, item, readOnly, submitLabel, cancelHref, children }: CmsFormShellProps) {
  const [state, formAction, pending] = useActionState(action, CMS_IDLE);
  const [edited, setEdited] = useState(false);
  const typed = state.status === "error" ? state.values : undefined;
  const fields: FieldHelpers = {
    errors: (name) => (state.status === "error" ? state.fieldErrors?.[name] : undefined),
    value: (name, saved) => typed?.[name] ?? saved,
    hasErrors: (name) =>
      state.status === "error" &&
      Object.keys(state.fieldErrors ?? {}).some((key) => key === name || key.startsWith(`${name}.`)),
    values: (name) => (typed ? (typed[name]?.split("\n") ?? []) : undefined),
    count: (name) => {
      if (!typed) return undefined;
      const indexes = new Set<string>();
      for (const key of Object.keys(typed)) {
        const match = key.startsWith(`${name}.`) ? /^(\d+)\./.exec(key.slice(name.length + 1)) : null;
        if (match) indexes.add(match[1]);
      }
      return indexes.size;
    },
    markEdited: () => setEdited(true),
  };
  // O que o servidor recusou continua só no formulário: conta como não salvo.
  const unsaved = !readOnly && !pending && (edited || state.status === "error");
  return (
    <form
      action={formAction}
      noValidate
      className="space-y-6"
      onChange={() => setEdited(true)}
      onSubmit={() => setEdited(false)}
    >
      <CmsFormError state={state} />
      {item ? (
        <>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="expectedUpdatedAt" value={item.updatedAt} />
        </>
      ) : null}
      {/* Remonta os campos a cada erro: o React ignora defaultValue novo em <select> já
          montado, e o reset pós-action voltaria à opção original, perdendo a escolha. */}
      <fieldset
        key={state.status === "error" ? state.requestId : "inicial"}
        disabled={readOnly || pending}
        className="min-w-0 space-y-6"
      >
        {children(fields)}
      </fieldset>
      {readOnly ? null : (
        <div className="sticky bottom-0 z-10 -mx-4 -mb-4 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 rounded-b-studio-lg border-t border-studio-linha bg-white px-4 py-3 sm:-mx-6 sm:-mb-6 sm:px-6">
          <p aria-live="polite" className="mr-auto text-xs font-semibold text-studio-suave">
            {unsaved ? "Alterações não salvas" : ""}
          </p>
          {cancelHref ? (
            <Link href={cancelHref} prefetch={false} className="studio-btn studio-btn-sutil">
              Cancelar
            </Link>
          ) : null}
          <button type="submit" disabled={pending} className="studio-btn studio-btn-primario">
            {pending ? "Salvando…" : submitLabel}
          </button>
        </div>
      )}
      <UnsavedGuard active={unsaved} />
    </form>
  );
}
