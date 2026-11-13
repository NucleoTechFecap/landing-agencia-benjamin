/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Edição e publicação de área de atuação no CMS.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Link para os serviços da área (ADM-06).
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AreaForm } from "@/components/admin/cms/area-form";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { CommandBar } from "@/components/admin/cms/command-bar";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { ItemPanel } from "@/components/admin/cms/item-panel";
import { StatusBadge } from "@/components/admin/cms/status-badge";
import { can } from "@/lib/domain/auth/rbac";
import { findIntegrityIssues } from "@/lib/domain/content/integrity";
import { allowedCommands } from "@/lib/domain/content/publication";
import { historyPath } from "@/lib/domain/content/versions";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { publishProblems } from "@/lib/server/cms/content-service";
import { loadCmsSnapshot } from "@/lib/server/cms/context";
import { AREA } from "@/lib/server/cms/entities";
import { areaCommand, saveArea } from "../actions";

export const metadata: Metadata = { title: "Editar área" };

export default async function EditAreaPage({ params, searchParams }: PageProps<"/admin/areas/[id]">) {
  const { id } = await params;
  const user = await requirePageAccess("area", "view", `/admin/areas/${id}`);
  const [snapshot, query] = await Promise.all([loadCmsSnapshot(), searchParams]);
  const area = snapshot.areas.find((item) => item.id === id);
  if (!area) notFound();

  const now = new Date();
  const services = snapshot.services.filter((service) => service.areaIds.includes(area.id));
  const warnings = findIntegrityIssues(snapshot, now)
    .filter((issue) => issue.entity.type === "area" && issue.entity.id === area.id)
    .map((issue) => issue.message);
  const readOnly = !can(user.role, "area", "edit") || area.status === "archived";

  return (
    <>
      <CmsHeader title={area.name} />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="studio-card p-4 sm:p-6">
          {area.status === "archived" ? (
            <p className="mb-5 rounded-studio-md bg-studio-realce px-4 py-3 text-sm">
              Área arquivada: restaure como rascunho para editar.
            </p>
          ) : null}
          <AreaForm action={saveArea} area={area} readOnly={readOnly} />
        </div>
        <ItemPanel
          item={area}
          historyHref={historyPath("area", area.id)}
          publicHref={AREA.publicPath(area)}
          missing={publishProblems(AREA, area, snapshot, now)}
          warnings={warnings}
        >
          <CommandBar
            action={areaCommand}
            id={area.id}
            updatedAt={area.updatedAt}
            commands={allowedCommands(area.status, user.role, "area")}
          />
          <section className="studio-card p-5 text-sm">
            <h2 className="font-bold">Serviços desta área</h2>
            {services.length ? (
              <ul className="mt-2 space-y-2">
                {services.map((service) => (
                  <li key={service.id} className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/admin/servicos/${service.id}`}
                      className="inline-block py-0.5 text-benja-verde underline-offset-4 hover:underline"
                    >
                      {service.name}
                    </Link>
                    <StatusBadge status={service.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-studio-suave">
                Nenhum serviço vinculado. O vínculo é feito no cadastro do serviço.
              </p>
            )}
          </section>
        </ItemPanel>
      </div>
    </>
  );
}
