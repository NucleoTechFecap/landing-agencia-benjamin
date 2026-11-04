/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Server Actions do CMS de cases.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

"use server";

import { parseLinkLines } from "@/lib/domain/content/case-input-schema";
import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { cmsCommandAction, cmsFormAction, cmsSaveAction, withFlash } from "@/lib/server/cms/context";
import { CASE } from "@/lib/server/cms/entities";
import { checked, itemRef, lines, many, seoInputFromForm, text, typedValues } from "@/lib/server/cms/form-data";
import { saveItemSeo } from "@/lib/server/cms/page-content";
import { AppError } from "@/lib/server/errors";

/** SEO e compartilhamento do case. */
export async function saveCaseSeo(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsFormAction(
    "case",
    "edit",
    async (user, deps) => {
      const ref = itemRef(form);
      if (!ref) throw new AppError("BAD_REQUEST", { message: "Formulário desatualizado. Recarregue a página." });
      const changed = await saveItemSeo(deps, user, CASE, "case", ref, seoInputFromForm(form));
      return withFlash(`${CASE.adminPath}/${ref.id}?aba=seo`, changed ? "salvo" : "sem-alteracao");
    },
    typedValues(form, ["id", "expectedUpdatedAt"]),
  );
}

/** Cria rascunho ou salva o case com serviços, capa, galeria, links e equipe. */
export async function saveCase(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  const { links, invalid } = parseLinkLines(lines(form, "externalLinks"));
  return cmsSaveAction(CASE, form, {
    title: text(form, "title"),
    slug: text(form, "slug"),
    client: text(form, "client"),
    categoryId: text(form, "categoryId"),
    serviceIds: many(form, "serviceIds"),
    deliveryType: text(form, "deliveryType"),
    summary: text(form, "summary"),
    challenge: text(form, "challenge"),
    solution: text(form, "solution"),
    results: text(form, "results"),
    coverId: text(form, "coverId"),
    galleryIds: many(form, "galleryIds"),
    // Linha fora do formato "Rótulo | https://…" vira link inválido: o schema aponta o erro no campo.
    externalLinks: [...links, ...invalid.map((line) => ({ label: line, url: "formato-invalido" }))],
    date: text(form, "date"),
    team: lines(form, "team"),
    featured: checked(form, "featured"),
    order: text(form, "order"),
  });
}

export async function caseCommand(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsCommandAction(CASE, form);
}
