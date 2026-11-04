/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Lista de cases no CMS.

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
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { CmsHeader, CmsLinkButton, CmsSecondaryLink } from "@/components/admin/cms/cms-header";
import { ContentBoard } from "@/components/admin/cms/content-board";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { can } from "@/lib/domain/auth/rbac";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot } from "@/lib/server/cms/context";

export const metadata: Metadata = { title: "Cases" };

/** Cases (ADM-08): portfólio com capa, cliente e categoria; categorias e mídia têm telas próprias. */
export default async function CasesAdminPage({ searchParams }: PageProps<"/admin/cases">) {
  const user = await requirePageAccess("case", "view", "/admin/cases");
  const [snapshot, query] = await Promise.all([loadCmsSnapshot(), searchParams]);
  const categoryName = new Map(snapshot.categories.map((category) => [category.id, category.name]));
  return (
    <>
      <CmsHeader title="Cases" description="O portfólio da Benjamin: cada trabalho, do rascunho à publicação no site.">
        <CmsSecondaryLink href="/admin/categorias">Categorias</CmsSecondaryLink>
        <CmsSecondaryLink href="/admin/midia">Imagens e arquivos</CmsSecondaryLink>
        {can(user.role, "case", "create") ? <CmsLinkButton href="/admin/cases/novo">Novo case</CmsLinkButton> : null}
      </CmsHeader>
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <ContentBoard
        basePath="/admin/cases"
        itemLabel="case"
        extraHeader="Cliente · Categoria"
        storageKey="painel-visao-cases"
        items={snapshot.cases.map((item) => ({
          id: item.id,
          title: item.title,
          order: item.order,
          status: item.status,
          publishedAt: item.publishedAt,
          archivedAt: item.archivedAt,
          updatedAt: item.updatedAt,
          provisional: item.provisional,
          featured: item.featured,
          subtitle: [item.client || "Sem cliente", categoryName.get(item.categoryId) ?? "sem categoria"].join(" · "),
          description: item.summary,
          coverSrc: item.cover?.src ?? "",
        }))}
        empty={<p>Nenhum case cadastrado ainda. Crie a categoria e envie a capa antes de publicar.</p>}
      />
    </>
  );
}
