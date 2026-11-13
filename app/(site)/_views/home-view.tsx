/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Componentes
 Arquivo      : home-view.tsx
 Descrição    : Conteúdo da Home, usado pela rota e pela prévia do painel.

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

import { AreaCard } from "@/components/cards/area-card";
import { CaseCard } from "@/components/cards/case-card";
import { ServiceCard } from "@/components/cards/service-card";
import { AboutPreview } from "@/components/sections/about-preview";
import { ClosingCta } from "@/components/sections/closing-cta";
import { HeroManifesto } from "@/components/sections/hero-manifesto";
import { PageBlocks } from "@/components/sections/page-blocks";
import type { BrandIconColor } from "@/components/ui/brand-icon";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/states";
import { isSectionHidden, pageFields } from "@/lib/domain/content/catalog";
import { FEATURED_LIMITS } from "@/lib/domain/content/integrity";
import { withPublishedTexts } from "@/lib/domain/content/page-texts";
import { servicesSummary } from "@/lib/domain/content/services-summary";
import type { Page } from "@/lib/domain/content/types";
import {
  getPage,
  getSiteSettings,
  listAreas,
  listCtas,
  listFeaturedCases,
  listServices,
} from "@/lib/server/content/repository";

const AREA_COLORS: BrandIconColor[] = ["verde", "laranja", "azul", "rosa", "verde-claro", "lima"];

/** Home. A prévia do painel passa a página em rascunho; o site passa a publicada. */
export async function HomeView({ page }: { page: Page | null }) {
  const [published, geralPage, heroCtas, highlightCtas, areas, featuredServices, allServices, featuredCases] =
    await Promise.all([
      getSiteSettings(),
      getPage("site-geral"),
      listCtas("home-hero"),
      listCtas("home-highlight"),
      listAreas(),
      listServices({ featuredOnly: true }),
      listServices(),
      listFeaturedCases(),
    ]);
  const settings = page ? withPublishedTexts(published, [page]) : published;
  const campos = pageFields("home", page, settings);
  const geral = pageFields("site-geral", geralPage);

  const toLinks = (ctas: typeof heroCtas) =>
    ctas.map((cta) => ({ id: cta.id, label: cta.label, href: cta.link.href, external: cta.link.external }));
  const solutionsSummary = servicesSummary(allServices.map((service) => service.name));
  // Limite da Home (TECH-05 §4): acima dele o painel avisa, e aqui valem os primeiros pela ordem.
  const homeServices = featuredServices.slice(0, FEATURED_LIMITS.services);

  return (
    <>
      <HeroManifesto
        settings={settings}
        campos={campos.abertura}
        faixa={geral.mensagens.faixa}
        logo={settings.theme?.images?.logoHero}
        ctas={toLinks(heroCtas)}
      />

      {isSectionHidden(page, "quemSomos") ? null : (
        <AboutPreview campos={campos.quemSomos} solutionsSummary={solutionsSummary} />
      )}

      {isSectionHidden(page, "areas") ? null : (
        <Section tone={campos.areas.fundo} halftone labelledBy="areas-titulo">
          <SectionHeading
            id="areas-titulo"
            eyebrow={campos.areas.etiqueta}
            title={campos.areas.titulo}
            description={campos.areas.descricao}
          />
          {areas.length > 0 ? (
            <ul data-motion="cards" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {areas.map((area, index) => (
                <li key={area.id}>
                  <AreaCard area={area} color={AREA_COLORS[index % AREA_COLORS.length]} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-10">{campos.areas.vazio}</EmptyState>
          )}
        </Section>
      )}

      {isSectionHidden(page, "servicos") ? null : (
        <Section tone={campos.servicos.fundo} labelledBy="servicos-titulo">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              id="servicos-titulo"
              eyebrow={campos.servicos.etiqueta}
              title={campos.servicos.titulo}
              description={campos.servicos.descricao}
            />
            <ButtonLink href={campos.servicos.botao.href} variant="secondary" className="self-start lg:self-auto">
              {campos.servicos.botao.label}
            </ButtonLink>
          </div>
          {homeServices.length > 0 ? (
            <ul data-motion="cards" className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {homeServices.map((service, index) => (
                <li key={service.id}>
                  <ServiceCard service={service} index={index} ctaLabel={geral.mensagens.saibaMais} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-10">{campos.servicos.vazio}</EmptyState>
          )}
        </Section>
      )}

      {isSectionHidden(page, "cases") ? null : (
        <Section tone={campos.cases.fundo} halftone labelledBy="cases-titulo">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              id="cases-titulo"
              eyebrow={campos.cases.etiqueta}
              title={campos.cases.titulo}
              description={campos.cases.descricao}
            />
            <ButtonLink href={campos.cases.botao.href} variant="lima" className="self-start lg:self-auto">
              {campos.cases.botao.label}
            </ButtonLink>
          </div>
          {featuredCases.length > 0 ? (
            <ul data-motion="cards" className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCases.map((item) => (
                <li key={item.id}>
                  <CaseCard item={item} ctaLabel={geral.mensagens.verCase} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-10">{campos.cases.vazio}</EmptyState>
          )}
        </Section>
      )}

      <PageBlocks page={page} />

      <ClosingCta
        title={geral.fechamento.titulo}
        description={geral.fechamento.texto}
        sticker={geral.fechamento.sticker.src}
        links={toLinks(highlightCtas)}
      />
    </>
  );
}
