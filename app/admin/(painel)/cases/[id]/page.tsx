/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Edição e publicação de case no CMS.

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
 04/11/2026 Vinícius Nishimura Reis  Link para a prévia protegida (ADM-14).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseForm } from "@/components/admin/cms/case-form";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { CommandBar } from "@/components/admin/cms/command-bar";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { ItemPanel } from "@/components/admin/cms/item-panel";
import { PageTabs } from "@/components/admin/cms/page-tabs";
import { SeoForm } from "@/components/admin/cms/seo-form";
import { siteUrl } from "@/lib/config/public-env";
import { can } from "@/lib/domain/auth/rbac";
import { findIntegrityIssues } from "@/lib/domain/content/integrity";
import { previewPath } from "@/lib/domain/content/preview";
import { allowedCommands } from "@/lib/domain/content/publication";
import { historyPath } from "@/lib/domain/content/versions";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { publishProblems } from "@/lib/server/cms/content-service";
import { loadCmsSnapshot, loadImageOptions, loadLastChange } from "@/lib/server/cms/context";
import { CASE } from "@/lib/server/cms/entities";
import { caseCommand, saveCase, saveCaseSeo } from "../actions";

export const metadata: Metadata = { title: "Editar case" };

export default async function EditCasePage({ params, searchParams }: PageProps<"/admin/cases/[id]">) {
  const { id } = await params;
  const user = await requirePageAccess("case", "view", `/admin/cases/${id}`);
  const [snapshot, images, query, lastChange] = await Promise.all([
    loadCmsSnapshot(),
    loadImageOptions(),
    searchParams,
    loadLastChange("case", id),
  ]);
  const item = snapshot.cases.find((entry) => entry.id === id);
  if (!item) notFound();
  const readOnly = !can(user.role, "case", "edit") || item.status === "archived";
  const seoTab = query.aba === "seo";
  const now = new Date();
  const warnings = findIntegrityIssues(snapshot, now)
    .filter((issue) => issue.severity === "warning" && issue.entity.type === "case" && issue.entity.id === item.id)
    .map((issue) => issue.message);
  return (
    <>
      <CmsHeader title={item.title} />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <PageTabs
        current={seoTab ? "seo" : "dados"}
        tabs={[
          { id: "dados", label: "Dados do case", href: `${CASE.adminPath}/${item.id}` },
          { id: "seo", label: "SEO e compartilhamento", href: `${CASE.adminPath}/${item.id}?aba=seo` },
        ]}
      />
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 studio-card p-4 sm:p-6">
          {item.status === "archived" ? (
            <p className="mb-5 rounded-studio-md bg-studio-realce px-4 py-3 text-sm">
              Case arquivado: restaure como rascunho para editar.
            </p>
          ) : null}
          {seoTab ? (
            <SeoForm
              action={saveCaseSeo}
              item={{ id: item.id, updatedAt: item.updatedAt }}
              seo={item.seo ?? {}}
              base={{ title: `${item.title} — ${item.client}`, description: item.summary }}
              path={CASE.publicPath(item)}
              siteUrl={siteUrl}
              images={images}
              defaultImageSrc={`${CASE.publicPath(item)}/opengraph-image`}
              readOnly={readOnly}
              cancelHref={`${CASE.adminPath}/${item.id}`}
            />
          ) : (
            <CaseForm
              action={saveCase}
              item={item}
              categories={snapshot.categories}
              services={snapshot.services}
              images={[...images].reverse()}
              readOnly={readOnly}
            />
          )}
        </div>
        <ItemPanel
          item={item}
          publicHref={CASE.publicPath(item)}
          previewHref={previewPath("case", item.id)}
          historyHref={historyPath("case", item.id)}
          lastChange={lastChange}
          missing={publishProblems(CASE, item, snapshot, now)}
          warnings={warnings}
        >
          <CommandBar
            action={caseCommand}
            id={item.id}
            updatedAt={item.updatedAt}
            commands={allowedCommands(item.status, user.role, "case")}
          />
        </ItemPanel>
      </div>
    </>
  );
}
