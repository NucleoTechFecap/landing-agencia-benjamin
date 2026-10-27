/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Lista de áreas de atuação no CMS.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { CmsHeader, CmsLinkButton } from "@/components/admin/cms/cms-header";
import { CmsTable } from "@/components/admin/cms/cms-table";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { can } from "@/lib/domain/auth/rbac";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot } from "@/lib/server/cms/context";

export const metadata: Metadata = { title: "Áreas de atuação" };

/** Áreas de atuação (ADM-07): seis áreas institucionais, com estado e serviços vinculados. */
export default async function AreasAdminPage({ searchParams }: PageProps<"/admin/areas">) {
  const user = await requirePageAccess("area", "view", "/admin/areas");
  const [snapshot, query] = await Promise.all([loadCmsSnapshot(), searchParams]);
  const servicesPerArea = (id: string) => snapshot.services.filter((service) => service.areaIds.includes(id)).length;
  return (
    <>
      <CmsHeader title="Áreas de atuação" trail={[{ label: "Áreas" }]}>
        {can(user.role, "area", "create") ? <CmsLinkButton href="/admin/areas/nova">Nova área</CmsLinkButton> : null}
      </CmsHeader>
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <CmsTable
        basePath="/admin/areas"
        extraHeader="Serviços"
        rows={snapshot.areas.map((area) => ({ ...area, title: area.name, extra: servicesPerArea(area.id) }))}
        empty={<p>Nenhuma área cadastrada ainda. Comece criando a primeira.</p>}
      />
    </>
  );
}
