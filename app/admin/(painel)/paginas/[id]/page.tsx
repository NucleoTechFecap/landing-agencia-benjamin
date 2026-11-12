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
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Link para a prévia protegida (ADM-14).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
 12/11/2026 Codex                     Amplia gestão editorial e segurança do painel.
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockList } from "@/components/admin/cms/block-list";
import { CmsHeader, CmsSecondaryLink } from "@/components/admin/cms/cms-header";
import { CommandBar } from "@/components/admin/cms/command-bar";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { ItemPanel } from "@/components/admin/cms/item-panel";
import { PageForm } from "@/components/admin/cms/page-form";
import { can } from "@/lib/domain/auth/rbac";
import { addableBlockTypes, pagePath } from "@/lib/domain/content/blocks";
import { previewPath } from "@/lib/domain/content/preview";
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
  const path = pagePath(page.slug, page.isCustom);
  const readOnly = !can(user.role, "page", "edit") || page.status === "archived";
  return (
    <>
      <CmsHeader title={page.title}>
        <CmsSecondaryLink href={`/admin/paginas/${page.id}/historico`}>Histórico</CmsSecondaryLink>
      </CmsHeader>
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-8">
          <div className="studio-card p-4 sm:p-6">
            {page.status === "archived" ? (
              <p className="mb-5 rounded-studio-md bg-studio-realce px-4 py-3 text-sm">
                Página arquivada: restaure como rascunho para editar.
              </p>
            ) : null}
            {page.status === "published" ? (
              <p className="mb-5 rounded-studio-md bg-studio-realce px-4 py-3 text-sm">
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
          previewHref={previewPath("pagina", page.id)}
          missing={publishProblems(PAGE, page, snapshot, new Date())}
          warnings={path ? [] : ["Esta página não tem rota no site: fica salva, mas o visitante não a vê."]}
        >
          <CommandBar
            action={pageCommand}
            id={page.id}
            updatedAt={page.updatedAt}
            commands={allowedCommands(page.status, user.role, "page").filter(
              (command) => command !== "delete" || !page.isCustom || !page.publishedAt,
            )}
          />
        </ItemPanel>
      </div>
    </>
  );
}
