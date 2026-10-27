/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : media-upload-form.tsx
 Descrição    : Formulário de envio de arquivo para a biblioteca de mídia do CMS.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useActionState } from "react";
import { CheckboxField, TextField } from "@/components/forms/fields";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import { CmsFormError } from "./form-error";

type UploadAction = (state: CmsFormState, formData: FormData) => Promise<CmsFormState>;

/** Envio para a biblioteca (JPG, PNG, WebP, AVIF até 5 MB; PDF até 10 MB — ADR-0005). */
export function MediaUploadForm({ action, back }: { action: UploadAction; back?: string }) {
  const [state, formAction, pending] = useActionState(action, CMS_IDLE);
  const errors = (name: string) => (state.status === "error" ? state.fieldErrors?.[name] : undefined);
  const typed = state.status === "error" ? state.values : undefined;
  return (
    <form action={formAction} noValidate className="space-y-5">
      <CmsFormError state={state} />
      {back ? <input type="hidden" name="voltar" value={back} /> : null}
      <div>
        <label htmlFor="file" className="text-sm font-bold text-benja-noite">
          Arquivo
          <span aria-hidden className="text-benja-laranja">
            {" "}
            *
          </span>
        </label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
          aria-describedby="file-dica"
          className="mt-1.5 block w-full rounded-2xl border-2 border-benja-noite bg-white px-4 py-3 text-sm"
        />
        <p id="file-dica" className="mt-1 text-xs text-benja-grafite/80">
          JPG, PNG, WebP ou AVIF até 5 MB e no máximo 4000 px no maior lado (recomendado: 2400 px de largura). PDF até
          10 MB. SVG não é aceito.
        </p>
        {errors("file")?.length ? (
          <p className="mt-1 text-sm font-semibold text-benja-erro">{errors("file")![0]}</p>
        ) : null}
      </div>
      <TextField
        name="alt"
        label="Texto alternativo"
        maxLength={160}
        hint="Descreva o que a imagem mostra (para leitores de tela). Obrigatório, exceto em imagem decorativa."
        errors={errors("alt")}
        defaultValue={typed?.alt}
      />
      <CheckboxField name="decorative" defaultChecked={typed?.decorative === "on"}>
        Imagem decorativa (não transmite informação; fica com texto alternativo vazio)
      </CheckboxField>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-benja-verde px-6 py-3 font-bold text-benja-nyanza transition hover:bg-benja-noite disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}
