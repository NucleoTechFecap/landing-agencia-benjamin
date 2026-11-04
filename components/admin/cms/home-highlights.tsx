/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : home-highlights.tsx
 Descrição    : Painel dos serviços e cases em destaque na Home, com o caminho para editar cada um.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-11).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import { FEATURED_LIMITS } from "@/lib/domain/content/integrity";
import type { Publishable } from "@/lib/domain/content/types";
import { isPubliclyVisible } from "@/lib/domain/content/visibility";
import { StatusBadge } from "./status-badge";

interface Highlight extends Publishable {
  id: string;
  name: string;
  featured: boolean;
  order: number;
}

function HighlightColumn({
  title,
  items,
  limit,
  basePath,
  listLabel,
  empty,
  now,
}: {
  title: string;
  items: Highlight[];
  limit: number;
  basePath: string;
  listLabel: string;
  empty: string;
  now: Date;
}) {
  const featured = items
    .filter((item) => item.featured && item.status !== "archived")
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "pt-BR"));
  const live = featured.filter((item) => isPubliclyVisible(item, now)).length;
  return (
    <section className="studio-card p-5 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-bold">{title}</h3>
        <p className="text-studio-suave">
          {live} de {limit} no site
        </p>
      </div>
      {live > limit ? (
        <p className="mt-2 rounded-studio-sm bg-studio-realce px-3 py-2">
          Há mais destaques publicados do que o limite: a Home mostra só os {limit} primeiros, pela ordem.
        </p>
      ) : null}
      {featured.length ? (
        <ul className="mt-3 space-y-2">
          {featured.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
              <Link
                href={`${basePath}/${item.id}`}
                className="inline-flex min-h-6 items-center text-benja-verde underline-offset-4 hover:underline"
              >
                {item.name}
              </Link>
              <StatusBadge status={item.status} provisional={item.provisional} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-studio-suave">{empty}</p>
      )}
      <p className="mt-3">
        <Link href={basePath} className="inline-flex min-h-6 items-center studio-link">
          {listLabel}
        </Link>
      </p>
    </section>
  );
}

/**
 * Destaques da Home: não há cadastro próprio. A marca fica em cada serviço e case (ADM-06/ADM-08),
 * e esta tela só mostra o conjunto e leva até o item.
 */
export function HomeHighlights({ services, cases, now }: { services: Highlight[]; cases: Highlight[]; now: Date }) {
  return (
    <section aria-labelledby="destaques-titulo" className="mt-10">
      <h2 id="destaques-titulo" className="studio-titulo-secao">
        Destaques da Home
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-studio-suave">
        O destaque é marcado no cadastro de cada serviço ou case, na opção <strong>Destacar na Home</strong>. Só o que
        está publicado aparece no site.
      </p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <HighlightColumn
          title="Serviços em destaque"
          items={services}
          limit={FEATURED_LIMITS.services}
          basePath="/admin/servicos"
          listLabel="Abrir serviços"
          empty="Nenhum serviço em destaque: a Home mostra um aviso no lugar da lista."
          now={now}
        />
        <HighlightColumn
          title="Cases em destaque"
          items={cases}
          limit={FEATURED_LIMITS.cases}
          basePath="/admin/cases"
          listLabel="Abrir cases"
          empty="Nenhum case em destaque: a Home mostra um aviso no lugar da lista."
          now={now}
        />
      </div>
    </section>
  );
}
