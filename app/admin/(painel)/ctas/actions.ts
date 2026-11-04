/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Server Actions do CMS de CTAs (salvar e publicação).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-11).
──────────────────────────────────────────────────────────────────────────────
*/

"use server";

import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { cmsCommandAction, cmsSaveAction } from "@/lib/server/cms/context";
import { CTA } from "@/lib/server/cms/entities";
import { text } from "@/lib/server/cms/form-data";

/** Cria rascunho ou salva o CTA. Permissão (create/edit) verificada antes de ler o banco. */
export async function saveCta(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsSaveAction(CTA, form, {
    label: text(form, "label"),
    placement: text(form, "placement"),
    targetKind: text(form, "targetKind"),
    targetPath: text(form, "targetPath"),
    targetUrl: text(form, "targetUrl"),
    targetId: text(form, "targetId"),
    order: text(form, "order"),
  });
}

/** Publicar, despublicar, arquivar, restaurar ou excluir o CTA. */
export async function ctaCommand(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsCommandAction(CTA, form);
}
