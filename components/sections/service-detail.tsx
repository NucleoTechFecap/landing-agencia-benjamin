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
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import { CaseCard } from "@/components/cards/case-card";
import { ClosingCta, closingLinks } from "@/components/sections/closing-cta";
import { PageHero } from "@/components/sections/page-hero";
import { BrandIcon } from "@/components/ui/brand-icon";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { EmptyState } from "@/components/ui/states";
import { isSectionHidden, pageFields } from "@/lib/domain/content/catalog";
import type { Page } from "@/lib/domain/content/types";
import type { ServiceDetail } from "@/lib/domain/content/details";
import { fillText } from "@/lib/domain/content/fields";
import type { Service } from "@/lib/domain/content/types";

/** Entregas, áreas, cases relacionados e CTA de contato (SERV-02, SERV-12). */
export function ServiceDetailSections({
  detail,
  others,
  modelo,
  geralPage,
}: {
  detail: ServiceDetail;
  others: readonly Service[];
  /** Textos fixos de toda página de serviço; sem página publicada, os originais. */
  modelo: Page | null;
  geralPage: Page | null;
}) {
  const campos = pageFields("modelo-servico", modelo);
  const geral = pageFields("site-geral", geralPage);
  const { service, areas, cases } = detail;
  const contactHref = `/contato?servico=${service.slug}#formulario`;

  return (
    <>
      <PageHero
        eyebrow={campos.abertura.etiqueta}
        path={`/servicos/${service.slug}`}
        title={service.name}
        description={<p>{service.summary}</p>}
        breadcrumbs={[{ label: geral.mensagens.inicio, href: "/" }, campos.abertura.trilha, { label: service.name }]}
        icon={service.icon}
      >
        <div className="mt-8">
          <ButtonLink href={contactHref} variant="lima">
            {campos.abertura.botao}
          </ButtonLink>
        </div>
      </PageHero>

      <Section tone="nyanza" labelledBy="servico-descricao">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 id="servico-descricao" data-motion="lines" className="text-3xl font-black text-benja-verde">
              {campos.descricao.titulo}
            </h2>
            <p data-motion="reveal" className="mt-4 text-lg leading-relaxed text-benja-grafite">
              {service.description}
            </p>
            {service.examples.length > 0 ? (
              <>
                <h3 data-motion="reveal" className="mt-10 text-xl font-black text-benja-verde">
                  {campos.descricao.exemplos}
                </h3>
                <ul data-motion="group" className="mt-4 space-y-3">
                  {service.examples.map((example) => (
                    <li key={example} className="flex items-center gap-3 text-lg">
                      <BrandIcon
                        name={campos.descricao.exemplosIcone.name}
                        color={campos.descricao.exemplosIcone.color}
                        size={28}
                      />
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
              {campos.descricao.areas}
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

      {isSectionHidden(modelo, "cases") ? null : (
        <Section tone={campos.cases.fundo} halftone labelledBy="cases-relacionados">
          <SectionHeading
            id="cases-relacionados"
            eyebrow={campos.cases.etiqueta}
            title={fillText(campos.cases.titulo, { servico: service.name })}
          />
          {cases.length > 0 ? (
            <ul data-motion="cards" className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {cases.map((item) => (
                <li key={item.id}>
                  <CaseCard item={item} ctaLabel={geral.mensagens.verCase} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState className="mt-8" action={campos.cases.vazioLink}>
              {campos.cases.vazio}
            </EmptyState>
          )}
        </Section>
      )}

      {others.length > 0 && !isSectionHidden(modelo, "outros") ? (
        <Section tone="creme" labelledBy="outros-servicos">
          <h2 id="outros-servicos" data-motion="lines" className="text-2xl font-black text-benja-verde">
            {campos.outros.titulo}
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

      {isSectionHidden(modelo, "fechamento") ? null : (
        <ClosingCta
          title={fillText(campos.fechamento.titulo, { servico: service.name.toLowerCase() })}
          description={campos.fechamento.texto}
          sticker={geral.fechamento.sticker.src}
          links={closingLinks({ label: campos.fechamento.botao1, href: contactHref }, campos.fechamento.botao2)}
        />
      )}
    </>
  );
}
