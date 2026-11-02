/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : about-preview.tsx
 Descrição    : Bloco Quem é a Benjamin com os quatro tópicos institucionais.

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
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
──────────────────────────────────────────────────────────────────────────────
*/

import type { SiteSettings } from "@/lib/domain/content/types";
import { BrandIcon } from "../ui/brand-icon";
import { ButtonLink } from "../ui/button-link";
import { Section } from "../ui/section";
import { SectionHeading } from "../ui/section-heading";

/** Bloco "Quem é a Benjamin": quem é, proposta, como atua e soluções (PRJ §7.2 / HOME-02). */
export function AboutPreview({ settings, solutionsSummary }: { settings: SiteSettings; solutionsSummary: string }) {
  const { about } = settings;
  const topics = [
    { icon: "hermes", title: "Quem somos", text: about.intro },
    { icon: "estrela", title: "Nossa proposta", text: about.valueProposition },
    { icon: "seta-curva", title: "Como atuamos", text: about.howWeWork },
    { icon: "raio", title: "O que entregamos", text: solutionsSummary },
  ];
  return (
    <Section tone="nyanza" labelledBy="quem-somos-titulo">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading id="quem-somos-titulo" eyebrow="Quem é a Benjamin" title={about.title} />
        <ButtonLink href="/sobre" variant="secondary" className="self-start lg:self-auto">
          Conheça a agência
        </ButtonLink>
      </div>
      <ul data-motion="cards" className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {topics.map((topic) => (
          <li key={topic.title}>
            <div data-card="soft" className="h-full rounded-3xl border-2 border-benja-noite bg-white/60 p-6">
              <span data-card-icon className="block w-fit">
                <BrandIcon name={topic.icon} color="lima" size={56} />
              </span>
              <h3 className="mt-4 text-lg font-black text-benja-verde">{topic.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-benja-grafite">{topic.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
