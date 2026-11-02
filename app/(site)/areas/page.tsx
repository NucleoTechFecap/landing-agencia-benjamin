/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Página das seis áreas de atuação com âncoras e serviços relacionados.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 13/10/2026 Vinícius Nishimura Reis  Metadados completos e dados estruturados (SEO da landing).
 25/10/2026 Caio Moraes              Última área sem laranja, distinta do CTA final (SOB-04).
 01/11/2026 Vinícius Nishimura Reis  Site lê páginas e blocos publicados no CMS (INT-03).
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { buildMetadata } from "@/lib/server/seo";
import Link from "next/link";
import { ClosingCta } from "@/components/sections/closing-cta";
import { PageBlocks } from "@/components/sections/page-blocks";
import { PageHero } from "@/components/sections/page-hero";
import { BrandIcon, type BrandIconColor } from "@/components/ui/brand-icon";
import { Container } from "@/components/ui/container";
import { SECTION_TONES, Section, type SectionTone } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import { getPage, getSiteSettings, listAreas, listServices } from "@/lib/server/content/repository";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata(
    {
      title: "Áreas de atuação",
      description:
        "Eventos e Parcerias, Social Media, Comunicação Interna, Copywriting, Criação e Assessoria de Imprensa: as seis áreas da Agência Benjamin.",
      path: "/areas",
      keywords: [
        "áreas de atuação",
        "social media",
        "copywriting",
        "criação",
        "assessoria de imprensa",
        "eventos e parcerias",
        "comunicação interna",
      ],
    },
    await getSiteSettings(),
  );
}

// A última cor não pode ser laranja: o CTA final da página (ClosingCta) é sempre laranja e as duas
// faixas pareciam uma só (SOB-04).
const TONES: { tone: SectionTone; icon: BrandIconColor }[] = [
  { tone: "nyanza", icon: "verde" },
  { tone: "lima", icon: "verde" },
  { tone: "azul", icon: "rosa" },
  { tone: "laranja", icon: "verde" },
  { tone: "rosa", icon: "azul" },
  { tone: "claro", icon: "laranja" },
];

/** Listagem das seis áreas, cada uma com âncora própria e serviços relacionados (SOB-04…SOB-10). */
export default async function AreasPage() {
  const [areas, services, page] = await Promise.all([listAreas(), listServices(), getPage("areas")]);

  return (
    <>
      <PageHero
        eyebrow="Áreas de atuação"
        title="Seis frentes de comunicação, um só time"
        description={<p>Conheça o que cada área da Benjamin faz e quais serviços nascem dela.</p>}
        path="/areas"
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Áreas de atuação" }]}
        icon="estrela"
      >
        {areas.length > 0 ? (
          <nav aria-label="Ir para a área" className="mt-6">
            <ul className="flex flex-wrap gap-2">
              {areas.map((area) => (
                <li key={area.id}>
                  <a
                    href={`#${area.slug}`}
                    className="inline-block rounded-full border-2 border-current px-3 py-1 text-sm font-bold transition hover:bg-benja-lima hover:text-benja-verde"
                  >
                    {area.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </PageHero>

      {areas.length === 0 ? (
        <Section tone="nyanza">
          <EmptyState>As áreas de atuação estão sendo atualizadas. Volte em breve!</EmptyState>
        </Section>
      ) : null}

      {areas.map((area, index) => {
        const { tone, icon } = TONES[index % TONES.length];
        const related = services.filter((service) => service.areaIds.includes(area.id));
        return (
          <section
            key={area.id}
            id={area.slug}
            aria-labelledby={`${area.slug}-titulo`}
            className={`scroll-mt-24 border-t-2 border-benja-noite py-16 sm:py-20 ${SECTION_TONES[tone]}`}
          >
            <Container className="grid gap-10 md:grid-cols-[auto_1fr] md:items-start">
              <div data-parallax="-24" className="w-fit">
                <div data-motion="pop">
                  <BrandIcon name={area.icon ?? "estrela"} color={icon} size={120} />
                </div>
              </div>
              <div>
                <div data-motion="reveal">
                  <p className="text-sm font-bold tracking-widest uppercase opacity-80">
                    Área {String(index + 1).padStart(2, "0")}
                  </p>
                </div>
                <h2 id={`${area.slug}-titulo`} data-motion="lines" className="mt-1 text-4xl font-black sm:text-5xl">
                  {area.name}
                </h2>
                <p data-motion="reveal" className="mt-4 max-w-2xl text-lg leading-relaxed">
                  {area.description}
                </p>
                {area.highlights.length > 0 ? (
                  <ul data-motion="group" className="mt-6 flex flex-wrap gap-2">
                    {area.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="rounded-full border-2 border-current px-3 py-1 text-sm font-semibold"
                      >
                        {highlight}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {related.length > 0 ? (
                  <div data-motion="reveal" className="mt-8">
                    <h3 className="text-sm font-black tracking-widest uppercase">Serviços desta área</h3>
                    <ul className="mt-3 flex flex-wrap gap-3">
                      {related.map((service) => (
                        <li key={service.id}>
                          <Link
                            href={`/servicos/${service.slug}`}
                            className="inline-flex items-center gap-1 rounded-full border-2 border-benja-noite bg-benja-nyanza px-4 py-2 text-sm font-bold text-benja-verde shadow-sticker transition hover:-translate-y-0.5"
                          >
                            {service.name} →
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Container>
          </section>
        );
      })}

      <PageBlocks page={page} />

      <ClosingCta
        links={[
          { id: "servicos", label: "Ver todos os serviços", href: "/servicos", external: false },
          { id: "contato", label: "Fale com a gente", href: "/contato#formulario", external: false },
        ]}
      />
    </>
  );
}
