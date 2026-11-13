/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Salva a aparência do site.

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
import { THEME_COLOR_NAMES, THEME_IMAGE_NAMES, type SiteTheme } from "@/lib/domain/content/theme";
import { cmsFormAction, withFlash } from "@/lib/server/cms/context";
import { text, typedValues } from "@/lib/server/cms/form-data";
import { mediaLookup } from "@/lib/server/cms/media-lookup";
import { saveThemeValues } from "@/lib/server/cms/theme-service";
import { AppError } from "@/lib/server/errors";

const PATH = "/admin/aparencia";

/** Grava direto no ar. Permissão (settings:edit) verificada antes de ler o banco e de novo na RLS. */
export async function saveTheme(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsFormAction(
    "settings",
    "edit",
    async (user, deps) => {
      const lookup = mediaLookup(await deps.store.listMedia());
      const images: NonNullable<SiteTheme["images"]> = {};
      const errors: Record<string, string[]> = {};
      for (const name of THEME_IMAGE_NAMES) {
        const id = text(form, `imagem.${name}`);
        if (!id) continue;
        const image = lookup(id);
        if (image) images[name] = image;
        else errors[`imagem.${name}`] = ["Esta imagem não está mais na biblioteca."];
      }
      if (Object.keys(errors).length) throw new AppError("VALIDATION_FAILED", { fieldErrors: errors });
      const changed = await saveThemeValues(
        deps,
        user,
        {
          colors: Object.fromEntries(THEME_COLOR_NAMES.map((name) => [name, text(form, `cor.${name}`)])),
          fontBody: text(form, "fontBody") as SiteTheme["fontBody"],
          fontHeading: text(form, "fontHeading") as SiteTheme["fontHeading"],
          images,
        },
        text(form, "expectedUpdatedAt") || null,
      );
      return withFlash(PATH, changed ? "no-ar" : "sem-alteracao");
    },
    typedValues(form, ["id", "expectedUpdatedAt"]),
  );
}
