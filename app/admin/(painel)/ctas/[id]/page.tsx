/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Edição e publicação de CTA no CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-11).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { CommandBar } from "@/components/admin/cms/command-bar";
import { CtaForm } from "@/components/admin/cms/cta-form";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { ItemPanel } from "@/components/admin/cms/item-panel";
import { can } from "@/lib/domain/auth/rbac";
import { CTA_PLACEMENTS_ON_SITE, ctaTargetOptions } from "@/lib/domain/content/cta-schema";
import { findIntegrityIssues, resolveCtaHref } from "@/lib/domain/content/integrity";
import { allowedCommands } from "@/lib/domain/content/publication";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { publishProblems } from "@/lib/server/cms/content-service";
import { loadCmsSnapshot } from "@/lib/server/cms/context";
import { CTA } from "@/lib/server/cms/entities";
import { ctaCommand, saveCta } from "../actions";

export const metadata: Metadata = { title: "Editar CTA" };

export default async function EditCtaPage({ params, searchParams }: PageProps<"/admin/ctas/[id]">) {
  const { id } = await params;
  const user = await requirePageAccess("cta", "view", `/admin/ctas/${id}`);
  const [snapshot, query] = await Promise.all([loadCmsSnapshot(), searchParams]);
  const cta = snapshot.ctas.find((item) => item.id === id);
  if (!cta) notFound();

  const now = new Date();
  const onSite = CTA_PLACEMENTS_ON_SITE.includes(cta.placement);
  const warnings = [
    ...findIntegrityIssues(snapshot, now)
      .filter((issue) => issue.entity.type === "cta" && issue.entity.id === cta.id)
      .map((issue) => issue.message),
    ...(onSite ? [] : ["O site ainda não mostra botões nesta posição: publicar aqui não muda nenhuma página."]),
  ];
  const readOnly = !can(user.role, "cta", "edit") || cta.status === "archived";
  const link = resolveCtaHref(cta.target, snapshot, now);

  return (
    <>
      <CmsHeader title={cta.label} trail={[{ label: "CTAs e destaques", href: "/admin/ctas" }, { label: cta.label }]} />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
          {cta.status === "archived" ? (
            <p className="mb-5 rounded-2xl bg-benja-creme px-4 py-3 text-sm">
              CTA arquivado: restaure como rascunho para editar.
            </p>
          ) : null}
          <CtaForm action={saveCta} cta={cta} options={ctaTargetOptions(snapshot, cta.target)} readOnly={readOnly} />
        </div>
        <ItemPanel
          item={cta}
          publicHref={onSite ? CTA.publicPath(cta) : undefined}
          missing={publishProblems(CTA, cta, snapshot, now)}
          warnings={warnings}
        >
          <CommandBar
            action={ctaCommand}
            id={cta.id}
            updatedAt={cta.updatedAt}
            commands={allowedCommands(cta.status, user.role, "cta")}
          />
          <section className="rounded-3xl border-2 border-benja-noite/15 bg-white p-5 text-sm">
            <h2 className="font-bold">Para onde o botão leva hoje</h2>
            <p className="mt-2 break-all">{link.href}</p>
          </section>
        </ItemPanel>
      </div>
    </>
  );
}
