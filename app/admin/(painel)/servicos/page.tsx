/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Lista de serviços no CMS.

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
import { CmsHeader, CmsLinkButton } from "@/components/admin/cms/cms-header";
import { CmsTable } from "@/components/admin/cms/cms-table";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { can } from "@/lib/domain/auth/rbac";
import { FEATURED_LIMITS } from "@/lib/domain/content/integrity";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot } from "@/lib/server/cms/context";

export const metadata: Metadata = { title: "Serviços" };

/** Serviços (ADM-06): lista com estado, áreas, destaque na Home e ordem. */
export default async function ServicesAdminPage({ searchParams }: PageProps<"/admin/servicos">) {
  const user = await requirePageAccess("service", "view", "/admin/servicos");
  const [snapshot, query] = await Promise.all([loadCmsSnapshot(), searchParams]);
  const areaName = new Map(snapshot.areas.map((area) => [area.id, area.name]));
  const featured = snapshot.services.filter((service) => service.featured && service.status === "published").length;
  return (
    <>
      <CmsHeader title="Serviços" trail={[{ label: "Serviços" }]}>
        {can(user.role, "service", "create") ? (
          <CmsLinkButton href="/admin/servicos/novo">Novo serviço</CmsLinkButton>
        ) : null}
      </CmsHeader>
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <p className="mb-4 text-sm text-benja-grafite/80">
        Em destaque na Home: <strong>{featured}</strong> de {FEATURED_LIMITS.services} publicados.
      </p>
      <CmsTable
        basePath="/admin/servicos"
        extraHeader="Áreas"
        rows={snapshot.services.map((service) => ({
          ...service,
          title: service.featured ? `${service.name} ★` : service.name,
          extra:
            service.areaIds
              .map((id) => areaName.get(id))
              .filter(Boolean)
              .join(", ") || "—",
        }))}
        empty={<p>Nenhum serviço cadastrado ainda. Comece criando o primeiro.</p>}
      />
    </>
  );
}
