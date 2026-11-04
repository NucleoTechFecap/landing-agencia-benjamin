/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Componentes
 Arquivo      : version-list.tsx
 Descrição    : Linha do tempo das versões: quem alterou, quando e o que foi feito.

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

import Link from "next/link";
import {
  VERSION_ACTION_LABELS,
  VERSION_ENTITY_LABELS,
  hasSnapshot,
  historyPath,
  type ContentVersion,
} from "@/lib/domain/content/versions";
import { Avatar, EmptyPanel } from "../ui/primitives";
import { formatDateTime } from "./cms-table";

/** Sem nome: a conta foi removida do painel, ou a alteração veio de uma operação do NúcleoTech. */
export const authorLabel = (version: Pick<ContentVersion, "authorId" | "authorName">): string =>
  version.authorName ?? (version.authorId ? "Pessoa sem nome no perfil" : "Conta removida ou operação interna");

/** `withItem`: a linha do tempo geral, que mostra de qual conteúdo é cada versão. */
export function VersionList({
  versions,
  withItem = false,
  empty,
}: {
  versions: readonly ContentVersion[];
  withItem?: boolean;
  empty: string;
}) {
  if (!versions.length) return <EmptyPanel title="Nada por aqui ainda">{empty}</EmptyPanel>;
  return (
    <ol className="studio-card divide-y divide-studio-linha">
      {versions.map((version) => {
        const author = authorLabel(version);
        const open = hasSnapshot(version.action);
        return (
          <li
            key={`${version.entity}-${version.entityId}-${version.version}`}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4"
          >
            <Avatar name={author} />
            <div className="min-w-0 flex-1 basis-64">
              <p className="font-semibold wrap-anywhere">
                {withItem ? (
                  <>
                    {VERSION_ENTITY_LABELS[version.entity]}:{" "}
                    <Link href={historyPath(version.entity, version.entityId)} prefetch={false} className="studio-link">
                      {version.label ?? "sem nome"}
                    </Link>
                  </>
                ) : (
                  `Versão ${version.version}`
                )}
              </p>
              <p className="text-sm text-studio-suave wrap-anywhere">
                {VERSION_ACTION_LABELS[version.action]}
                {version.restoredFrom ? ` (a versão ${version.restoredFrom})` : ""}
                {version.summary ? `: ${version.summary}` : ""}
              </p>
              <p className="text-xs text-studio-suave">
                <strong className="font-semibold">{author}</strong> em {formatDateTime(version.createdAt)}
              </p>
            </div>
            {open ? (
              <Link
                href={historyPath(version.entity, version.entityId, version.version)}
                prefetch={false}
                className="studio-btn studio-btn-secundario"
              >
                Ver e restaurar<span className="sr-only"> a versão {version.version}</span>
              </Link>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
