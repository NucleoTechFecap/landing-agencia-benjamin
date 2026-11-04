/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Lista das páginas do site no CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { PagesTable } from "@/components/admin/cms/pages-table";
import { can } from "@/lib/domain/auth/rbac";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot } from "@/lib/server/cms/context";

export const metadata: Metadata = { title: "Páginas e textos" };

export default async function PagesAdminPage({ searchParams }: PageProps<"/admin/paginas">) {
  const user = await requirePageAccess("page", "view", "/admin/paginas");
  const [snapshot, query] = await Promise.all([loadCmsSnapshot(), searchParams]);
  return (
    <>
      <CmsHeader
        title="Páginas e textos"
        description="Cada página do site tem seções fixas. Aqui você troca o manifesto e o texto Sobre, e acrescenta blocos depois das seções fixas. Sem conteúdo publicado, o site continua com os textos atuais."
      />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <PagesTable pages={snapshot.pages} canCreate={can(user.role, "page", "create")} />
    </>
  );
}
