/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Server Actions de páginas e blocos do CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 12/11/2026 Codex                     Amplia gestão editorial e segurança do painel.
──────────────────────────────────────────────────────────────────────────────
*/

"use server";

import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { cmsCommandAction, cmsFormAction, cmsSaveAction, withFlash } from "@/lib/server/cms/context";
import { PAGE } from "@/lib/server/cms/entities";
import { checked, itemRef, text, typedValues } from "@/lib/server/cms/form-data";
import { blockInputFromForm, changeBlock, isBlockOperation, saveBlock } from "@/lib/server/cms/page-blocks";
import { AppError } from "@/lib/server/errors";

export async function savePage(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsSaveAction(PAGE, form, {
    title: text(form, "title"),
    slug: text(form, "slug"),
    description: text(form, "description"),
    provisional: checked(form, "provisional"),
    isCustom: checked(form, "isCustom"),
  });
}

export async function pageCommand(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsCommandAction(PAGE, form);
}

export async function saveBlockAction(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsFormAction(
    "page",
    "edit",
    async (user, deps) => {
      const ref = itemRef(form);
      if (!ref) throw new AppError("BAD_REQUEST", { message: "Formulário desatualizado. Recarregue a página." });
      await saveBlock(deps, user, ref, {
        blockId: text(form, "blockId") || undefined,
        type: text(form, "type"),
        input: blockInputFromForm(form),
      });
      return withFlash(`${PAGE.adminPath}/${ref.id}`, "salvo");
    },
    typedValues(form, ["id", "expectedUpdatedAt", "blockId", "type"]),
  );
}

export async function blockCommand(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsFormAction("page", "edit", async (user, deps) => {
    const ref = itemRef(form);
    const operation = text(form, "operation");
    if (!ref || !isBlockOperation(operation)) throw new AppError("BAD_REQUEST", { message: "Operação desconhecida." });
    await changeBlock(deps, user, ref, text(form, "blockId"), operation);
    return withFlash(`${PAGE.adminPath}/${ref.id}`, "salvo");
  });
}
