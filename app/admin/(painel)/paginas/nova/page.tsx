/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Criação do conteúdo de uma rota do site no CMS.

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
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { PageForm } from "@/components/admin/cms/page-form";
import { PAGE_ROUTE_LABELS, pagePath, type RoutedPageSlug } from "@/lib/domain/content/blocks";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot } from "@/lib/server/cms/context";
import { savePage } from "../actions";

export const metadata: Metadata = { title: "Criar conteúdo da página" };

/** O painel só cria páginas para as rotas do site: outro slug ficaria salvo, sem aparecer. */
export default async function NewPagePage({ searchParams }: PageProps<"/admin/paginas/nova">) {
  await requirePageAccess("page", "create", "/admin/paginas/nova");
  const [{ rota }, snapshot] = await Promise.all([searchParams, loadCmsSnapshot()]);
  if (typeof rota !== "string" || !pagePath(rota) || snapshot.pages.some((page) => page.slug === rota)) {
    redirect("/admin/paginas");
  }
  const label = PAGE_ROUTE_LABELS[rota as RoutedPageSlug];
  return (
    <>
      <CmsHeader title={`Criar conteúdo: ${label}`} />
      <div className="max-w-3xl studio-card p-4 sm:p-6">
        <PageForm action={savePage} slug={rota} defaultTitle={label} />
      </div>
    </>
  );
}
