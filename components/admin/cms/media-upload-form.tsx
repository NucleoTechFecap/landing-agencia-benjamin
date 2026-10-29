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
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
 28/10/2026 Vinícius Nishimura Reis  Envio direto por URL assinada e limites do Storage (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { startTransition, useState } from "react";
import { CheckboxField, TextField } from "@/components/forms/fields";
import { type CmsFormState } from "@/lib/domain/content/cms-form";
import { uploadMediaWithTicket } from "@/lib/client/media-upload";
import { MEDIA_RULES, MAX_MEDIA_UPLOAD_BYTES, uploadTooLargeMessage } from "@/lib/domain/media/policy";
import { CmsFormError } from "./form-error";

type UploadTicket =
  | { status: "error"; code: string; message: string; requestId: string; fieldErrors?: Record<string, string[]> }
  | { status: "ready"; path: string; token: string };
type UploadActions = {
  create: (formData: FormData) => Promise<UploadTicket>;
  finalize: (formData: FormData) => Promise<CmsFormState>;
};

/**
 * O navegador envia os bytes direto ao Supabase por URL assinada; as Server Actions tratam só
 * metadados e a confirmação do arquivo (TECH-13).
 */
export function MediaUploadForm({ actions, back }: { actions: UploadActions; back?: string }) {
  const [state, setState] = useState<CmsFormState>({ status: "idle" });
  const [pending, setPending] = useState(false);
  const [fileProblem, setFileProblem] = useState<string | null>(null);
  const errors = (name: string) => (state.status === "error" ? state.fieldErrors?.[name] : undefined);
  const typed = state.status === "error" ? state.values : undefined;
  const fileErrors = fileProblem ? [fileProblem] : errors("file");
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];
        if (!file || fileProblem || pending) return;
        startTransition(async () => {
          setPending(true);
          setState({ status: "idle" });
          try {
            const data = new FormData(form);
            data.set("name", file.name);
            data.set("type", file.type);
            data.set("size", String(file.size));
            const ticket = await actions.create(data);
            if (ticket.status === "error") {
              setState(ticket);
              return;
            }
            try {
              await uploadMediaWithTicket(ticket.path, ticket.token, file);
            } catch (uploadError) {
              data.set("path", ticket.path);
              await actions.finalize(data).catch(() => undefined);
              throw uploadError;
            }
            data.set("path", ticket.path);
            const result = await actions.finalize(data);
            if (result.status === "error") setState(result);
          } catch (error) {
            setState({
              status: "error",
              code: "UPLOAD_FAILED",
              message: error instanceof Error ? error.message : "Não foi possível enviar o arquivo.",
              requestId: "upload",
            });
          } finally {
            setPending(false);
          }
        });
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
            const maxBytes = file ? Math.min(MEDIA_RULES[file.type]?.maxBytes ?? 0, MAX_MEDIA_UPLOAD_BYTES) : 0;
            setFileProblem(file && file.size > maxBytes ? uploadTooLargeMessage(maxBytes) : null);
          }}
          aria-invalid={fileErrors?.length ? true : undefined}
          aria-describedby={fileErrors?.length ? "file-dica file-erro" : "file-dica"}
          className="mt-1.5 block w-full rounded-2xl border-2 border-benja-noite bg-white px-4 py-3 text-sm"
        />
        <p id="file-dica" className="mt-1 text-xs text-benja-grafite/80">
          JPG, PNG, WebP, AVIF ou PDF até 10 MB (imagens até 5 MB). Imagens com no máximo 4000 px no maior lado
          (recomendado: 2400 px de largura). SVG não é aceito.
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
