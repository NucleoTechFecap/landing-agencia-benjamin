/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : media-details-form.tsx
 Descrição    : Formulário do texto alternativo de um arquivo da biblioteca de mídia.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-09).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useActionState } from "react";
import { CheckboxField, TextField } from "@/components/forms/fields";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import { CmsFormError } from "./form-error";

/** Texto alternativo e marcação de decorativa; PDF não tem a marcação. */
export function MediaDetailsForm({
  action,
  id,
  updatedAt,
  alt,
  decorative,
  isImage,
}: {
  action: (state: CmsFormState, form: FormData) => Promise<CmsFormState>;
  id: string;
  updatedAt: string;
  alt: string;
  decorative: boolean;
  isImage: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, CMS_IDLE);
  const errors = (name: string) => (state.status === "error" ? state.fieldErrors?.[name] : undefined);
  const typed = state.status === "error" ? state.values : undefined;
  return (
    <form action={formAction} noValidate className="space-y-5">
      <CmsFormError state={state} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="expectedUpdatedAt" value={updatedAt} />
      <TextField
        name="alt"
        label="Texto alternativo"
        maxLength={160}
        hint={
          isImage
            ? "Descreva o que a imagem mostra (para leitores de tela). Obrigatório, exceto em imagem decorativa."
            : "Descrição curta do documento."
        }
        errors={errors("alt")}
        defaultValue={typed?.alt ?? alt}
      />
      {isImage ? (
        <CheckboxField
          name="decorative"
          defaultChecked={typed ? typed.decorative === "on" : decorative}
          errors={errors("decorative")}
        >
          Imagem decorativa (não transmite informação; fica com texto alternativo vazio)
        </CheckboxField>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-benja-verde px-6 py-3 font-bold text-benja-nyanza transition hover:bg-benja-noite disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar alterações"}
      </button>
    </form>
  );
}
