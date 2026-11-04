/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : pages-table.tsx
 Descrição    : Tabela de rotas e páginas do CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import { PAGE_ROUTE_LABELS, PAGE_ROUTES, ROUTED_PAGE_SLUGS } from "@/lib/domain/content/blocks";
import type { Page } from "@/lib/domain/content/types";
import { formatDateTime } from "./cms-table";
import { StatusBadge } from "./status-badge";

/**
 * Uma linha por rota do site, exista ou não página para ela, e depois as páginas sem rota (só
 * chegam aqui se criadas fora do painel). O estado aparece em texto, não só na cor.
 */
export function PagesTable({ pages, canCreate }: { pages: Page[]; canCreate: boolean }) {
  const bySlug = new Map(pages.map((page) => [page.slug, page]));
  const rows = [
    ...ROUTED_PAGE_SLUGS.map((slug) => ({
      slug,
      label: PAGE_ROUTE_LABELS[slug],
      path: PAGE_ROUTES[slug] as string,
      page: bySlug.get(slug),
    })),
    ...pages
      .filter((page) => !Object.hasOwn(PAGE_ROUTES, page.slug))
      .map((page) => ({ slug: page.slug, label: page.title, path: "Sem rota no site", page })),
  ];
  return (
    // `relative`: o texto sr-only é absoluto e, sem isso, escapa da rolagem e alarga a página no celular.
    <div className="relative overflow-x-auto rounded-3xl border-2 border-benja-noite/15 bg-white">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Páginas do site e estado do conteúdo</caption>
        <thead className="border-b-2 border-benja-noite/10 text-xs tracking-wider text-benja-grafite/80 uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">
              Página
            </th>
            <th scope="col" className="hidden px-4 py-3 md:table-cell">
              Endereço
            </th>
            <th scope="col" className="hidden px-4 py-3 md:table-cell">
              Blocos
            </th>
            <th scope="col" className="px-4 py-3">
              Estado
            </th>
            <th scope="col" className="hidden px-4 py-3 md:table-cell">
              Atualizado em
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ slug, label, path, page }) => (
            <tr key={slug} className="border-b border-benja-noite/5 last:border-0">
              <td className="px-4 py-3 font-semibold wrap-anywhere">
                {page ? (
                  <Link
                    href={`/admin/paginas/${page.id}`}
                    prefetch={false}
                    className="inline-block py-1 text-benja-verde underline-offset-4 hover:underline"
                  >
                    {label}
                  </Link>
                ) : (
                  label
                )}
                {/* No celular, as colunas secundárias viram linhas sob o nome: o estado fica à vista sem rolar. */}
                <div className="mt-1 space-y-0.5 text-xs font-normal text-benja-grafite/80 md:hidden">
                  <p className="font-mono">{path}</p>
                  {page ? (
                    <>
                      <p>Blocos: {page.blocks.length}</p>
                      <p>Atualizado em {formatDateTime(page.updatedAt)}</p>
                    </>
                  ) : null}
                </div>
              </td>
              <td className="hidden px-4 py-3 font-mono text-xs wrap-anywhere md:table-cell">{path}</td>
              <td className="hidden px-4 py-3 tabular-nums md:table-cell">{page ? page.blocks.length : "—"}</td>
              <td className="px-4 py-3">
                {page ? (
                  <StatusBadge status={page.status} provisional={page.provisional} />
                ) : canCreate ? (
                  <Link
                    href={`/admin/paginas/nova?rota=${slug}`}
                    prefetch={false}
                    className="inline-block py-1 font-bold text-benja-verde underline underline-offset-4"
                  >
                    Criar conteúdo<span className="sr-only"> da página {label}</span>
                  </Link>
                ) : (
                  "Só textos fixos"
                )}
              </td>
              <td className="hidden px-4 py-3 text-benja-grafite/80 md:table-cell">
                {page ? formatDateTime(page.updatedAt) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
