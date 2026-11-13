/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Tela de aparência do site: cores, fontes e logotipos.

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

import type { Metadata } from "next";
import Link from "next/link";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { ThemeForm } from "@/components/admin/cms/theme-form";
import { can } from "@/lib/domain/auth/rbac";
import { SINGLE_ENTITY_ID, historyPath } from "@/lib/domain/content/versions";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { cmsDeps, loadImageOptions } from "@/lib/server/cms/context";
import { loadSettingsForEdit } from "@/lib/server/cms/settings-service";
import { saveTheme } from "./actions";

const TITLE = "Aparência do site";

export const metadata: Metadata = { title: TITLE };

/** Como em Configurações: editor e leitor veem, só o administrador altera. */
export default async function AppearancePage({ searchParams }: PageProps<"/admin/aparencia">) {
  const user = await requirePageAccess("settings", "view", "/admin/aparencia");
  const [{ settings, updatedAt }, images, query] = await Promise.all([
    loadSettingsForEdit(await cmsDeps()),
    loadImageOptions(),
    searchParams,
  ]);
  const canEdit = can(user.role, "settings", "edit");
  return (
    <>
      <CmsHeader title={TITLE} description="Cores, fontes e logotipos de todas as páginas do site." />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className="max-w-5xl space-y-6">
        {canEdit ? (
          <p className="rounded-studio-md border border-benja-laranja bg-white px-4 py-3 text-sm text-benja-noite">
            <strong>Salvar vai direto ao ar.</strong> O brandbook define a identidade da Benjamin: mudanças aqui valem
            para o site inteiro. Cada versão fica no{" "}
            <Link href={historyPath("theme", SINGLE_ENTITY_ID)} prefetch={false} className="studio-link">
              histórico da aparência
            </Link>
            , e dá para voltar a qualquer uma.
          </p>
        ) : (
          <p className="rounded-studio-md bg-studio-realce px-4 py-3 text-sm">
            <strong>Somente leitura.</strong> Só o papel Administrador altera a aparência do site.
          </p>
        )}
        <div className="studio-card p-4 sm:p-6">
          <ThemeForm
            key={updatedAt ?? "novo"}
            action={saveTheme}
            theme={settings.theme ?? {}}
            updatedAt={updatedAt}
            images={images}
            readOnly={!canEdit}
          />
        </div>
      </div>
    </>
  );
}
