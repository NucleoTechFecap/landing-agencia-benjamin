/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Componentes
 Arquivo      : restore-version-form.tsx
 Descrição    : Botão de restaurar uma versão, com confirmação e o erro do servidor na tela.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useActionState } from "react";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import { ConfirmForm } from "../ui/confirm-form";
import { CmsFormError } from "./form-error";

type RestoreAction = (state: CmsFormState, formData: FormData) => Promise<CmsFormState>;

/** Restaurar passa pelas mesmas regras de salvar; em item publicado, vai ao ar na hora. */
export function RestoreVersionForm({
  action,
  entity,
  entityId,
  version,
  expectedUpdatedAt,
  live,
}: {
  action: RestoreAction;
  entity: string;
  entityId: string;
  version: number;
  expectedUpdatedAt: string | null;
  /** O conteúdo está no ar: a confirmação avisa que o site muda agora. */
  live: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, CMS_IDLE);
  return (
    <div className="space-y-3">
      <CmsFormError state={state} />
      <ConfirmForm
        action={formAction}
        confirmation={{
          title: `Restaurar a versão ${version}?`,
          message: live
            ? "O site passa a mostrar este conteúdo agora. O conteúdo atual fica guardado no histórico, e dá para voltar a ele."
            : "O conteúdo atual fica guardado no histórico, e dá para voltar a ele.",
          confirmLabel: "Restaurar",
          tone: "neutro",
        }}
      >
        <input type="hidden" name="entity" value={entity} />
        <input type="hidden" name="entityId" value={entityId} />
        <input type="hidden" name="version" value={version} />
        <input type="hidden" name="expectedUpdatedAt" value={expectedUpdatedAt ?? ""} />
        <button type="submit" disabled={pending} className="studio-btn studio-btn-primario">
          {pending ? "Restaurando…" : "Restaurar esta versão"}
        </button>
      </ConfirmForm>
    </div>
  );
}
