/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : sobre-view.tsx
 Descrição    : Conteúdo da página Sobre, usado pela rota e pela prévia do painel.

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
import { ClosingCta, closingLinks } from "@/components/sections/closing-cta";
import { PageBlocks } from "@/components/sections/page-blocks";
import { PageHero } from "@/components/sections/page-hero";
import { BrandIcon, type BrandIconColor } from "@/components/ui/brand-icon";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { isSectionHidden, pageFields } from "@/lib/domain/content/catalog";
import { withPublishedTexts } from "@/lib/domain/content/page-texts";
import type { Page } from "@/lib/domain/content/types";
import { getPage, getSiteSettings, listAreas } from "@/lib/server/content/repository";

const AREA_COLORS: BrandIconColor[] = ["verde", "laranja", "azul", "rosa", "verde-claro", "lima"];

/** Página Sobre: agência experimental, proposta, modelo de atuação e FECAP (PRJ §8 / SOB-01, SOB-02). */
export async function SobreView({ page }: { page: Page | null }) {
  const [published, areas, geralPage] = await Promise.all([getSiteSettings(), listAreas(), getPage("site-geral")]);
  const settings = page ? withPublishedTexts(published, [page]) : published;
  const campos = pageFields("sobre", page, settings);
  const geral = pageFields("site-geral", geralPage);
  const { abertura, pilares, fechamento } = campos;
  const pillars = [
    { icon: pilares.pilar1Icone, title: pilares.pilar1, text: pilares.pilar1Texto },
    { icon: pilares.pilar2Icone, title: pilares.pilar2, text: pilares.pilar2Texto },
    { icon: pilares.pilar3Icone, title: pilares.pilar3, text: pilares.pilar3Texto },
  ];

  return (
    <>
      <PageHero
        eyebrow={abertura.etiqueta}
        title={abertura.titulo}
        description={<p>{abertura.descricao}</p>}
        path="/sobre"
        breadcrumbs={[{ label: geral.mensagens.inicio, href: "/" }, { label: abertura.trilha }]}
        tone={abertura.fundo}
        icon={abertura.icone.name}
        iconColor={abertura.icone.color}
      />

      {isSectionHidden(page, "pilares") ? null : (
        <Section tone={pilares.fundo} labelledBy="pilares-titulo">
          <SectionHeading id="pilares-titulo" eyebrow={pilares.etiqueta} title={pilares.titulo} />
          <ul data-motion="cards" className="mt-10 grid gap-6 md:grid-cols-3">
            {pillars.map((pillar) => (
              <li key={pillar.title}>
                <div
                  data-card="soft"
                  className="h-full rounded-3xl border-2 border-benja-noite bg-white/70 p-7 shadow-sticker"
                >
                  <span data-card-icon className="block w-fit">
                    <BrandIcon name={pillar.icon.name} color={pillar.icon.color} size={64} />
                  </span>
                  <h3 className="mt-4 text-2xl font-black text-benja-verde">{pillar.title}</h3>
                  <p className="mt-3 leading-relaxed text-benja-grafite">{pillar.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {areas.length > 0 && !isSectionHidden(page, "areas") ? (
        <Section tone={campos.areas.fundo} halftone labelledBy="sobre-areas-titulo">
          <SectionHeading
            id="sobre-areas-titulo"
            eyebrow={campos.areas.etiqueta}
            title={campos.areas.titulo}
            description={campos.areas.descricao}
          />
          <ul data-motion="cards" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area, index) => (
              <li key={area.id}>
                <AreaCard area={area} color={AREA_COLORS[index % AREA_COLORS.length]} />
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* "Nosso time" é um bloco da página (SOB-03): sem pessoas autorizadas (CON-09), a seção não existe. */}
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
