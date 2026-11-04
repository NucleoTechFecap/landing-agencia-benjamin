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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

"use server";

import { HIDDEN_SECTIONS_FIELD } from "@/lib/domain/content/field-editor";
import { isFreePageSlug } from "@/lib/domain/content/blocks";
import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { entriesFromForm } from "@/lib/domain/content/fields";
import { withPublishedBlocks } from "@/lib/domain/content/page-texts";
import { slugify } from "@/lib/domain/content/slug";
import { cmsCommandAction, cmsFormAction, cmsSaveAction, withFlash } from "@/lib/server/cms/context";
import { PAGE } from "@/lib/server/cms/entities";
import { checked, itemRef, many, seoInputFromForm, text, typedValues } from "@/lib/server/cms/form-data";
import { savePageFields, saveItemSeo } from "@/lib/server/cms/page-content";
import { loadSettingsForEdit } from "@/lib/server/cms/settings-service";
import { blockInputFromForm, changeBlock, isBlockOperation, saveBlock } from "@/lib/server/cms/page-blocks";
import { AppError, newRequestId } from "@/lib/server/errors";

/** `rota` vem da lista de páginas: o conteúdo de uma rota fixa. Sem ela, é uma página nova, com endereço próprio. */
export async function savePage(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  const editing = Boolean(text(form, "id"));
  const rota = text(form, "rota");
  const title = text(form, "title");
  const chosen = rota || text(form, "slug");
  const candidate = editing ? chosen : chosen || slugify(title);
  if (!rota && candidate && !isFreePageSlug(candidate)) {
    return {
      status: "error",
      code: "VALIDATION_FAILED",
      message: "Revise os campos destacados.",
      requestId: newRequestId(),
      fieldErrors: { slug: ["Este endereço já é de uma página do site. Escolha outro."] },
      values: typedValues(form, ["id", "expectedUpdatedAt"]),
    };
  }
  return cmsSaveAction(PAGE, form, {
    title,
    slug: chosen,
    description: text(form, "description"),
    provisional: checked(form, "provisional"),
  });
}

/** Textos, imagens, ícones e botões das seções fixas. */
export async function savePageFieldsAction(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsFormAction(
    "page",
    "edit",
    async (user, deps) => {
      const ref = itemRef(form);
      if (!ref) throw new AppError("BAD_REQUEST", { message: "Formulário desatualizado. Recarregue a página." });
      const [{ settings }, { pages }] = await Promise.all([loadSettingsForEdit(deps), deps.store.snapshot()]);
      const changed = await savePageFields(deps, user, ref, {
        entries: entriesFromForm(form),
        hidden: many(form, HIDDEN_SECTIONS_FIELD),
        settings: withPublishedBlocks(
          settings,
          pages.filter((page) => page.status === "published"),
        ),
      });
      return withFlash(`${PAGE.adminPath}/${ref.id}?aba=textos`, changed ? "salvo" : "sem-alteracao");
    },
    typedValues(form, ["id", "expectedUpdatedAt"]),
  );
}

/** SEO e compartilhamento da página. */
export async function savePageSeoAction(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsFormAction(
    "page",
    "edit",
    async (user, deps) => {
      const ref = itemRef(form);
      if (!ref) throw new AppError("BAD_REQUEST", { message: "Formulário desatualizado. Recarregue a página." });
      const changed = await saveItemSeo(deps, user, PAGE, "page", ref, seoInputFromForm(form));
      return withFlash(`${PAGE.adminPath}/${ref.id}?aba=seo`, changed ? "salvo" : "sem-alteracao");
    },
    typedValues(form, ["id", "expectedUpdatedAt"]),
  );
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
        entries: entriesFromForm(form),
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
