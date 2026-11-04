/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : status-form.tsx
 Descrição    : Formulário de mudança do status de atendimento de um envio.

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
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "@/lib/domain/forms/inbox";
import { CmsFormError } from "../cms/form-error";

/**
 * Só o status de atendimento muda por aqui: o conteúdo enviado pelo visitante nunca é editável, e o
 * banco recusa `update` em qualquer outra coluna. As opções só orientam: o servidor confere de novo.
 */
export function StatusForm({
  action,
  id,
  current,
  options,
}: {
  action: (state: CmsFormState, form: FormData) => Promise<CmsFormState>;
  id: string;
  current: SubmissionStatus;
  options: readonly SubmissionStatus[];
}) {
  const [state, formAction, pending] = useActionState(action, CMS_IDLE);
  return (
    <section aria-labelledby="atendimento-titulo" className="space-y-3 studio-card p-5">
      <h2 id="atendimento-titulo" className="text-base font-extrabold text-benja-verde">
        Atendimento
      </h2>
      <CmsFormError state={state} />
      {/* A key traz o status novo: o React ignora defaultValue em <select> já montado. */}
      <form key={current} action={formAction} className="space-y-3">
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="currentStatus" value={current} />
        <div>
          <label htmlFor="status-atendimento" className="text-sm font-bold text-benja-noite">
            Status de atendimento
          </label>
          <select
            id="status-atendimento"
            name="status"
            defaultValue={current}
            className="mt-1.5 w-full text-benja-noite"
          >
            {options.map((status) => (
              <option key={status} value={status}>
                {SUBMISSION_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={pending} className="studio-btn studio-btn-primario">
          {pending ? "Salvando…" : "Salvar status"}
        </button>
      </form>
    </section>
  );
}
