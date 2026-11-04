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
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useActionState } from "react";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import { CmsFormError } from "../cms/form-error";
import { ConfirmForm, useHydrated } from "../ui/confirm-form";

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
  const ready = useHydrated();
  return (
    <section aria-labelledby="exclusao-titulo" className="studio-card space-y-3 p-5 text-sm">
      <h2 id="exclusao-titulo" className="text-base font-extrabold text-benja-verde">
        Exclusão
      </h2>
      <CmsFormError state={state} />
      {archived ? (
        <ConfirmForm
          action={formAction}
          confirmation={{
            title: "Excluir este envio de vez?",
            message:
              "Ele será apagado e não pode ser recuperado. O e-mail de notificação continua na caixa dos destinatários: apague-o lá também.",
            confirmLabel: "Excluir definitivamente",
          }}
        >
          <input type="hidden" name="id" value={id} />
          <button type="submit" disabled={!ready || pending} className="studio-btn studio-btn-perigo w-full">
            Excluir definitivamente
          </button>
        </ConfirmForm>
      ) : (
        <p>Para excluir, a pedido do titular ou no fim do prazo de retenção, arquive o envio primeiro.</p>
      )}
    </section>
  );
}
