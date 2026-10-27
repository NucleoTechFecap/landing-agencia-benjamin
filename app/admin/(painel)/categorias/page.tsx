/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Lista de categorias de cases no CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { CmsHeader, CmsLinkButton } from "@/components/admin/cms/cms-header";
import { CmsTable } from "@/components/admin/cms/cms-table";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { can } from "@/lib/domain/auth/rbac";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot } from "@/lib/server/cms/context";

export const metadata: Metadata = { title: "Categorias de cases" };

export default async function CategoriesAdminPage({ searchParams }: PageProps<"/admin/categorias">) {
  const user = await requirePageAccess("category", "view", "/admin/categorias");
  const [snapshot, query] = await Promise.all([loadCmsSnapshot(), searchParams]);
  const casesIn = (id: string) => snapshot.cases.filter((item) => item.categoryId === id).length;
  return (
    <>
      <CmsHeader
        title="Categorias de cases"
        trail={[{ label: "Cases", href: "/admin/cases" }, { label: "Categorias" }]}
      >
        {can(user.role, "category", "create") ? (
          <CmsLinkButton href="/admin/categorias/nova">Nova categoria</CmsLinkButton>
        ) : null}
      </CmsHeader>
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <CmsTable
        basePath="/admin/categorias"
        extraHeader="Cases"
        rows={snapshot.categories.map((category) => ({
          ...category,
          title: category.name,
          extra: casesIn(category.id),
        }))}
        empty={<p>Nenhuma categoria cadastrada ainda.</p>}
      />
    </>
  );
}
