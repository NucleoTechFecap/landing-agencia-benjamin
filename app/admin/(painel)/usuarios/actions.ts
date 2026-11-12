/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Ações protegidas de gestão de usuários.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Ações de usuários (ADM-01).
════════════════════════════════════════════════════════════════════════════════
*/
"use server";
import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { cmsFormAction, withFlash } from "@/lib/server/cms/context";
import { text, typedValues } from "@/lib/server/cms/form-data";
import { AppError } from "@/lib/server/errors";
import { userManagementDeps } from "@/lib/server/users/repository";
import { invitePanelUser, updateUserActive, updateUserRole } from "@/lib/server/users/service";

export async function inviteUser(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsFormAction(
    "user",
    "create",
    async (actor) => {
      await invitePanelUser(await userManagementDeps(), actor, {
        name: text(form, "name"),
        email: text(form, "email"),
      });
      return withFlash("/admin/usuarios", "convite-enviado");
    },
    typedValues(form),
  );
}

export async function changeUserRole(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsFormAction("user", "edit", async (actor) => {
    await updateUserRole(await userManagementDeps(), actor, text(form, "id"), text(form, "role"));
    return withFlash("/admin/usuarios", "salvo");
  });
}

export async function changeUserActive(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsFormAction("user", "edit", async (actor) => {
    const active = text(form, "active");
    if (active !== "true" && active !== "false") throw new AppError("BAD_REQUEST");
    await updateUserActive(await userManagementDeps(), actor, text(form, "id"), active === "true");
    return withFlash("/admin/usuarios", "salvo");
  });
}
