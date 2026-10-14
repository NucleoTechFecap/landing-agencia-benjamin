/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Página Sobre: agência experimental, proposta, modelo de atuação e áreas.

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
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { AreaCard } from "@/components/cards/area-card";
import { ClosingCta } from "@/components/sections/closing-cta";
import { PageHero } from "@/components/sections/page-hero";
import { BrandIcon, type BrandIconColor } from "@/components/ui/brand-icon";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { getSiteSettings, listAreas } from "@/lib/server/content/repository";

export const metadata: Metadata = {
  title: "Sobre a Benjamin",
  description: "Conheça a Agência Benjamin, agência experimental de comunicação da FECAP: proposta de valor, modelo de atuação e relação com a FECAP.",
};

const AREA_COLORS: BrandIconColor[] = ["verde", "laranja", "azul", "rosa", "verde-claro", "lima"];

/** Página Sobre: agência experimental, proposta, modelo de atuação e FECAP (PRJ §8 / SOB-01, SOB-02). */
export default async function AboutPage() {
  const [settings, areas] = await Promise.all([getSiteSettings(), listAreas()]);
  const { about } = settings;
  const pillars = [
    { icon: "estrela", color: "lima" as const, title: "Proposta de valor", text: about.valueProposition },
    { icon: "seta-curva", color: "laranja" as const, title: "Modelo de atuação", text: about.howWeWork },
    { icon: "chapeu", color: "azul" as const, title: "Dentro da FECAP", text: about.fecapRelation },
  ];

  return (
    <>
      <PageHero
        eyebrow="Sobre a Benjamin"
        title={about.title}
        description={<p>{about.intro}</p>}
        breadcrumbs={[{ label: "Início", href: "/" }, { label: "Sobre" }]}
        icon="hermes"
        provisional={about.provisional}
      />

      <Section tone="nyanza" labelledBy="pilares-titulo">
        <SectionHeading id="pilares-titulo" eyebrow="Agência experimental" title="Como a Benjamin funciona" />
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <li key={pillar.title} className="rounded-3xl border-2 border-benja-noite bg-white/70 p-7 shadow-sticker">
              <BrandIcon name={pillar.icon} color={pillar.color} size={64} />
              <h3 className="mt-4 text-2xl font-black text-benja-verde">{pillar.title}</h3>
              <p className="mt-3 leading-relaxed text-benja-grafite">{pillar.text}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="claro" halftone labelledBy="sobre-areas-titulo">
        <SectionHeading
          id="sobre-areas-titulo"
          eyebrow="Estrutura"
          title="Seis áreas que trabalham juntas"
          description="Cada área tem especialistas próprios e se combina com as demais conforme o projeto."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area, index) => (
            <li key={area.id}>
              <AreaCard area={area} color={AREA_COLORS[index % AREA_COLORS.length]} />
            </li>
          ))}
        </ul>
      </Section>

      {/* "Nosso time" é opcional (SOB-03): só aparece quando a Benjamin enviar as informações (CON-09). */}

      <ClosingCta
        title="Quer construir algo com a gente?"
        description="Seja um projeto para sua marca ou vontade de fazer parte da Benjamin, a conversa começa por aqui."
        links={[
          { id: "projeto", label: "Quero um projeto", href: "/contato#formulario", external: false },
          { id: "fazer-parte", label: "Quero fazer parte", href: "/contato?assunto=fazer-parte#formulario", external: false },
        ]}
      />
    </>
  );
}
