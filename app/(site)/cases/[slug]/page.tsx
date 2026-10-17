/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Detalhe do case: história, ficha, galeria, links e cases relacionados.

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
 13/10/2026 Vinícius Nishimura Reis  Metadados completos e dados estruturados (SEO da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseCard } from "@/components/cards/case-card";
import { ClosingCta } from "@/components/sections/closing-cta";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { BrandIcon } from "@/components/ui/brand-icon";
import { Section } from "@/components/ui/section";
import { siteUrl } from "@/lib/config/public-env";
import { caseSchema } from "@/lib/domain/seo/structured-data";
import { getCaseDetail, getSiteSettings, listCases, listPublishedSlugs } from "@/lib/server/content/repository";
import { buildMetadata } from "@/lib/server/seo";

export async function generateStaticParams() {
  const { cases } = await listPublishedSlugs();
  return cases.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/cases/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getCaseDetail(slug);
  if (!detail) return { title: "Case não encontrado", robots: { index: false } };
  const { item, category, services } = detail;
  return buildMetadata(
    {
      title: `${item.title} — ${item.client}`,
      description: item.summary,
      path: `/cases/${item.slug}`,
      type: "article",
      keywords: [item.client, category?.name ?? "", ...services.map((service) => service.name)].filter(Boolean),
    },
    await getSiteSettings(),
  );
}

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

/** Detalhe do case: desafio, solução, resultados, galeria, links e serviços (CASE-02, CASE-04). */
export default async function CasePage({ params }: PageProps<"/cases/[slug]">) {
  const { slug } = await params;
  const detail = await getCaseDetail(slug);
  if (!detail) notFound();
  const { item, category, services, areas } = detail;
  const related = category
    ? (await listCases({ category: category.slug })).filter((entry) => entry.id !== item.id).slice(0, 3)
    : [];
  const story = [
    { id: "desafio", title: "Desafio", text: item.challenge, icon: "interrogacao" },
    { id: "solucao", title: "Solução", text: item.solution, icon: "raio" },
    { id: "resultados", title: "Resultados", text: item.results, icon: "estrela" },
  ].filter((block) => block.text);
  const reference = formatMonth(item.date);

  return (
    <>
      <JsonLd data={caseSchema(item, category?.name, services, siteUrl)} />
      <PageHero
        eyebrow={item.client}
        path={`/cases/${item.slug}`}
        title={item.title}
        description={<p>{item.summary}</p>}
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Cases", href: "/cases" }, { label: item.client }]}
        tone="azul"
        provisional={item.provisional}
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
          <div className="relative mx-auto aspect-[16/9] max-h-[640px] w-full max-w-6xl">
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
                <article key={block.id} aria-labelledby={`${block.id}-titulo`}>
                  <div className="flex items-center gap-3">
                    <BrandIcon name={block.icon} color="lima" size={40} />
                    <h3 id={`${block.id}-titulo`} className="text-2xl font-black text-benja-verde">
                      {block.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-lg leading-relaxed whitespace-pre-line text-benja-grafite">{block.text}</p>
                </article>
              ))
            ) : (
              <p className="rounded-3xl border-2 border-dashed border-benja-verde/40 p-6 text-benja-grafite">
                Os detalhes deste case (desafio, solução e resultados) estão sendo preparados com o cliente.
              </p>
            )}
          </div>
          <aside
            aria-label="Ficha do projeto"
            className="h-fit space-y-6 rounded-3xl border-2 border-benja-noite bg-benja-claro p-6 shadow-sticker"
          >
            <div>
              <h3 className="text-xs font-black tracking-widest text-benja-verde uppercase">Cliente</h3>
              <p className="mt-1 font-bold">{item.client}</p>
            </div>
            {services.length > 0 ? (
              <div>
                <h3 className="text-xs font-black tracking-widest text-benja-verde uppercase">Serviços</h3>
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
                <h3 className="text-xs font-black tracking-widest text-benja-verde uppercase">Áreas</h3>
                <p className="mt-1 text-sm">{areas.map((area) => area.name).join(" · ")}</p>
              </div>
            ) : null}
            {item.team.length > 0 ? (
              <div>
                <h3 className="text-xs font-black tracking-widest text-benja-verde uppercase">Equipe</h3>
                <p className="mt-1 text-sm">{item.team.join(", ")}</p>
              </div>
            ) : null}
            {item.externalLinks.length > 0 ? (
              <div>
                <h3 className="text-xs font-black tracking-widest text-benja-verde uppercase">Veja publicado</h3>
                <ul className="mt-2 space-y-1">
                  {item.externalLinks.map((link) => (
                    <li key={link.url}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-benja-verde underline underline-offset-4"
                      >
                        {link.label}
                        <span className="sr-only"> (abre em nova aba)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </aside>
        </div>
      </Section>

      {item.gallery.length > 0 ? (
        <Section tone="creme" labelledBy="galeria-titulo">
          <h2 id="galeria-titulo" className="text-3xl font-black text-benja-verde">
            Galeria
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {item.gallery.map((image) => (
              <li
                key={image.src}
                className="relative aspect-square overflow-hidden rounded-3xl border-2 border-benja-noite"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {related.length > 0 ? (
        <Section tone="verde" halftone labelledBy="relacionados-titulo">
          <h2 id="relacionados-titulo" className="text-3xl font-black">
            Mais cases de {category?.name}
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((entry) => (
              <li key={entry.id}>
                <CaseCard item={entry} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <ClosingCta
        links={[
          { id: "contato", label: "Quero um projeto assim", href: "/contato#formulario", external: false },
          { id: "cases", label: "Ver todos os cases", href: "/cases", external: false },
        ]}
      />
    </>
  );
}
