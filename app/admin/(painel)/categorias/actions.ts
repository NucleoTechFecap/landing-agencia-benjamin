/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Server Actions do CMS de categorias de cases.

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

import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { cmsCommandAction, cmsSaveAction } from "@/lib/server/cms/context";
import { CATEGORY } from "@/lib/server/cms/entities";
import { text } from "@/lib/server/cms/form-data";

export async function saveCategory(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsSaveAction(CATEGORY, form, {
    name: text(form, "name"),
    slug: text(form, "slug"),
    description: text(form, "description"),
    order: text(form, "order"),
  });
}

export async function categoryCommand(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsCommandAction(CATEGORY, form);
}
