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
 Modificado em: 27/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
 27/10/2026 Vinícius Nishimura Reis  Limite de 4 MB conferido no navegador antes do envio (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useActionState, useState } from "react";
import { CheckboxField, TextField } from "@/components/forms/fields";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import { PANEL_UPLOAD_MAX_BYTES, uploadTooLargeMessage } from "@/lib/domain/media/policy";
import { CmsFormError } from "./form-error";

type UploadAction = (state: CmsFormState, formData: FormData) => Promise<CmsFormState>;

/**
 * Envio para a biblioteca (JPG, PNG, WebP, AVIF e PDF até 4 MB — ADR-0005). O tamanho é conferido
 * aqui antes do envio: acima de 4,5 MB a Vercel recusa a requisição antes de a action rodar, e a
 * pessoa ficaria sem a mensagem de validação (TECH-13).
 */
export function MediaUploadForm({ action, back }: { action: UploadAction; back?: string }) {
  const [state, formAction, pending] = useActionState(action, CMS_IDLE);
  const [fileProblem, setFileProblem] = useState<string | null>(null);
  const errors = (name: string) => (state.status === "error" ? state.fieldErrors?.[name] : undefined);
  const typed = state.status === "error" ? state.values : undefined;
  const fileErrors = fileProblem ? [fileProblem] : errors("file");
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (fileProblem) event.preventDefault();
      }}
      noValidate
      className="space-y-5"
    >
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
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            setFileProblem(file && file.size > PANEL_UPLOAD_MAX_BYTES ? uploadTooLargeMessage() : null);
          }}
          aria-invalid={fileErrors?.length ? true : undefined}
          aria-describedby={fileErrors?.length ? "file-dica file-erro" : "file-dica"}
          className="mt-1.5 block w-full rounded-2xl border-2 border-benja-noite bg-white px-4 py-3 text-sm"
        />
        <p id="file-dica" className="mt-1 text-xs text-benja-grafite/80">
          JPG, PNG, WebP, AVIF ou PDF até 4 MB. Imagens com no máximo 4000 px no maior lado (recomendado: 2400 px de
          largura). SVG não é aceito.
        </p>
        {fileErrors?.length ? (
          <p id="file-erro" className="mt-1 text-sm font-semibold text-benja-erro">
            {fileErrors[0]}
          </p>
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
        disabled={pending || Boolean(fileProblem)}
        className="rounded-full bg-benja-verde px-6 py-3 font-bold text-benja-nyanza transition hover:bg-benja-noite disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar"}
      </button>
    </form>
  );
}
