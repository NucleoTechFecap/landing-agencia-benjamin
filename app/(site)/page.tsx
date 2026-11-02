/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Home: manifesto, quem é a Benjamin, áreas, serviços e cases em destaque e CTAs.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ARC-03).
 13/10/2026 Vinícius Nishimura Reis  Home completa com seções e conteúdo do repositório (estrutura da landing).
 13/10/2026 Vinícius Nishimura Reis  Metadados completos e dados estruturados (SEO da landing).
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { AreaCard } from "@/components/cards/area-card";
import { CaseCard } from "@/components/cards/case-card";
import { ServiceCard } from "@/components/cards/service-card";
import { AboutPreview } from "@/components/sections/about-preview";
import { ClosingCta } from "@/components/sections/closing-cta";
import { HeroManifesto } from "@/components/sections/hero-manifesto";
import type { BrandIconColor } from "@/components/ui/brand-icon";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/states";
import { getSiteSettings, listAreas, listCtas, listFeaturedCases, listServices } from "@/lib/server/content/repository";
import { DEFAULT_TITLE, buildMetadata } from "@/lib/server/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return buildMetadata(
    {
      title: DEFAULT_TITLE,
      absoluteTitle: true,
      description: settings.description,
      path: "/",
      keywords: ["agência experimental de comunicação", "Agência Benjamin FECAP"],
    },
    settings,
  );
}

const AREA_COLORS: BrandIconColor[] = ["verde", "laranja", "azul", "rosa", "verde-claro", "lima"];

export default async function HomePage() {
  const [settings, heroCtas, highlightCtas, areas, featuredServices, allServices, featuredCases] = await Promise.all([
    getSiteSettings(),
    listCtas("home-hero"),
    listCtas("home-highlight"),
    listAreas(),
    listServices({ featuredOnly: true }),
    listServices(),
    listFeaturedCases(),
  ]);

  const toLinks = (ctas: typeof heroCtas) =>
    ctas.map((cta) => ({ id: cta.id, label: cta.label, href: cta.link.href, external: cta.link.external }));
  const solutionsSummary = allServices.length
    ? `${allServices.length} serviços — ${allServices
        .slice(0, 4)
        .map((service) => service.name)
        .join(", ")} e mais.`
    : "Nossos serviços estão sendo atualizados.";

  return (
    <>
      <HeroManifesto settings={settings} ctas={toLinks(heroCtas)} />

      <AboutPreview settings={settings} solutionsSummary={solutionsSummary} />

      <Section tone="lima" halftone labelledBy="areas-titulo">
        <SectionHeading
          id="areas-titulo"
          eyebrow="Áreas de atuação"
          title="Seis frentes, um mesmo time."
          description="Cada projeto combina as áreas certas para o objetivo da sua marca."
        />
        {areas.length > 0 ? (
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area, index) => (
              <li key={area.id}>
                <AreaCard area={area} color={AREA_COLORS[index % AREA_COLORS.length]} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState className="mt-10">As áreas de atuação estão sendo atualizadas. Volte em breve!</EmptyState>
        )}
      </Section>

      <Section tone="nyanza" labelledBy="servicos-titulo">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="servicos-titulo"
            eyebrow="Serviços"
            title="O que a Benjamin faz pela sua marca"
            description="Do planejamento à entrega, com acompanhamento em cada etapa."
          />
          <ButtonLink href="/servicos" variant="secondary" className="self-start lg:self-auto">
            Ver todos os serviços
          </ButtonLink>
        </div>
        {featuredServices.length > 0 ? (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredServices.map((service, index) => (
              <li key={service.id}>
                <ServiceCard service={service} index={index} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState className="mt-10">Os serviços em destaque estão sendo atualizados. Volte em breve!</EmptyState>
        )}
      </Section>

      <Section tone="verde" halftone labelledBy="cases-titulo">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="cases-titulo"
            eyebrow="Cases"
            title="Trabalhos que saíram do briefing"
            description="Projetos reais desenvolvidos pela Agência Benjamin."
          />
          <ButtonLink href="/cases" variant="lima" className="self-start lg:self-auto">
            Ver portfólio completo
          </ButtonLink>
        </div>
        {featuredCases.length > 0 ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCases.map((item) => (
              <li key={item.id}>
                <CaseCard item={item} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState className="mt-10">Os primeiros cases estão sendo preparados. Volte em breve!</EmptyState>
        )}
      </Section>

      <ClosingCta links={toLinks(highlightCtas)} />
    </>
  );
}
