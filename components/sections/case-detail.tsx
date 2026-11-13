/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : case-detail.tsx
 Descrição    : Seções do detalhe de case, comuns ao site e à prévia do painel.

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

import Image from "next/image";
import Link from "next/link";
import { CaseCard } from "@/components/cards/case-card";
import { ClosingCta, closingLinks } from "@/components/sections/closing-cta";
import { PageHero } from "@/components/sections/page-hero";
import { Badge } from "@/components/ui/badge";
import { BrandIcon } from "@/components/ui/brand-icon";
import { Section } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import type { Page } from "@/lib/domain/content/types";
import { isSectionHidden, pageFields } from "@/lib/domain/content/catalog";
import type { CaseCard as CaseCardData, CaseDetail } from "@/lib/domain/content/details";
import { fillText } from "@/lib/domain/content/fields";

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
const formatMonth = (value?: string) => {
  if (!value) return undefined;
  const [year, month] = value.split("-").map(Number);
  return `${MONTHS[month - 1]} de ${year}`;
};

/** Data de publicação de um clipping (AAAA-MM-DD) por extenso: "15 de setembro de 2026" (CASE-10). */
const formatDay = (value?: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
};

/** Desafio, solução, resultados, galeria, links e serviços (CASE-02, CASE-04). */
export function CaseDetailSections({
  detail,
  related,
  modelo,
  geralPage,
}: {
  detail: CaseDetail;
  related: readonly CaseCardData[];
  /** Textos fixos de toda página de case; sem página publicada, os originais. */
  modelo: Page | null;
  geralPage: Page | null;
}) {
  const campos = pageFields("modelo-case", modelo);
  const geral = pageFields("site-geral", geralPage);
  const { historia, ficha } = campos;
  const { item, category, services, areas } = detail;
  const story = [
    { id: "desafio", title: historia.desafio, text: item.challenge, icon: historia.desafioIcone },
    { id: "solucao", title: historia.solucao, text: item.solution, icon: historia.solucaoIcone },
    { id: "resultados", title: historia.resultados, text: item.results, icon: historia.resultadosIcone },
  ].filter((block) => block.text);
  const reference = formatMonth(item.date);

  return (
    <>
      <PageHero
        eyebrow={item.client}
        path={`/cases/${item.slug}`}
        title={item.title}
        description={<p>{item.summary}</p>}
        breadcrumbs={[{ label: geral.mensagens.inicio, href: "/" }, campos.abertura.trilha, { label: item.client }]}
        tone={campos.abertura.fundo}
      >
        <div className="mt-6 flex flex-wrap gap-2">
          {category ? (
            <Link href={`/cases?categoria=${category.slug}`}>
              <Badge>{category.name}</Badge>
            </Link>
          ) : null}
          {item.deliveryType ? <Badge className="bg-benja-rosa">{item.deliveryType}</Badge> : null}
          {reference ? <Badge className="bg-benja-claro">{reference}</Badge> : null}
        </div>
      </PageHero>

      {item.cover ? (
        <div className="border-b-2 border-benja-noite bg-benja-noite">
          <div data-motion="image" className="relative mx-auto aspect-[16/9] max-h-[640px] w-full max-w-6xl">
            <Image
              src={item.cover.src}
              alt={item.cover.alt}
              fill
              priority
              sizes="(min-width: 1152px) 1152px, 100vw"
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

      <Section tone="nyanza" labelledBy="case-historia">
        <h2 id="case-historia" className="sr-only">
          Sobre o projeto
        </h2>
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-10">
            {story.length > 0 ? (
              story.map((block) => (
                <article key={block.id} data-motion="reveal" aria-labelledby={`${block.id}-titulo`}>
                  <div className="flex items-center gap-3">
                    <BrandIcon name={block.icon.name} color={block.icon.color} size={40} />
                    <h3 id={`${block.id}-titulo`} className="text-2xl font-black text-benja-verde">
                      {block.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-lg leading-relaxed whitespace-pre-line text-benja-grafite">{block.text}</p>
                </article>
              ))
            ) : (
              <EmptyState className="text-benja-grafite">{historia.vazio}</EmptyState>
            )}
          </div>
          <aside
            aria-label="Ficha do projeto"
            data-motion="reveal"
            className="h-fit space-y-6 rounded-3xl border-2 border-benja-noite bg-benja-claro p-6 shadow-sticker"
          >
            <div>
              <h3 className="text-xs font-black tracking-widest text-benja-verde uppercase">{ficha.cliente}</h3>
              <p className="mt-1 font-bold">{item.client}</p>
            </div>
            {services.length > 0 ? (
              <div>
                <h3 className="text-xs font-black tracking-widest text-benja-verde uppercase">{ficha.servicos}</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {services.map((service) => (
                    <li key={service.id}>
                      <Link
                        href={`/servicos/${service.slug}`}
                        className="inline-block rounded-full border-2 border-benja-noite bg-benja-nyanza px-3 py-1 text-sm font-bold text-benja-verde"
                      >
                        {service.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {areas.length > 0 ? (
              <div>
                <h3 className="text-xs font-black tracking-widest text-benja-verde uppercase">{ficha.areas}</h3>
                <p className="mt-1 text-sm">{areas.map((area) => area.name).join(" · ")}</p>
              </div>
            ) : null}
            {item.team.length > 0 ? (
              <div>
                <h3 className="text-xs font-black tracking-widest text-benja-verde uppercase">{ficha.equipe}</h3>
                <p className="mt-1 text-sm">{item.team.join(", ")}</p>
              </div>
            ) : null}
            {item.externalLinks.length > 0 ? (
              <div>
                <h3 className="text-xs font-black tracking-widest text-benja-verde uppercase">{ficha.publicado}</h3>
                <ul className="mt-2 space-y-1">
                  {item.externalLinks.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block py-0.5 font-bold text-benja-verde underline underline-offset-4"
                      >
                        {link.label}
                        <span className="sr-only"> (abre em nova aba)</span>
                      </a>
                      {link.source || link.date ? (
                        <span className="block text-xs text-benja-grafite/80">
                          {[link.source, formatDay(link.date)].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </Section>

      {item.gallery.length > 0 && !isSectionHidden(modelo, "galeria") ? (
        <Section tone="creme" labelledBy="galeria-titulo">
          <h2 id="galeria-titulo" data-motion="lines" className="text-3xl font-black text-benja-verde">
            {campos.galeria.titulo}
          </h2>
          <ul data-motion="cards" className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {item.gallery.map((image) => (
              <li
                key={image.src}
                className="relative aspect-square overflow-hidden rounded-3xl border-2 border-benja-noite bg-white"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-contain"
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {related.length > 0 && !isSectionHidden(modelo, "relacionados") ? (
        <Section tone={campos.relacionados.fundo} halftone labelledBy="relacionados-titulo">
          <h2 id="relacionados-titulo" data-motion="lines" className="text-3xl font-black">
            {fillText(campos.relacionados.titulo, { categoria: category?.name ?? "" })}
          </h2>
          <ul data-motion="cards" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((entry) => (
              <li key={entry.id}>
                <CaseCard item={entry} ctaLabel={geral.mensagens.verCase} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {isSectionHidden(modelo, "fechamento") ? null : (
        <ClosingCta
          title={geral.fechamento.titulo}
          description={geral.fechamento.texto}
          sticker={geral.fechamento.sticker.src}
          links={closingLinks(campos.fechamento.botao1, campos.fechamento.botao2)}
        />
      )}
    </>
  );
}
