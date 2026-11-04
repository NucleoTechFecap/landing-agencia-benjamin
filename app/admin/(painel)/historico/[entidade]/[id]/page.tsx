/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Histórico de um item: todas as versões, com autor e data.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CmsHeader, CmsSecondaryLink } from "@/components/admin/cms/cms-header";
import { VersionList } from "@/components/admin/cms/version-list";
import {
  VERSION_ENTITY_LABELS,
  isVersionEntity,
  versionItemPath,
  versionResource,
} from "@/lib/domain/content/versions";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { cmsDeps } from "@/lib/server/cms/context";
import { listItemVersions } from "@/lib/server/cms/versions";

export const metadata: Metadata = { title: "Histórico" };

export default async function ItemHistoryPage({ params }: PageProps<"/admin/historico/[entidade]/[id]">) {
  const { entidade, id } = await params;
  if (!isVersionEntity(entidade)) notFound();
  await requirePageAccess(versionResource(entidade), "view", `/admin/historico/${entidade}/${id}`);
  const versions = await listItemVersions(await cmsDeps(), entidade, id);
  const name = versions.find((version) => version.label)?.label ?? VERSION_ENTITY_LABELS[entidade];
  return (
    <>
      <CmsHeader
        title={`Histórico: ${name}`}
        description="Cada linha é uma alteração gravada. Restaurar não apaga nada: vira uma versão nova, que também pode ser desfeita."
      >
        <CmsSecondaryLink href={versionItemPath(entidade, id)}>Voltar à edição</CmsSecondaryLink>
      </CmsHeader>
      <VersionList versions={versions} empty="Este conteúdo ainda não foi alterado desde que o histórico começou." />
    </>
  );
}
