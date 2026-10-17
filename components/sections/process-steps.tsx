/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : process-steps.tsx
 Descrição    : Etapas de trabalho da agência (briefing, planejamento, produção e entrega).

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

import { BrandIcon } from "../ui/brand-icon";
import { Section } from "../ui/section";
import { SectionHeading } from "../ui/section-heading";

const STEPS = [
  { icon: "comentario", title: "Briefing", text: "Entendemos o objetivo, o público e o contexto da sua marca." },
  { icon: "calendario", title: "Planejamento", text: "Definimos estratégia, cronograma e as áreas envolvidas." },
  { icon: "raio", title: "Produção", text: "Criamos e executamos com validação em cada etapa." },
  { icon: "enviado", title: "Entrega", text: "Publicamos, acompanhamos e apresentamos os resultados." },
];

/** Etapas de trabalho da agência (PRJ §8.1 — modelo de atuação). */
export function ProcessSteps() {
  return (
    <Section tone="azul" halftone labelledBy="processo-titulo">
      <SectionHeading id="processo-titulo" eyebrow="Como trabalhamos" title="Do briefing à entrega" />
      <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="rounded-3xl border-2 border-benja-noite bg-benja-nyanza p-6 text-benja-noite shadow-sticker"
          >
            <div className="flex items-center justify-between">
              <BrandIcon name={step.icon} color="azul" size={52} />
              <span className="text-4xl font-black text-benja-azul/30">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-4 text-xl font-black text-benja-verde">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-benja-grafite">{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
