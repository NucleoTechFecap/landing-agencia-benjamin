/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Restauração transacional de versões de páginas.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Restauração de página (FUT-04).
════════════════════════════════════════════════════════════════════════════════
*/
"use server";
import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { cmsFormAction, withFlash } from "@/lib/server/cms/context";
import { itemRef, text } from "@/lib/server/cms/form-data";
import { toCmsError } from "@/lib/server/cms/supabase-store";
import { AppError } from "@/lib/server/errors";
import { createSessionClient } from "@/lib/server/supabase/server";

export async function restorePageVersion(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsFormAction("page", "edit", async (_user, deps) => {
    const ref = itemRef(form);
    const rawVersion = text(form, "version");
    const version = Number(rawVersion);
    if (!ref || !/^[1-9]\d*$/.test(rawVersion) || !Number.isSafeInteger(version)) throw new AppError("BAD_REQUEST");
    const page = (await deps.store.snapshot()).pages.find((item) => item.id === ref.id);
    if (!page) throw new AppError("NOT_FOUND");
    if (page.updatedAt !== ref.expectedUpdatedAt) throw new AppError("CONFLICT");
    const client = await createSessionClient();
    const { error } = await client.rpc("restore_page_version", {
      p_page_id: ref.id,
      p_version_id: version,
      p_expected_updated_at: ref.expectedUpdatedAt,
    });
    if (error) throw toCmsError(error, { table: "pages", operation: "restore_version" });
    if (page.status === "published")
      deps.invalidate({
        entity: "page",
        slug: page.slug,
        ...(page.isCustom ? { relatedPaths: [`/paginas/${page.slug}`] } : {}),
      });
    return withFlash(`/admin/paginas/${ref.id}`, "versao-restaurada");
  });
}
