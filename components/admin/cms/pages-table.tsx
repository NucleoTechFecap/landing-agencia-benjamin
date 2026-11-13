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
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import {
  PAGE_ROUTE_LABELS,
  PAGE_ROUTES,
  ROUTED_PAGE_SLUGS,
  isFreePageSlug,
  pagePath,
} from "@/lib/domain/content/blocks";
import { CATALOG_SLUGS, PAGE_CATALOG } from "@/lib/domain/content/catalog";
import type { Page } from "@/lib/domain/content/types";
import { formatDateTime } from "./cms-table";
import { StatusBadge } from "./status-badge";

const KIND_PATHS: Readonly<Record<string, string>> = {
  "site-geral": "Todas as páginas",
  "site-formularios": "Formulários do site",
  "modelo-servico": "Todas as páginas de serviço",
  "modelo-case": "Todas as páginas de case",
};

/**
 * Uma linha por rota do site, exista ou não conteúdo gravado para ela, depois as páginas criadas no
 * painel e, por fim, o que aparece em várias páginas (menu, rodapé, formulários e modelos).
 */
export function PagesTable({ pages, canCreate }: { pages: Page[]; canCreate: boolean }) {
  const bySlug = new Map(pages.map((page) => [page.slug, page]));
  const shared = CATALOG_SLUGS.filter((slug) => !pagePath(slug));
  const rows = [
    ...ROUTED_PAGE_SLUGS.map((slug) => ({
      slug,
      label: PAGE_ROUTE_LABELS[slug],
      path: PAGE_ROUTES[slug] as string,
      page: bySlug.get(slug),
    })),
    ...pages
      .filter((page) => isFreePageSlug(page.slug))
      .map((page) => ({ slug: page.slug, label: page.title, path: `/${page.slug}`, page })),
    ...shared.map((slug) => ({
      slug,
      label: PAGE_CATALOG[slug].label,
      path: KIND_PATHS[slug] ?? "Em várias páginas",
      page: bySlug.get(slug),
    })),
  ];
  return (
    // `relative`: o texto sr-only é absoluto e, sem isso, escapa da rolagem e alarga a página no celular.
    <div className="studio-card relative overflow-x-auto">
      <table className="studio-tabela">
        <caption className="sr-only">Páginas do site e estado do conteúdo</caption>
        <thead>
          <tr>
            <th scope="col">Página</th>
            <th scope="col" className="hidden md:table-cell">
              Endereço
            </th>
            <th scope="col" className="hidden md:table-cell">
              Blocos
            </th>
            <th scope="col">Estado</th>
            <th scope="col" className="hidden md:table-cell">
              Atualizado em
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ slug, label, path, page }) => (
            <tr key={slug}>
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
                <div className="mt-1 space-y-0.5 text-xs font-normal text-studio-suave md:hidden">
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
                    className="studio-link inline-block py-1"
                  >
                    Criar conteúdo<span className="sr-only"> da página {label}</span>
                  </Link>
                ) : (
                  "Textos originais"
                )}
              </td>
              <td className="hidden px-4 py-3 whitespace-nowrap text-studio-suave md:table-cell">
                {page ? formatDateTime(page.updatedAt) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
