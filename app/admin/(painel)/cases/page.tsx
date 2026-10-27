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
import Link from "next/link";
import { CmsHeader, CmsLinkButton } from "@/components/admin/cms/cms-header";
import { CmsTable } from "@/components/admin/cms/cms-table";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { can } from "@/lib/domain/auth/rbac";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot } from "@/lib/server/cms/context";

export const metadata: Metadata = { title: "Cases" };

/** Cases (ADM-08): lista com cliente e categoria; categorias e mídia têm telas próprias. */
export default async function CasesAdminPage({ searchParams }: PageProps<"/admin/cases">) {
  const user = await requirePageAccess("case", "view", "/admin/cases");
  const [snapshot, query] = await Promise.all([loadCmsSnapshot(), searchParams]);
  const categoryName = new Map(snapshot.categories.map((category) => [category.id, category.name]));
  return (
    <>
      <CmsHeader title="Cases" trail={[{ label: "Cases" }]}>
        <Link
          href="/admin/categorias"
          className="rounded-full border-2 border-benja-verde px-5 py-2 text-sm font-bold text-benja-verde hover:bg-benja-claro"
        >
          Categorias
        </Link>
        <Link
          href="/admin/midia"
          className="rounded-full border-2 border-benja-verde px-5 py-2 text-sm font-bold text-benja-verde hover:bg-benja-claro"
        >
          Biblioteca de mídia
        </Link>
        {can(user.role, "case", "create") ? <CmsLinkButton href="/admin/cases/novo">Novo case</CmsLinkButton> : null}
      </CmsHeader>
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <CmsTable
        basePath="/admin/cases"
        extraHeader="Cliente · Categoria"
        rows={snapshot.cases.map((item) => ({
          ...item,
          title: item.featured ? `${item.title} ★` : item.title,
          extra: [item.client || "—", categoryName.get(item.categoryId) ?? "sem categoria"].join(" · "),
        }))}
        empty={<p>Nenhum case cadastrado ainda. Crie a categoria e envie a capa antes de publicar.</p>}
      />
    </>
  );
}
