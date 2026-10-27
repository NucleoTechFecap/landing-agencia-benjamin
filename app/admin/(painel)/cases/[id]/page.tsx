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
import { notFound } from "next/navigation";
import { CaseForm } from "@/components/admin/cms/case-form";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { CommandBar } from "@/components/admin/cms/command-bar";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { ItemPanel } from "@/components/admin/cms/item-panel";
import { can } from "@/lib/domain/auth/rbac";
import { findIntegrityIssues } from "@/lib/domain/content/integrity";
import { allowedCommands } from "@/lib/domain/content/publication";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { publishProblems } from "@/lib/server/cms/content-service";
import { loadCmsSnapshot, loadImageOptions } from "@/lib/server/cms/context";
import { CASE } from "@/lib/server/cms/entities";
import { caseCommand, saveCase } from "../actions";

export const metadata: Metadata = { title: "Editar case" };

export default async function EditCasePage({ params, searchParams }: PageProps<"/admin/cases/[id]">) {
  const { id } = await params;
  const user = await requirePageAccess("case", "view", `/admin/cases/${id}`);
  const [snapshot, images, query] = await Promise.all([loadCmsSnapshot(), loadImageOptions(), searchParams]);
  const item = snapshot.cases.find((entry) => entry.id === id);
  if (!item) notFound();
  const now = new Date();
  const warnings = findIntegrityIssues(snapshot, now)
    .filter((issue) => issue.severity === "warning" && issue.entity.type === "case" && issue.entity.id === item.id)
    .map((issue) => issue.message);
  return (
    <>
      <CmsHeader title={item.title} trail={[{ label: "Cases", href: "/admin/cases" }, { label: item.title }]} />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
          {item.status === "archived" ? (
            <p className="mb-5 rounded-2xl bg-benja-creme px-4 py-3 text-sm">
              Case arquivado: restaure como rascunho para editar.
            </p>
          ) : null}
          <CaseForm
            action={saveCase}
            item={item}
            categories={snapshot.categories}
            services={snapshot.services}
            images={[...images].reverse()}
            readOnly={!can(user.role, "case", "edit") || item.status === "archived"}
          />
        </div>
        <ItemPanel
          item={item}
          publicHref={CASE.publicPath(item)}
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
