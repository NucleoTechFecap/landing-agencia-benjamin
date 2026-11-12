/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Histórico de versões de uma página.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Histórico de página (FUT-04).
════════════════════════════════════════════════════════════════════════════════
*/
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CmsHeader, CmsSecondaryLink } from "@/components/admin/cms/cms-header";
import { formatDateTime } from "@/components/admin/cms/cms-table";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot } from "@/lib/server/cms/context";
import { listPageVersions } from "@/lib/server/history/pages";

export const metadata: Metadata = { title: "Histórico de versões" };
export default async function PageHistory({ params, searchParams }: PageProps<"/admin/paginas/[id]/historico">) {
  const { id } = await params;
  await requirePageAccess("page", "view", `/admin/paginas/${id}/historico`);
  const [snapshot, query] = await Promise.all([loadCmsSnapshot(), searchParams]);
  const page = snapshot.pages.find((item) => item.id === id);
  if (!page) notFound();
  const value = typeof query.pagina === "string" ? query.pagina : "";
  const current = /^\d{1,5}$/.test(value) ? Math.max(1, Number(value)) : 1;
  const { versions, actors, hasNext } = await listPageVersions(id, current);
  return (
    <>
      <CmsHeader title="Histórico de versões" description={`Versões guardadas de ${page.title}.`}>
        <CmsSecondaryLink href={`/admin/paginas/${id}`}>Voltar à página</CmsSecondaryLink>
      </CmsHeader>
      <div className="studio-card overflow-x-auto">
        <table className="studio-tabela">
          <caption className="sr-only">Versões guardadas da página</caption>
          <thead>
            <tr>
              <th scope="col">Quando</th>
              <th scope="col">Quem</th>
              <th scope="col">Versão</th>
            </tr>
          </thead>
          <tbody>
            {versions.map((version) => (
              <tr key={version.id}>
                <td className="px-4 py-3">{formatDateTime(version.created_at)}</td>
                <td className="px-4 py-3">
                  {version.actor_id ? actors[version.actor_id] || "Pessoa da equipe" : "Sistema"}
                </td>
                <td className="px-4 py-3">
                  <Link className="studio-link" href={`/admin/paginas/${id}/historico/${version.id}`}>
                    Ver versão<span className="sr-only"> de {formatDateTime(version.created_at)}</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {versions.length === 0 ? <p className="p-5">Nenhuma versão registrada.</p> : null}
      </div>
      <nav aria-label="Páginas do histórico" className="mt-5 flex gap-5 text-sm font-bold">
        {current > 1 ? (
          <Link className="studio-link" href={`?pagina=${current - 1}`}>
            Anterior
          </Link>
        ) : null}
        <span>Página {current}</span>
        {hasNext ? (
          <Link className="studio-link" href={`?pagina=${current + 1}`}>
            Próxima
          </Link>
        ) : null}
      </nav>
    </>
  );
}
