/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Server Actions do CMS de áreas de atuação (salvar e publicação).

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
──────────────────────────────────────────────────────────────────────────────
*/

"use server";

import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { cmsCommandAction, cmsSaveAction } from "@/lib/server/cms/context";
import { AREA } from "@/lib/server/cms/entities";
import { lines, text } from "@/lib/server/cms/form-data";

/** Cria rascunho ou salva a área. Permissão (create/edit) verificada antes de ler o banco. */
export async function saveArea(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsSaveAction(AREA, form, {
    name: text(form, "name"),
    slug: text(form, "slug"),
    summary: text(form, "summary"),
    description: text(form, "description"),
    highlights: lines(form, "highlights"),
    icon: text(form, "icon"),
    order: text(form, "order"),
  });
}

/** Publicar, despublicar, arquivar, restaurar ou excluir a área. */
export async function areaCommand(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsCommandAction(AREA, form);
}
