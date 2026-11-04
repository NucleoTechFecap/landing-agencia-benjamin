/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : areas-view.tsx
 Descrição    : Conteúdo da página Áreas de atuação, usado pela rota e pela prévia do painel.

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

import Link from "next/link";
import { ClosingCta, closingLinks } from "@/components/sections/closing-cta";
import { PageBlocks } from "@/components/sections/page-blocks";
import { PageHero } from "@/components/sections/page-hero";
import { BrandIcon, type BrandIconColor } from "@/components/ui/brand-icon";
import { Container } from "@/components/ui/container";
import { SECTION_TONES, Section, type SectionTone } from "@/components/ui/section";
import { EmptyState } from "@/components/ui/states";
import { isSectionHidden, pageFields } from "@/lib/domain/content/catalog";
import { fillText } from "@/lib/domain/content/fields";
import type { Page } from "@/lib/domain/content/types";
import { getPage, listAreas, listServices } from "@/lib/server/content/repository";

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
export async function AreasView({ page }: { page: Page | null }) {
  const [areas, services, geralPage] = await Promise.all([listAreas(), listServices(), getPage("site-geral")]);
  const campos = pageFields("areas", page);
  const geral = pageFields("site-geral", geralPage);
  const { abertura, lista, fechamento } = campos;

  return (
    <>
      <PageHero
        eyebrow={abertura.etiqueta}
        title={abertura.titulo}
        description={abertura.descricao ? <p>{abertura.descricao}</p> : undefined}
        path="/areas"
        breadcrumbs={[{ label: geral.mensagens.inicio, href: "/" }, { label: abertura.trilha }]}
        tone={abertura.fundo}
        icon={abertura.icone.name}
        iconColor={abertura.icone.color}
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
          <EmptyState>{lista.vazio}</EmptyState>
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
                    {fillText(lista.numero, { numero: String(index + 1).padStart(2, "0") })}
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
                    <h3 className="text-sm font-black tracking-widest uppercase">{lista.servicos}</h3>
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

      {isSectionHidden(page, "fechamento") ? null : (
        <ClosingCta
          title={geral.fechamento.titulo}
          description={geral.fechamento.texto}
          sticker={geral.fechamento.sticker.src}
          links={closingLinks(fechamento.botao1, fechamento.botao2)}
        />
      )}
    </>
  );
}
