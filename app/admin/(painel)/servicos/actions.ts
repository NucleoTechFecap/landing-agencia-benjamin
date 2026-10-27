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
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-06).
──────────────────────────────────────────────────────────────────────────────
*/

"use server";

import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { cmsCommandAction, cmsSaveAction } from "@/lib/server/cms/context";
import { SERVICE } from "@/lib/server/cms/entities";
import { checked, lines, many, text } from "@/lib/server/cms/form-data";

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
