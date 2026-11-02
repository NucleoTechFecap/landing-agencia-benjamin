/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Edição e publicação de página do CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockList } from "@/components/admin/cms/block-list";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { CommandBar } from "@/components/admin/cms/command-bar";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { ItemPanel } from "@/components/admin/cms/item-panel";
import { PageForm } from "@/components/admin/cms/page-form";
import { can } from "@/lib/domain/auth/rbac";
import { addableBlockTypes, pagePath } from "@/lib/domain/content/blocks";
import { allowedCommands } from "@/lib/domain/content/publication";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { publishProblems } from "@/lib/server/cms/content-service";
import { loadCmsSnapshot } from "@/lib/server/cms/context";
import { PAGE } from "@/lib/server/cms/entities";
import { blockCommand, pageCommand, savePage } from "../actions";

export const metadata: Metadata = { title: "Editar página" };

export default async function EditPagePage({ params, searchParams }: PageProps<"/admin/paginas/[id]">) {
  const { id } = await params;
  const user = await requirePageAccess("page", "view", `/admin/paginas/${id}`);
  const [snapshot, query] = await Promise.all([loadCmsSnapshot(), searchParams]);
  const page = snapshot.pages.find((item) => item.id === id);
  if (!page) notFound();
  const path = pagePath(page.slug);
  const readOnly = !can(user.role, "page", "edit") || page.status === "archived";
  return (
    <>
      <CmsHeader
        title={page.title}
        trail={[{ label: "Páginas e textos", href: "/admin/paginas" }, { label: page.title }]}
      />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          <div className="rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
            {page.status === "archived" ? (
              <p className="mb-5 rounded-2xl bg-benja-creme px-4 py-3 text-sm">
                Página arquivada: restaure como rascunho para editar.
              </p>
            ) : null}
            {page.status === "published" ? (
              <p className="mb-5 rounded-2xl bg-benja-creme px-4 py-3 text-sm">
                Página publicada: ao salvar o título, a descrição ou um bloco, o site muda na hora.
              </p>
            ) : null}
            <PageForm action={savePage} page={page} readOnly={readOnly} />
          </div>
          <BlockList
            page={page}
            action={blockCommand}
            addable={readOnly ? [] : addableBlockTypes(page.slug, page.blocks)}
            readOnly={readOnly}
          />
        </div>
        <ItemPanel
          item={page}
          publicHref={path ?? undefined}
          missing={publishProblems(PAGE, page, snapshot, new Date())}
          warnings={path ? [] : ["Esta página não tem rota no site: fica salva, mas o visitante não a vê."]}
        >
          <CommandBar
            action={pageCommand}
            id={page.id}
            updatedAt={page.updatedAt}
            commands={allowedCommands(page.status, user.role, "page")}
          />
        </ItemPanel>
      </div>
    </>
  );
}
