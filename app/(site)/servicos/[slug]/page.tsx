/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Detalhe do serviço com entregas, áreas, cases relacionados e CTA de contato.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 13/10/2026 Vinícius Nishimura Reis  Metadados completos e dados estruturados (SEO da landing).
 25/10/2026 Caio Moraes              Permite navegação bloqueante (instant = false) (LAY-01).
 26/10/2026 Vinícius Nishimura Reis  Parâmetro estático para banco vazio (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseCard } from "@/components/cards/case-card";
import { ClosingCta } from "@/components/sections/closing-cta";
import { PageHero } from "@/components/sections/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { BrandIcon } from "@/components/ui/brand-icon";
import { ButtonLink } from "@/components/ui/button-link";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteUrl } from "@/lib/config/public-env";
import { serviceSchema } from "@/lib/domain/seo/structured-data";
import { getServiceDetail, getSiteSettings, listPublishedSlugs, listServices } from "@/lib/server/content/repository";
import { toStaticParams } from "@/lib/server/content/published-slugs";
import { buildMetadata } from "@/lib/server/seo";

/** Prerenderiza os serviços publicados; novos slugs entram por ISR com App Shell. */
export async function generateStaticParams() {
  const { services } = await listPublishedSlugs();
  return toStaticParams(services);
}

/** Pode bloquear na navegação: os slugs publicados já são pré-gerados e o proxy.ts responde 404 aos inexistentes (LAY-01). */
export const instant = false;

export async function generateMetadata({ params }: PageProps<"/servicos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getServiceDetail(slug);
  if (!detail) return { title: "Serviço não encontrado", robots: { index: false } };
  const { service, areas } = detail;
  return buildMetadata(
    {
      title: `${service.name} — serviço de comunicação`,
      description: service.summary,
      path: `/servicos/${service.slug}`,
      keywords: [service.name, ...areas.map((area) => area.name), ...service.examples],
    },
    await getSiteSettings(),
  );
}

/** Detalhe do serviço com entregas, áreas, cases relacionados e CTA de contato (SERV-02, SERV-12). */
export default async function ServicePage({ params }: PageProps<"/servicos/[slug]">) {
  const { slug } = await params;
  const [detail, services] = await Promise.all([getServiceDetail(slug), listServices()]);
  // Item inexistente, rascunho ou arquivado: 404 sem revelar se existe (TECH-04 I1).
  if (!detail) notFound();
  const { service, areas, cases } = detail;
  const others = services.filter((item) => item.id !== service.id).slice(0, 4);
  const contactHref = `/contato?servico=${service.slug}#formulario`;

  return (
    <>
      <JsonLd data={serviceSchema(service, areas, siteUrl)} />
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
        provisional={service.provisional}
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
            <h2 id="servico-descricao" className="text-3xl font-black text-benja-verde">
              Como funciona
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-benja-grafite">{service.description}</p>
            {service.examples.length > 0 ? (
              <>
                <h3 className="mt-10 text-xl font-black text-benja-verde">O que pode entrar no projeto</h3>
                <ul className="mt-4 space-y-3">
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
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((item) => (
              <li key={item.id}>
                <CaseCard item={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 rounded-3xl border-2 border-dashed border-benja-nyanza/60 p-8 text-center">
            Os cases deste serviço estão sendo preparados. Enquanto isso, veja{" "}
            <Link href="/cases" className="font-bold underline underline-offset-4">
              todo o portfólio
            </Link>
            .
          </p>
        )}
      </Section>

      {others.length > 0 ? (
        <Section tone="creme" labelledBy="outros-servicos">
          <h2 id="outros-servicos" className="text-2xl font-black text-benja-verde">
            Outros serviços
          </h2>
          <ul className="mt-6 flex flex-wrap gap-3">
            {others.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/servicos/${item.slug}`}
                  className="inline-block rounded-full border-2 border-benja-noite bg-benja-nyanza px-4 py-2 font-bold text-benja-verde shadow-sticker hover:-translate-y-0.5"
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
