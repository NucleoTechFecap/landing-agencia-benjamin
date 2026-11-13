/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Server Actions do CMS de serviços (salvar e publicação).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-06).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

"use server";

import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { cmsCommandAction, cmsFormAction, cmsSaveAction, withFlash } from "@/lib/server/cms/context";
import { SERVICE } from "@/lib/server/cms/entities";
import { checked, itemRef, lines, many, seoInputFromForm, text, typedValues } from "@/lib/server/cms/form-data";
import { saveItemSeo } from "@/lib/server/cms/page-content";
import { AppError } from "@/lib/server/errors";

/** SEO e compartilhamento do serviço. */
export async function saveServiceSeo(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsFormAction(
    "service",
    "edit",
    async (user, deps) => {
      const ref = itemRef(form);
      if (!ref) throw new AppError("BAD_REQUEST", { message: "Formulário desatualizado. Recarregue a página." });
      const changed = await saveItemSeo(deps, user, SERVICE, "service", ref, seoInputFromForm(form));
      return withFlash(`${SERVICE.adminPath}/${ref.id}?aba=seo`, changed ? "salvo" : "sem-alteracao");
    },
    typedValues(form, ["id", "expectedUpdatedAt"]),
  );
}

/** Cria rascunho ou salva o serviço, com as áreas marcadas. */
export async function saveService(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsSaveAction(SERVICE, form, {
    name: text(form, "name"),
    slug: text(form, "slug"),
    summary: text(form, "summary"),
    description: text(form, "description"),
    examples: lines(form, "examples"),
    areaIds: many(form, "areaIds"),
    icon: text(form, "icon"),
    imageId: text(form, "imageId"),
    featured: checked(form, "featured"),
    order: text(form, "order"),
  });
}

/** Publicar, despublicar, arquivar, restaurar ou excluir o serviço. */
export async function serviceCommand(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsCommandAction(SERVICE, form);
}
