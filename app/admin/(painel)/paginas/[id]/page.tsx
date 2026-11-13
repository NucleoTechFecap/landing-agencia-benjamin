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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Link para a prévia protegida (ADM-14).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
 04/11/2026 Vinícius Nishimura Reis  Abas de textos, SEO e histórico (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlockList } from "@/components/admin/cms/block-list";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { CommandBar } from "@/components/admin/cms/command-bar";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { ItemPanel } from "@/components/admin/cms/item-panel";
import { PageFieldsForm } from "@/components/admin/cms/page-fields-form";
import { PageForm } from "@/components/admin/cms/page-form";
import { PageTabs, type PageTab } from "@/components/admin/cms/page-tabs";
import { SeoForm } from "@/components/admin/cms/seo-form";
import { authorLabel } from "@/components/admin/cms/version-list";
import { siteUrl } from "@/lib/config/public-env";
import { can } from "@/lib/domain/auth/rbac";
import { addableBlockTypes, isFreePageSlug, pagePath } from "@/lib/domain/content/blocks";
import { PAGE_CATALOG, isCatalogSlug, type CatalogPage } from "@/lib/domain/content/catalog";
import { editorSections } from "@/lib/domain/content/field-editor";
import { withPublishedBlocks } from "@/lib/domain/content/page-texts";
import { previewPath } from "@/lib/domain/content/preview";
import { allowedCommands } from "@/lib/domain/content/publication";
import { historyPath } from "@/lib/domain/content/versions";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { publishProblems } from "@/lib/server/cms/content-service";
import { cmsDeps, loadCmsSnapshot, loadImageOptions } from "@/lib/server/cms/context";
import { PAGE } from "@/lib/server/cms/entities";
import { loadSettingsForEdit } from "@/lib/server/cms/settings-service";
import { blockCommand, pageCommand, savePage, savePageFieldsAction, savePageSeoAction } from "../actions";

export const metadata: Metadata = { title: "Editar página" };

export default async function EditPagePage({ params, searchParams }: PageProps<"/admin/paginas/[id]">) {
  const { id } = await params;
  const user = await requirePageAccess("page", "view", `/admin/paginas/${id}`);
  const deps = await cmsDeps();
  const [snapshot, query, images, { settings }, [lastVersion]] = await Promise.all([
    loadCmsSnapshot(),
    searchParams,
    loadImageOptions(),
    loadSettingsForEdit(deps),
    deps.store.listVersions({ entity: "page", entityId: id, limit: 1 }),
  ]);
  const page = snapshot.pages.find((item) => item.id === id);
  if (!page) notFound();
  const path = pagePath(page.slug);
  const readOnly = !can(user.role, "page", "edit") || page.status === "archived";
  const catalog = isCatalogSlug(page.slug) ? (PAGE_CATALOG[page.slug] as CatalogPage) : null;
  const shared = path === null;

  const base = `/admin/paginas/${page.id}`;
  const tabs: PageTab[] = [
    ...(catalog ? [{ id: "textos", label: "Textos e imagens", href: `${base}?aba=textos` }] : []),
    { id: "dados", label: shared ? "Dados" : "Dados e blocos", href: base },
    ...(shared ? [] : [{ id: "seo", label: "SEO e compartilhamento", href: `${base}?aba=seo` }]),
  ];
  const requested = typeof query.aba === "string" ? query.aba : undefined;
  // O que aparece em todo o site só tem textos: é por eles que a tela abre.
  const fallback = shared ? "textos" : "dados";
  const current = tabs.some((tab) => tab.id === requested) ? requested! : fallback;

  const seoBase = catalog?.seo ?? { title: page.title, description: page.description ?? page.title };
  const defaults = withPublishedBlocks(
    settings,
    snapshot.pages.filter((item) => item.status === "published"),
  );

  return (
    <>
      <CmsHeader title={page.title} description={catalog?.description} />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <PageTabs tabs={tabs} current={current} />
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-8">
          {page.status === "archived" ? (
            <p className="rounded-studio-md bg-studio-realce px-4 py-3 text-sm">
              Página arquivada: restaure como rascunho para editar.
            </p>
          ) : null}
          {page.status === "published" ? (
            <p className="rounded-studio-md bg-studio-realce px-4 py-3 text-sm">
              Página publicada: ao salvar, o site muda na hora, sem nova publicação. Toda alteração fica no histórico, e
              dá para voltar atrás.
            </p>
          ) : null}
          {page.status === "draft" ? (
            <p className="rounded-studio-md bg-studio-realce px-4 py-3 text-sm">
              Rascunho: nada aparece no site até você publicar. Use a prévia para conferir.
            </p>
          ) : null}
          {current === "textos" && isCatalogSlug(page.slug) ? (
            <div className="studio-card p-4 sm:p-6">
              <PageFieldsForm
                action={savePageFieldsAction}
                page={{ id: page.id, updatedAt: page.updatedAt }}
                sections={editorSections(page.slug, page, defaults)}
                images={images}
                readOnly={readOnly}
              />
            </div>
          ) : null}
          {current === "seo" ? (
            <div className="studio-card p-4 sm:p-6">
              <SeoForm
                action={savePageSeoAction}
                item={{ id: page.id, updatedAt: page.updatedAt }}
                seo={page.seo ?? {}}
                base={{
                  title: seoBase.title,
                  description: seoBase.description || settings.description,
                }}
                path={path}
                siteUrl={siteUrl}
                images={images}
                defaultImageSrc={settings.theme?.images?.shareImage?.src ?? "/opengraph-image"}
                readOnly={readOnly}
                cancelHref={base}
              />
            </div>
          ) : null}
          {current === "dados" ? (
            <>
              <div className="studio-card p-4 sm:p-6">
                <PageForm action={savePage} page={page} readOnly={readOnly} />
              </div>
              {shared ? null : (
                <BlockList
                  page={page}
                  action={blockCommand}
                  addable={readOnly ? [] : addableBlockTypes(page.slug, page.blocks)}
                  readOnly={readOnly}
                />
              )}
            </>
          ) : null}
        </div>
        <ItemPanel
          item={page}
          publicHref={path ?? undefined}
          previewHref={shared ? undefined : previewPath("pagina", page.id)}
          historyHref={historyPath("page", page.id)}
          lastChange={lastVersion ? { author: authorLabel(lastVersion), createdAt: lastVersion.createdAt } : undefined}
          missing={publishProblems(PAGE, page, snapshot, new Date())}
          warnings={isFreePageSlug(page.slug) && !page.publishedAt ? [`Quando publicada, ela fica em ${path}.`] : []}
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
