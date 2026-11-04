/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : media-delete-form.tsx
 Descrição    : Botão de excluir arquivo da biblioteca de mídia, com confirmação.

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
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useActionState } from "react";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import { ConfirmForm, useHydrated } from "../ui/confirm-form";
import { CmsFormError } from "./form-error";

/** A interface só pergunta: quem decide se o arquivo pode sair é o servidor. */
export function MediaDeleteForm({
  action,
  id,
}: {
  action: (state: CmsFormState, form: FormData) => Promise<CmsFormState>;
  id: string;
}) {
  const [state, formAction, pending] = useActionState(action, CMS_IDLE);
  const ready = useHydrated();
  return (
    <div className="space-y-3">
      <CmsFormError state={state} />
      <ConfirmForm
        action={formAction}
        confirmation={{
          title: "Excluir este arquivo definitivamente?",
          message: "Ele sai da biblioteca e do armazenamento. Esta ação não pode ser desfeita.",
          confirmLabel: "Excluir arquivo",
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button type="submit" disabled={!ready || pending} className="studio-btn studio-btn-perigo">
          {pending ? "Excluindo…" : "Excluir arquivo"}
        </button>
      </ConfirmForm>
    </div>
  );
}
