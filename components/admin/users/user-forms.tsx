/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : user-forms.tsx
 Descrição    : Formulários de convite e acesso de usuários.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Controles de usuários (ADM-01).
════════════════════════════════════════════════════════════════════════════════
*/
"use client";
import { useActionState } from "react";
import { CmsFormShell, type CmsSaveAction } from "@/components/admin/cms/form-shell";
import { CmsFormError } from "@/components/admin/cms/form-error";
import { ConfirmForm, useHydrated } from "@/components/admin/ui/confirm-form";
import { TextField } from "@/components/forms/fields";
import { CMS_IDLE } from "@/lib/domain/content/cms-form";
import { ROLE_LABELS, type Role } from "@/lib/domain/auth/rbac";
import type { ManagedProfile } from "@/lib/domain/users/profile";

export function InviteForm({ action }: { action: CmsSaveAction }) {
  return (
    <CmsFormShell action={action} submitLabel="Enviar convite">
      {({ errors, value }) => (
        <>
          <TextField
            name="name"
            label="Nome completo"
            required
            maxLength={120}
            errors={errors("name")}
            defaultValue={value("name")}
          />
          <TextField
            name="email"
            label="E-mail"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            errors={errors("email")}
            defaultValue={value("email")}
          />
          <p className="text-sm text-studio-suave">
            A pessoa receberá um convite para criar a senha. A conta começa pendente; depois atribua o papel nesta tela.
          </p>
        </>
      )}
    </CmsFormShell>
  );
}

export function UserControls({
  item,
  roles,
  roleAction,
  activeAction,
}: {
  item: ManagedProfile;
  roles: Role[];
  roleAction: CmsSaveAction;
  activeAction: CmsSaveAction;
}) {
  const [roleState, submitRole, savingRole] = useActionState(roleAction, CMS_IDLE);
  const [activeState, submitActive, savingActive] = useActionState(activeAction, CMS_IDLE);
  const ready = useHydrated();
  return (
    <div className="space-y-3">
      <CmsFormError state={roleState} />
      <CmsFormError state={activeState} />
      <form action={submitRole} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="id" value={item.id} />
        <label className="grid gap-1 text-xs font-bold">
          Papel de {item.full_name || "usuário"}
          <select
            name="role"
            defaultValue={item.role}
            className="rounded-studio-sm border border-studio-controle bg-white px-3 py-2 text-sm"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="studio-btn studio-btn-secundario" disabled={savingRole || savingActive}>
          Salvar papel
        </button>
      </form>
      <ConfirmForm
        action={submitActive}
        confirmation={{
          title: item.active ? "Desativar acesso?" : "Reativar acesso?",
          message: item.active
            ? "A pessoa deixará de acessar o painel."
            : "O acesso voltará conforme o papel atribuído.",
          confirmLabel: item.active ? "Desativar" : "Reativar",
          tone: "neutro",
        }}
      >
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="active" value={item.active ? "false" : "true"} />
        <button type="submit" className="studio-btn studio-btn-sutil" disabled={!ready || savingRole || savingActive}>
          {item.active ? "Desativar acesso" : "Reativar acesso"}
        </button>
      </ConfirmForm>
    </div>
  );
}
