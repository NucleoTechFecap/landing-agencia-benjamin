/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : actions.ts
 Descrição    : Server Action da tela de contato, links e redes sociais.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-10).
──────────────────────────────────────────────────────────────────────────────
*/

"use server";

import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { cmsFormAction, withFlash } from "@/lib/server/cms/context";
import { text, typedValues } from "@/lib/server/cms/form-data";
import { saveSiteSettings } from "@/lib/server/cms/settings-service";

const SETTINGS_PATH = "/admin/configuracoes";

/** Grava direto no ar. Permissão (settings:edit) verificada antes de ler o banco. */
export async function saveSettings(_state: CmsFormState, form: FormData): Promise<CmsFormState> {
  return cmsFormAction(
    "settings",
    "edit",
    async (user, deps) => {
      const changed = await saveSiteSettings(
        deps,
        user,
        {
          tagline: text(form, "tagline"),
          description: text(form, "description"),
          email: text(form, "email"),
          phone: text(form, "phone"),
          address: text(form, "address"),
          mapsUrl: text(form, "mapsUrl"),
          instagram: text(form, "instagram"),
          tiktok: text(form, "tiktok"),
          linkedin: text(form, "linkedin"),
        },
        text(form, "expectedUpdatedAt") || null,
      );
      return withFlash(SETTINGS_PATH, changed.length ? "no-ar" : "sem-alteracao");
    },
    typedValues(form, ["id", "expectedUpdatedAt"]),
  );
}
