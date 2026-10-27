/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Edição e publicação de serviço no CMS.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-06).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { CommandBar } from "@/components/admin/cms/command-bar";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { ItemPanel } from "@/components/admin/cms/item-panel";
import { ServiceForm } from "@/components/admin/cms/service-form";
import { StatusBadge } from "@/components/admin/cms/status-badge";
import { can } from "@/lib/domain/auth/rbac";
import { findIntegrityIssues } from "@/lib/domain/content/integrity";
import { allowedCommands } from "@/lib/domain/content/publication";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { publishProblems } from "@/lib/server/cms/content-service";
import { loadCmsSnapshot, loadImageOptions } from "@/lib/server/cms/context";
import { SERVICE } from "@/lib/server/cms/entities";
import { saveService, serviceCommand } from "../actions";

export const metadata: Metadata = { title: "Editar serviço" };

export default async function EditServicePage({ params, searchParams }: PageProps<"/admin/servicos/[id]">) {
  const { id } = await params;
  const user = await requirePageAccess("service", "view", `/admin/servicos/${id}`);
  const [snapshot, images, query] = await Promise.all([loadCmsSnapshot(), loadImageOptions(), searchParams]);
  const service = snapshot.services.find((item) => item.id === id);
  if (!service) notFound();

  const now = new Date();
  const cases = snapshot.cases.filter((item) => item.serviceIds.includes(service.id));
  const warnings = findIntegrityIssues(snapshot, now)
    .filter(
      (issue) => issue.severity === "warning" && issue.entity.type === "service" && issue.entity.id === service.id,
    )
    .map((issue) => issue.message);

  return (
    <>
      <CmsHeader
        title={service.name}
        trail={[{ label: "Serviços", href: "/admin/servicos" }, { label: service.name }]}
      />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
          {service.status === "archived" ? (
            <p className="mb-5 rounded-2xl bg-benja-creme px-4 py-3 text-sm">
              Serviço arquivado: restaure como rascunho para editar.
            </p>
          ) : null}
          <ServiceForm
            action={saveService}
            service={service}
            areas={snapshot.areas}
            images={images}
            readOnly={!can(user.role, "service", "edit") || service.status === "archived"}
          />
        </div>
        <ItemPanel
          item={service}
          publicHref={SERVICE.publicPath(service)}
          missing={publishProblems(SERVICE, service, snapshot, now)}
          warnings={warnings}
        >
          <CommandBar
            action={serviceCommand}
            id={service.id}
            updatedAt={service.updatedAt}
            commands={allowedCommands(service.status, user.role, "service")}
          />
          <section className="rounded-3xl border-2 border-benja-noite/15 bg-white p-5 text-sm">
            <h2 className="font-bold">Cases com este serviço</h2>
            {cases.length ? (
              <ul className="mt-2 space-y-2">
                {cases.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{item.title}</span>
                    <StatusBadge status={item.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-benja-grafite/80">Nenhum case relacionado ainda.</p>
            )}
            <p className="mt-3 text-benja-grafite/80">
              O botão &quot;Fale com a gente&quot; da página do serviço já leva ao contato com este serviço
              pré-selecionado.
            </p>
            {service.areaIds.length ? (
              <p className="mt-3">
                Áreas:{" "}
                {service.areaIds.map((areaId, index) => {
                  const area = snapshot.areas.find((item) => item.id === areaId);
                  return area ? (
                    <span key={areaId}>
                      {index ? ", " : ""}
                      <Link
                        href={`/admin/areas/${area.id}`}
                        className="text-benja-verde underline-offset-4 hover:underline"
                      >
                        {area.name}
                      </Link>
                    </span>
                  ) : null;
                })}
              </p>
            ) : null}
          </section>
        </ItemPanel>
      </div>
    </>
  );
}
