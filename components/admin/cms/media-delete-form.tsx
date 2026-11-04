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
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useActionState, useSyncExternalStore } from "react";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import { CmsFormError } from "./form-error";

const subscribeToNothing = () => () => {};

const CONFIRMATION = "Excluir este arquivo definitivamente? Ele sai da biblioteca e do armazenamento.";

/** A interface só pergunta: quem decide se o arquivo pode sair é o servidor. */
export function MediaDeleteForm({
  action,
  id,
}: {
  action: (state: CmsFormState, form: FormData) => Promise<CmsFormState>;
  id: string;
}) {
  const [state, formAction, pending] = useActionState(action, CMS_IDLE);
  // Antes de a página ficar pronta, o clique enviaria o formulário sem passar pela confirmação.
  const ready = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
  return (
    <div className="space-y-3">
      <CmsFormError state={state} />
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!window.confirm(CONFIRMATION)) event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={!ready || pending}
          className="min-h-11 rounded-full border-2 border-benja-erro px-5 py-2 text-sm font-bold text-benja-erro transition hover:bg-benja-erro-fundo disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Excluindo…" : "Excluir arquivo"}
        </button>
      </form>
    </div>
  );
}
