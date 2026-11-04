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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-06).
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Link para a prévia protegida (ADM-14).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { CommandBar } from "@/components/admin/cms/command-bar";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { ItemPanel } from "@/components/admin/cms/item-panel";
import { PageTabs } from "@/components/admin/cms/page-tabs";
import { SeoForm } from "@/components/admin/cms/seo-form";
import { ServiceForm } from "@/components/admin/cms/service-form";
import { StatusBadge } from "@/components/admin/cms/status-badge";
import { siteUrl } from "@/lib/config/public-env";
import { can } from "@/lib/domain/auth/rbac";
import { findIntegrityIssues } from "@/lib/domain/content/integrity";
import { previewPath } from "@/lib/domain/content/preview";
import { allowedCommands } from "@/lib/domain/content/publication";
import { historyPath } from "@/lib/domain/content/versions";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { publishProblems } from "@/lib/server/cms/content-service";
import { loadCmsSnapshot, loadImageOptions, loadLastChange } from "@/lib/server/cms/context";
import { SERVICE } from "@/lib/server/cms/entities";
import { saveService, saveServiceSeo, serviceCommand } from "../actions";

export const metadata: Metadata = { title: "Editar serviço" };

export default async function EditServicePage({ params, searchParams }: PageProps<"/admin/servicos/[id]">) {
  const { id } = await params;
  const user = await requirePageAccess("service", "view", `/admin/servicos/${id}`);
  const [snapshot, images, query, lastChange] = await Promise.all([
    loadCmsSnapshot(),
    loadImageOptions(),
    searchParams,
    loadLastChange("service", id),
  ]);
  const service = snapshot.services.find((item) => item.id === id);
  if (!service) notFound();
  const readOnly = !can(user.role, "service", "edit") || service.status === "archived";
  const seoTab = query.aba === "seo";

  const now = new Date();
  const cases = snapshot.cases.filter((item) => item.serviceIds.includes(service.id));
  const warnings = findIntegrityIssues(snapshot, now)
    .filter(
      (issue) => issue.severity === "warning" && issue.entity.type === "service" && issue.entity.id === service.id,
    )
    .map((issue) => issue.message);

  return (
    <>
      <CmsHeader title={service.name} />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <PageTabs
        current={seoTab ? "seo" : "dados"}
        tabs={[
          { id: "dados", label: "Dados do serviço", href: `${SERVICE.adminPath}/${service.id}` },
          { id: "seo", label: "SEO e compartilhamento", href: `${SERVICE.adminPath}/${service.id}?aba=seo` },
        ]}
      />
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 studio-card p-4 sm:p-6">
          {service.status === "archived" ? (
            <p className="mb-5 rounded-studio-md bg-studio-realce px-4 py-3 text-sm">
              Serviço arquivado: restaure como rascunho para editar.
            </p>
          ) : null}
          {seoTab ? (
            <SeoForm
              action={saveServiceSeo}
              item={{ id: service.id, updatedAt: service.updatedAt }}
              seo={service.seo ?? {}}
              base={{ title: `${service.name} — serviço de comunicação`, description: service.summary }}
              path={SERVICE.publicPath(service)}
              siteUrl={siteUrl}
              images={images}
              defaultImageSrc={`${SERVICE.publicPath(service)}/opengraph-image`}
              readOnly={readOnly}
              cancelHref={`${SERVICE.adminPath}/${service.id}`}
            />
          ) : (
            <ServiceForm
              action={saveService}
              service={service}
              areas={snapshot.areas}
              images={images}
              readOnly={readOnly}
            />
          )}
        </div>
        <ItemPanel
          item={service}
          publicHref={SERVICE.publicPath(service)}
          previewHref={previewPath("servico", service.id)}
          historyHref={historyPath("service", service.id)}
          lastChange={lastChange}
          missing={publishProblems(SERVICE, service, snapshot, now)}
          warnings={warnings}
        >
          <CommandBar
            action={serviceCommand}
            id={service.id}
            updatedAt={service.updatedAt}
            commands={allowedCommands(service.status, user.role, "service")}
          />
          <section className="studio-card p-5 text-sm">
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
              <p className="mt-2 text-studio-suave">Nenhum case relacionado ainda.</p>
            )}
            <p className="mt-3 text-studio-suave">
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
                        className="inline-block py-0.5 text-benja-verde underline-offset-4 hover:underline"
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
