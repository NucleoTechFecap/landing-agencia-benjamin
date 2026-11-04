/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : cases-view.tsx
 Descrição    : Conteúdo do portfólio de cases, usado pela rota e pela prévia do painel.

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

import { Suspense } from "react";
import { CaseCard } from "@/components/cards/case-card";
import { CaseFilters, type ActiveFilters } from "@/components/sections/case-filters";
import { ClosingCta, closingLinks } from "@/components/sections/closing-cta";
import { PageBlocks } from "@/components/sections/page-blocks";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { Section } from "@/components/ui/section";
import { CardsSkeleton, EmptyState, LoadingState } from "@/components/ui/states";
import { siteUrl } from "@/lib/config/public-env";
import { isSectionHidden, pageFields, type ResolvedPage } from "@/lib/domain/content/catalog";
import type { CASES } from "@/lib/domain/content/catalog/cases";
import { fillText } from "@/lib/domain/content/fields";
import { isValidSlug } from "@/lib/domain/content/slug";
import type { Page } from "@/lib/domain/content/types";
import { itemListSchema } from "@/lib/domain/seo/structured-data";
import { getPage, listAreas, listCases, listCategories, listServices } from "@/lib/server/content/repository";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** A prévia do painel renderiza a página sem filtros na URL. */
const NO_PARAMS: SearchParams = Promise.resolve({});

/** Portfólio com filtros por categoria, serviço e área (CASE-01, CASE-03). */
export async function CasesView({
  page,
  searchParams = NO_PARAMS,
}: {
  page: Page | null;
  searchParams?: SearchParams;
}) {
  const [allCases, geralPage] = await Promise.all([listCases(), getPage("site-geral")]);
  const campos = pageFields("cases", page);
  const geral = pageFields("site-geral", geralPage);
  const { abertura, fechamento } = campos;

  return (
    <>
      <JsonLd
        data={itemListSchema(
          "Cases da Agência Benjamin",
          allCases.map((item) => ({ name: item.title, path: `/cases/${item.slug}` })),
          siteUrl,
        )}
      />
      <PageHero
        eyebrow={abertura.etiqueta}
        title={abertura.titulo}
        description={abertura.descricao ? <p>{abertura.descricao}</p> : undefined}
        path="/cases"
        breadcrumbs={[{ label: geral.mensagens.inicio, href: "/" }, { label: abertura.trilha }]}
        tone={abertura.fundo}
        icon={abertura.icone.name}
        iconColor={abertura.icone.color}
      />
      <Section tone="claro" halftone labelledBy="portfolio-titulo">
        <h2 id="portfolio-titulo" className="sr-only">
          Lista de cases
        </h2>
        {/* Os filtros dependem da URL: ficam atrás de Suspense (Cache Components). */}
        <Suspense
          fallback={
            <>
              <LoadingState label={campos.lista.carregando} />
              <CardsSkeleton className="mt-6" />
            </>
          }
        >
          <FilteredCases
            searchParams={searchParams}
            filtros={campos.filtros}
            lista={campos.lista}
            ctaLabel={geral.mensagens.verCase}
          />
        </Suspense>
      </Section>
      <PageBlocks page={page} />
      {isSectionHidden(page, "fechamento") ? null : (
        <ClosingCta
          title={fechamento.titulo}
          description={fechamento.texto}
          sticker={geral.fechamento.sticker.src}
          links={closingLinks(fechamento.botao1, fechamento.botao2)}
        />
      )}
    </>
  );
}

const pick = (value: string | string[] | undefined) => {
  const single = Array.isArray(value) ? value[0] : value;
  return single && isValidSlug(single) ? single : undefined;
};

async function FilteredCases({
  searchParams,
  filtros,
  lista,
  ctaLabel,
}: {
  searchParams: SearchParams;
  filtros: ResolvedPage<typeof CASES>["filtros"];
  lista: ResolvedPage<typeof CASES>["lista"];
  ctaLabel: string;
}) {
  const params = await searchParams;
  const [categories, services, areas, allCases] = await Promise.all([
    listCategories(),
    listServices(),
    listAreas(),
    listCases(),
  ]);
  const clients = [...new Set(allCases.map((item) => item.client))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const rawClient = Array.isArray(params.cliente) ? params.cliente[0] : params.cliente;
  const active: ActiveFilters = {
    categoria: pick(params.categoria),
    servico: pick(params.servico),
    area: pick(params.area),
    // Cliente aceita só valores existentes (evita refletir texto arbitrário na página).
    cliente: clients.find((client) => client === rawClient),
  };
  const cases = await listCases({
    category: active.categoria,
    service: active.servico,
    area: active.area,
    client: active.cliente,
  });
  const option = (item: { slug: string; name: string }) => ({ slug: item.slug, name: item.name });
  const filtered = Object.values(active).some(Boolean);

  return (
    <>
      <CaseFilters
        categories={categories.map(option)}
        services={services.map(option)}
        areas={areas.map(option)}
        clients={clients}
        active={active}
        textos={filtros}
      />
      <p role="status" className="mt-6 text-sm font-bold">
        {cases.length === 1 ? lista.um : fillText(lista.varios, { total: cases.length })}
      </p>
      {cases.length > 0 ? (
        <ul data-motion="cards" className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map((item, index) => (
            <li key={item.id}>
              <CaseCard item={item} priority={index === 0} ctaLabel={ctaLabel} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mt-4 bg-benja-nyanza"
          action={filtered ? { href: "/cases", label: lista.limpar } : undefined}
        >
          {filtered ? lista.vazioFiltro : lista.vazio}
        </EmptyState>
      )}
    </>
  );
}
