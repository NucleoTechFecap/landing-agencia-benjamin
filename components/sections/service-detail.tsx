/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : service-detail.tsx
 Descrição    : Seções do detalhe de serviço, comuns ao site e à prévia do painel.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-14).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import { CaseCard } from "@/components/cards/case-card";
import { ClosingCta } from "@/components/sections/closing-cta";
import { PageHero } from "@/components/sections/page-hero";
import { BrandIcon } from "@/components/ui/brand-icon";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/states";
import type { ServiceDetail } from "@/lib/domain/content/details";
import type { Service } from "@/lib/domain/content/types";

/** Entregas, áreas, cases relacionados e CTA de contato (SERV-02, SERV-12). */
export function ServiceDetailSections({ detail, others }: { detail: ServiceDetail; others: readonly Service[] }) {
  const { service, areas, cases } = detail;
  const contactHref = `/contato?servico=${service.slug}#formulario`;

  return (
    <>
      <PageHero
        eyebrow="Serviço"
        path={`/servicos/${service.slug}`}
        title={service.name}
        description={<p>{service.summary}</p>}
        breadcrumbs={[
          { label: "Início", href: "/" },
          { label: "Serviços", href: "/servicos" },
          { label: service.name },
        ]}
        icon={service.icon}
      >
        <div className="mt-8">
          <ButtonLink href={contactHref} variant="lima">
            Quero este serviço
          </ButtonLink>
        </div>
      </PageHero>

      <Section tone="nyanza" labelledBy="servico-descricao">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 id="servico-descricao" data-motion="lines" className="text-3xl font-black text-benja-verde">
              Como funciona
            </h2>
            <p data-motion="reveal" className="mt-4 text-lg leading-relaxed text-benja-grafite">
              {service.description}
            </p>
            {service.examples.length > 0 ? (
              <>
                <h3 data-motion="reveal" className="mt-10 text-xl font-black text-benja-verde">
                  O que pode entrar no projeto
                </h3>
                <ul data-motion="group" className="mt-4 space-y-3">
                  {service.examples.map((example) => (
                    <li key={example} className="flex items-center gap-3 text-lg">
                      <BrandIcon name="estrela" color="lima" size={28} />
                      {example}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
          <aside
            aria-labelledby="areas-envolvidas"
            data-motion="reveal"
            className="h-fit rounded-3xl border-2 border-benja-noite bg-benja-claro p-6 shadow-sticker"
          >
            <h2 id="areas-envolvidas" className="text-sm font-black tracking-widest text-benja-verde uppercase">
              Áreas envolvidas
            </h2>
            <ul className="mt-4 space-y-3">
              {areas.map((area) => (
                <li key={area.id}>
                  <Link
                    href={`/areas#${area.slug}`}
                    className="flex items-center gap-3 font-bold text-benja-verde hover:underline"
                  >
                    <BrandIcon name={area.icon ?? "estrela"} color="verde" size={36} />
                    {area.name}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </Section>

      <Section tone="verde" halftone labelledBy="cases-relacionados">
        <SectionHeading id="cases-relacionados" eyebrow="Na prática" title={`Cases com ${service.name}`} />
        {cases.length > 0 ? (
          <ul data-motion="cards" className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((item) => (
              <li key={item.id}>
                <CaseCard item={item} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState className="mt-8" action={{ href: "/cases", label: "Ver todo o portfólio" }}>
            Os cases deste serviço estão sendo preparados.
          </EmptyState>
        )}
      </Section>

      {others.length > 0 ? (
        <Section tone="creme" labelledBy="outros-servicos">
          <h2 id="outros-servicos" data-motion="lines" className="text-2xl font-black text-benja-verde">
            Outros serviços
          </h2>
          <ul data-motion="group" className="mt-6 flex flex-wrap gap-3">
            {others.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/servicos/${item.slug}`}
                  className="inline-block rounded-full border-2 border-benja-noite bg-benja-nyanza px-4 py-2 font-bold text-benja-verde shadow-sticker transition hover:-translate-y-0.5"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <ClosingCta
        title={`Vamos conversar sobre ${service.name.toLowerCase()}?`}
        links={[
          { id: "contato", label: "Quero este serviço", href: contactHref, external: false },
          { id: "servicos", label: "Ver todos os serviços", href: "/servicos", external: false },
        ]}
      />
    </>
  );
}
