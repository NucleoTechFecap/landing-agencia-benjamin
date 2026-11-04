/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Edição de contato, links e redes sociais, que grava direto no ar.

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
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Link from "next/link";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { SettingsForm } from "@/components/admin/cms/settings-form";
import { can } from "@/lib/domain/auth/rbac";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { cmsDeps } from "@/lib/server/cms/context";
import { loadSettingsForEdit } from "@/lib/server/cms/settings-service";
import { saveSettings } from "./actions";

const TITLE = "Contato, links e redes sociais";

export const metadata: Metadata = { title: TITLE };

/**
 * Pela matriz RBAC, `editor` e `viewer` têm settings:view: abrem a tela em modo leitura, como nas
 * demais telas do CMS, e veem a quem pedir a alteração. Os dados já são públicos no site. A
 * gravação é protegida na Server Action e na RLS. Manifesto e Sobre ficam fora desta tela: têm
 * blocos publicáveis em Páginas (ADM-05), e duas fontes para o mesmo texto confundiriam a agência.
 */
export default async function SettingsAdminPage({ searchParams }: PageProps<"/admin/configuracoes">) {
  const user = await requirePageAccess("settings", "view", "/admin/configuracoes");
  const [{ settings, updatedAt }, query] = await Promise.all([loadSettingsForEdit(await cmsDeps()), searchParams]);
  const canEdit = can(user.role, "settings", "edit");
  return (
    <>
      <CmsHeader title={TITLE} />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className="max-w-3xl space-y-6">
        {canEdit ? (
          <p className="rounded-studio-md border border-benja-laranja bg-white px-4 py-3 text-sm text-benja-noite">
            <strong>Salvar vai direto ao ar.</strong> Aqui não há rascunho nem botão de publicar: ao salvar, o site muda
            para todos os visitantes. Confira os links antes.
          </p>
        ) : (
          <p className="rounded-studio-md bg-studio-realce px-4 py-3 text-sm">
            <strong>Somente leitura.</strong> Só o papel Administrador altera estes dados: fale com a coordenação da
            Benjamin se algo precisar mudar.
          </p>
        )}
        <div className="studio-card p-6">
          <SettingsForm action={saveSettings} settings={settings} updatedAt={updatedAt} readOnly={!canEdit} />
        </div>
        <p className="text-sm text-studio-suave">
          Manifesto e textos do Sobre têm rascunho e publicação em{" "}
          <Link href="/admin/paginas" className="studio-link">
            Páginas e textos institucionais
          </Link>
          . Os destinatários dos formulários do site são definidos pelo NúcleoTech, fora do painel.
        </p>
      </div>
    </>
  );
}
