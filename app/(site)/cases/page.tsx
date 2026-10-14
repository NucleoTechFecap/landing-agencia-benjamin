/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Portfólio de cases com filtros e contagem de resultados.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { Suspense } from "react";
import { CaseCard } from "@/components/cards/case-card";
import { CaseFilters, type ActiveFilters } from "@/components/sections/case-filters";
import { ClosingCta } from "@/components/sections/closing-cta";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { isValidSlug } from "@/lib/domain/content/slug";
import { listAreas, listCases, listCategories, listServices } from "@/lib/server/content/repository";

export const metadata: Metadata = {
  title: "Cases e portfólio",
  description:
    "Portfólio da Agência Benjamin: cases de copywriting, social media & criação e assessoria de imprensa desenvolvidos para clientes reais.",
};

/** Portfólio com filtros por categoria, serviço e área (CASE-01, CASE-03). */
export default function CasesPage({ searchParams }: PageProps<"/cases">) {
  return (
    <>
      <PageHero
        eyebrow="Portfólio"
        title="Cases e conteúdos"
        description={<p>Trabalhos desenvolvidos pela Agência Benjamin para clientes, parceiros e para a própria FECAP.</p>}
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Cases" }]}
        icon="coracao"
        iconColor="rosa"
      />
      <Section tone="claro" halftone labelledBy="portfolio-titulo">
        <h2 id="portfolio-titulo" className="sr-only">
          Lista de cases
        </h2>
        {/* Os filtros dependem da URL: ficam atrás de Suspense (Cache Components). */}
        <Suspense fallback={<p className="font-bold">Carregando cases…</p>}>
          <FilteredCases searchParams={searchParams} />
        </Suspense>
      </Section>
      <ClosingCta
        title="Seu projeto pode ser o próximo case."
        links={[
          { id: "contato", label: "Quero um projeto", href: "/contato#formulario", external: false },
          { id: "servicos", label: "Ver serviços", href: "/servicos", external: false },
        ]}
      />
    </>
  );
}

const pick = (value: string | string[] | undefined) => {
  const single = Array.isArray(value) ? value[0] : value;
  return single && isValidSlug(single) ? single : undefined;
};

async function FilteredCases({ searchParams }: Pick<PageProps<"/cases">, "searchParams">) {
  const params = await searchParams;
  const [categories, services, areas, allCases] = await Promise.all([listCategories(), listServices(), listAreas(), listCases()]);
  const clients = [...new Set(allCases.map((item) => item.client))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const rawClient = Array.isArray(params.cliente) ? params.cliente[0] : params.cliente;
  const active: ActiveFilters = {
    categoria: pick(params.categoria),
    servico: pick(params.servico),
    area: pick(params.area),
    // Cliente aceita só valores existentes (evita refletir texto arbitrário na página).
    cliente: clients.find((client) => client === rawClient),
  };
  const cases = await listCases({ category: active.categoria, service: active.servico, area: active.area, client: active.cliente });
  const option = (item: { slug: string; name: string }) => ({ slug: item.slug, name: item.name });

  return (
    <>
      <CaseFilters
        categories={categories.map(option)}
        services={services.map(option)}
        areas={areas.map(option)}
        clients={clients}
        active={active}
      />
      <p role="status" className="mt-6 text-sm font-bold">
        {cases.length === 1 ? "1 case encontrado" : `${cases.length} cases encontrados`}
      </p>
      {cases.length > 0 ? (
        <ul className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((item, index) => (
            <li key={item.id}>
              <CaseCard item={item} priority={index === 0} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-3xl border-2 border-dashed border-benja-verde/50 bg-benja-nyanza p-8 text-center">
          Nenhum case com esses filtros por enquanto. Tente outra combinação.
        </p>
      )}
    </>
  );
}
