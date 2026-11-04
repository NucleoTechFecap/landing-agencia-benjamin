/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Uma versão do conteúdo comparada com o que está valendo, com a opção de restaurar.

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
import { RestoreVersionForm } from "@/components/admin/cms/restore-version-form";
import { authorLabel } from "@/components/admin/cms/version-list";
import { formatDateTime } from "@/components/admin/cms/cms-table";
import { Notice } from "@/components/admin/ui/primitives";
import { can } from "@/lib/domain/auth/rbac";
import {
  VERSION_ACTION_LABELS,
  changeLabel,
  diffSnapshots,
  historyPath,
  isVersionEntity,
  versionResource,
} from "@/lib/domain/content/versions";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { cmsDeps } from "@/lib/server/cms/context";
import { versionLabelLookup, versionNameLookup, currentOfVersioned } from "@/lib/server/cms/versions";
import { restoreVersionAction } from "../../../actions";

export const metadata: Metadata = { title: "Versão" };

export default async function VersionPage({ params }: PageProps<"/admin/historico/[entidade]/[id]/[versao]">) {
  const { entidade, id, versao } = await params;
  const number = Number(versao);
  if (!isVersionEntity(entidade) || !Number.isInteger(number) || number < 1) notFound();
  const user = await requirePageAccess(
    versionResource(entidade),
    "view",
    `/admin/historico/${entidade}/${id}/${versao}`,
  );
  const deps = await cmsDeps();
  const version = await deps.store.readVersion(entidade, id, number);
  if (!version?.snapshot) notFound();
  const current = await currentOfVersioned(deps, entidade, id);
  const [labelOf, nameOf] = await Promise.all([
    versionLabelLookup(entidade, current?.slug),
    versionNameLookup(deps, entidade),
  ]);
  const changes = diffSnapshots(current?.snapshot ?? null, version.snapshot, nameOf);
  const archived = current?.status === "archived";
  const canRestore = can(user.role, versionResource(entidade), "edit") && current !== null && !archived;
  return (
    <>
      <CmsHeader
        title={`Versão ${version.version}${version.label ? `: ${version.label}` : ""}`}
        description={`${VERSION_ACTION_LABELS[version.action]} por ${authorLabel(version)} em ${formatDateTime(version.createdAt)}.`}
      >
        <CmsSecondaryLink href={historyPath(entidade, id)}>Todas as versões</CmsSecondaryLink>
      </CmsHeader>
      <div className="max-w-5xl space-y-6">
        {current === null ? (
          <Notice tone="atencao">
            Este conteúdo foi excluído. A versão fica guardada, mas não pode ser restaurada aqui.
          </Notice>
        ) : null}
        {archived ? <Notice tone="atencao">Este conteúdo está arquivado: restaure como rascunho antes.</Notice> : null}
        {changes.length === 0 ? (
          <Notice tone="sucesso">O conteúdo atual é igual a esta versão: não há o que restaurar.</Notice>
        ) : (
          <div className="studio-card relative overflow-x-auto">
            <table className="studio-tabela">
              <caption className="sr-only">Diferenças entre o conteúdo atual e a versão {version.version}</caption>
              <thead>
                <tr>
                  <th scope="col">Campo</th>
                  <th scope="col">Hoje</th>
                  <th scope="col">Nesta versão</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((change) => {
                  // Campo do catálogo sem valor gravado mostra o texto padrão no site: não está vazio.
                  const blank = change.path.startsWith("fields.values.") ? "Texto original" : "vazio";
                  return (
                    <tr key={change.path}>
                      <th scope="row" className="px-4 py-3 text-left align-top font-semibold wrap-anywhere">
                        {changeLabel(change.path, labelOf)}
                      </th>
                      <td className="max-w-md px-4 py-3 align-top text-sm whitespace-pre-line wrap-anywhere">
                        {change.before || <em className="text-studio-suave">{blank}</em>}
                      </td>
                      <td className="max-w-md px-4 py-3 align-top text-sm whitespace-pre-line wrap-anywhere">
                        {change.after || <em className="text-studio-suave">{blank}</em>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {canRestore && changes.length > 0 ? (
          <RestoreVersionForm
            action={restoreVersionAction}
            entity={entidade}
            entityId={id}
            version={version.version}
            expectedUpdatedAt={current.updatedAt}
            live={current.live}
          />
        ) : null}
      </div>
    </>
  );
}
