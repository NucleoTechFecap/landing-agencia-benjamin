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
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
 27/10/2026 Vinícius Nishimura Reis  Limite de 4 MB conferido no navegador antes do envio (TECH-13).
 02/11/2026 Vinícius Nishimura Reis  Envio direto ao Storage, sem passar pela Server Action (TECH-13, #313).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { CheckboxField, TextField } from "@/components/forms/fields";
import { publicEnv } from "@/lib/config/public-env";
import { CMS_IDLE, type CmsFormState, type MediaUploadTicket } from "@/lib/domain/content/cms-form";
import { MEDIA_BUCKET, checkDeclaredUpload } from "@/lib/domain/media/policy";
import { CmsFormError } from "./form-error";

type RequestAction = (formData: FormData) => Promise<MediaUploadTicket>;
type FinishAction = (state: CmsFormState, formData: FormData) => Promise<CmsFormState>;

/** Manda os bytes direto ao Storage, com o token de uso único. O cliente só carrega ao enviar. */
async function sendToStorage(path: string, token: string, file: File) {
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL!, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error } = await client.storage.from(MEDIA_BUCKET).uploadToSignedUrl(path, token, file, {
    contentType: file.type,
    cacheControl: "31536000",
  });
  if (error) throw error;
}

/**
 * Envio para a biblioteca (imagens até 5 MB e PDF até 10 MB, ADR-0005), em três passos: o servidor
 * autoriza, o navegador envia direto ao Storage e o servidor confere o que chegou. O arquivo não
 * passa pela Server Action: acima de 4,5 MB a Vercel recusaria o corpo antes de ela rodar (TECH-13).
 */
export function MediaUploadForm({
  request,
  finish,
  back,
}: {
  request: RequestAction;
  finish: FinishAction;
  back?: string;
}) {
  const [finished, finishAction, finishing] = useActionState(finish, CMS_IDLE);
  const [failure, setFailure] = useState<CmsFormState>(CMS_IDLE);
  const [sending, setSending] = useState(false);
  const [fileProblem, setFileProblem] = useState<string | null>(null);
  const pending = sending || finishing;
  const state = pending ? CMS_IDLE : failure.status === "error" ? failure : finished;
  const errors = (name: string) => (state.status === "error" ? state.fieldErrors?.[name] : undefined);
  const typed = state.status === "error" ? state.values : undefined;
  const fileErrors = fileProblem ? [fileProblem] : errors("file");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const file = (form.elements.namedItem("file") as HTMLInputElement).files?.[0];
    if (!file) return setFileProblem("Escolha um arquivo.");
    const problem = checkDeclaredUpload(file.type, file.size);
    if (problem) return setFileProblem(problem.message);

    const data = new FormData(form);
    // Sem isto o arquivo iria no corpo da Server Action, o que este fluxo existe para evitar.
    data.delete("file");
    data.set("name", file.name);
    data.set("type", file.type);
    data.set("size", String(file.size));
    setFailure(CMS_IDLE);
    setSending(true);
    try {
      const ticket = await request(data);
      if (ticket.status === "error") return setFailure(ticket);
      await sendToStorage(ticket.path, ticket.token, file);
      data.set("path", ticket.path);
      startTransition(() => finishAction(data));
    } catch {
      setFailure({
        status: "error",
        code: "SERVICE_UNAVAILABLE",
        message: "Não foi possível enviar o arquivo. Tente de novo.",
        requestId: "navegador",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
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
            setFileProblem(file ? (checkDeclaredUpload(file.type, file.size)?.message ?? null) : null);
          }}
          aria-invalid={fileErrors?.length ? true : undefined}
          aria-describedby={fileErrors?.length ? "file-dica file-erro" : "file-dica"}
          className="mt-1.5 block w-full rounded-2xl border-2 border-benja-noite bg-white px-4 py-3 text-sm"
        />
        <p id="file-dica" className="mt-1 text-xs text-benja-grafite/80">
          JPG, PNG, WebP ou AVIF até 5 MB e PDF até 10 MB. Imagens com no máximo 4000 px no maior lado (recomendado:
          2400 px de largura). SVG não é aceito.
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
