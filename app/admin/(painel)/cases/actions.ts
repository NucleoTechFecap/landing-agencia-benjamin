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
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
──────────────────────────────────────────────────────────────────────────────
*/

"use server";

import { parseLinkLines } from "@/lib/domain/content/case-input-schema";
import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { cmsCommandAction, cmsSaveAction } from "@/lib/server/cms/context";
import { CASE } from "@/lib/server/cms/entities";
import { checked, lines, many, text } from "@/lib/server/cms/form-data";

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
