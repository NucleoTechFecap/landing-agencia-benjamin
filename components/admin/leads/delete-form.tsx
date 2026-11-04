/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : delete-form.tsx
 Descrição    : Exclusão de um envio arquivado, a pedido do titular ou no fim da retenção.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-09).
 04/11/2026 Vinícius Nishimura Reis  Tabela sem rolagem lateral, alvos de toque e texto longo (FORM-09).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useActionState } from "react";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import { CmsFormError } from "../cms/form-error";

const CONFIRMATION =
  "Este envio será apagado de vez e não pode ser recuperado. O e-mail de notificação continua na caixa dos destinatários: apague-o lá também. Excluir?";

/** O botão só aparece com o envio arquivado: dois passos para um clique errado não apagar dados. */
export function DeleteSubmissionForm({
  action,
  id,
  archived,
}: {
  action: (state: CmsFormState, form: FormData) => Promise<CmsFormState>;
  id: string;
  archived: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, CMS_IDLE);
  return (
    <section
      aria-labelledby="exclusao-titulo"
      className="space-y-3 rounded-3xl border-2 border-benja-noite/15 bg-white p-5 text-sm"
    >
      <h2 id="exclusao-titulo" className="text-sm font-black tracking-widest text-benja-verde uppercase">
        Exclusão
      </h2>
      <CmsFormError state={state} />
      {archived ? (
        <form
          action={formAction}
          onSubmit={(event) => {
            if (!window.confirm(CONFIRMATION)) event.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-full border-2 border-benja-erro bg-white px-5 py-2.5 font-bold text-benja-erro transition hover:bg-benja-erro-fundo disabled:cursor-wait disabled:opacity-60"
          >
            Excluir definitivamente
          </button>
        </form>
      ) : (
        <p>Para excluir, a pedido do titular ou no fim do prazo de retenção, arquive o envio primeiro.</p>
      )}
    </section>
  );
}
