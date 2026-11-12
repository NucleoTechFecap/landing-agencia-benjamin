/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : restore-version-form.tsx
 Descrição    : Confirmação de restauração de versão de página.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Restaurar versões (FUT-04).
════════════════════════════════════════════════════════════════════════════════
*/
"use client";
import { useActionState } from "react";
import { CMS_IDLE } from "@/lib/domain/content/cms-form";
import { ConfirmForm, useHydrated } from "@/components/admin/ui/confirm-form";
import { CmsFormError } from "./form-error";
import type { CmsSaveAction } from "./form-shell";

export function RestoreVersionForm({
  action,
  id,
  updatedAt,
  version,
  published,
}: {
  action: CmsSaveAction;
  id: string;
  updatedAt: string;
  version: string;
  published: boolean;
}) {
  const [state, submit, pending] = useActionState(action, CMS_IDLE);
  const ready = useHydrated();
  return (
    <div className="space-y-3">
      <CmsFormError state={state} />
      <ConfirmForm
        action={submit}
        confirmation={{
          title: "Usar esta versão?",
          message: published
            ? "A página sairá do ar e voltará a rascunho para revisão. Você poderá publicá-la novamente."
            : "O conteúdo atual será substituído pelo conteúdo desta versão.",
          confirmLabel: "Usar esta versão",
          tone: "neutro",
        }}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="expectedUpdatedAt" value={updatedAt} />
        <input type="hidden" name="version" value={version} />
        <button type="submit" disabled={!ready || pending} className="studio-btn studio-btn-primario">
          Usar esta versão
        </button>
      </ConfirmForm>
    </div>
  );
}
