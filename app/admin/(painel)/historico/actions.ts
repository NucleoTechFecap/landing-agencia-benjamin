/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Restaura uma versão do conteúdo a partir do histórico.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

"use server";

import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { isVersionEntity, versionItemPath, versionResource } from "@/lib/domain/content/versions";
import { cmsFormAction, withFlash } from "@/lib/server/cms/context";
import { text } from "@/lib/server/cms/form-data";
import { newRequestId } from "@/lib/server/errors";
import { restoreVersion } from "@/lib/server/cms/versions";

/** A permissão vem do tipo do conteúdo, e o serviço confere de novo antes de gravar. */
export async function restoreVersionAction(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  const entity = text(form, "entity");
  const entityId = text(form, "entityId");
  const version = Number(text(form, "version"));
  if (!isVersionEntity(entity) || !entityId || !Number.isInteger(version) || version < 1) {
    return {
      status: "error",
      code: "BAD_REQUEST",
      message: "Formulário desatualizado. Recarregue a página.",
      requestId: newRequestId(),
    };
  }
  return cmsFormAction(versionResource(entity), "edit", async (user, deps) => {
    await restoreVersion(deps, user, {
      entity,
      entityId,
      version,
      expectedUpdatedAt: text(form, "expectedUpdatedAt") || null,
    });
    return withFlash(versionItemPath(entity, entityId), "versao-restaurada");
  });
}
