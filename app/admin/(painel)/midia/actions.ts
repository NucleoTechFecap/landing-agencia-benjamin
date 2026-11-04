/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Server Action de envio para a biblioteca de mídia do CMS.

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
 02/11/2026 Vinícius Nishimura Reis  Actions de autorizar e concluir o envio direto (TECH-13, #313).
 04/11/2026 Vinícius Nishimura Reis  Editar texto alternativo e excluir arquivo sem uso da biblioteca (ADM-09).
──────────────────────────────────────────────────────────────────────────────
*/

"use server";

import type { CmsFormState, MediaUploadTicket } from "@/lib/domain/content/cms-form";
import { cmsDeleteMedia, cmsFinishMediaUpload, cmsRequestMediaUpload, cmsSaveMedia } from "@/lib/server/cms/context";

export async function requestMediaUpload(form: FormData): Promise<MediaUploadTicket> {
  return cmsRequestMediaUpload(form);
}

export async function finishMediaUpload(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsFinishMediaUpload(form);
}

export async function saveMediaDetails(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsSaveMedia(form);
}

export async function deleteMediaAsset(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsDeleteMedia(form);
}
