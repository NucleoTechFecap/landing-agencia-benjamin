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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Textos e imagens editáveis no painel (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import type { ResolvedPage } from "@/lib/domain/content/catalog";
import type { SERVICOS } from "@/lib/domain/content/catalog/servicos";
import { BrandIcon } from "../ui/brand-icon";
import { Section } from "../ui/section";
import { SectionHeading } from "../ui/section-heading";

/** Etapas de trabalho da agência (PRJ §8.1 — modelo de atuação). */
export function ProcessSteps({ campos }: { campos: ResolvedPage<typeof SERVICOS>["processo"] }) {
  return (
    <Section tone={campos.fundo} halftone labelledBy="processo-titulo">
      <SectionHeading id="processo-titulo" eyebrow={campos.etiqueta} title={campos.titulo} />
      {/* Linha do progresso das etapas: acompanha a rolagem em telas grandes, com as animações ligadas. */}
      <div aria-hidden className="mt-10 hidden h-1 rounded-full bg-benja-nyanza/25 motion-off:hidden lg:block">
        <div data-steps-line className="h-full origin-left rounded-full bg-benja-lima" />
      </div>
      <ol data-motion="steps" className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-6 lg:grid-cols-4">
        {campos.etapas.map((step, index) => (
          <li key={`${step.titulo}-${index}`}>
            <div
              data-card="soft"
              className="h-full rounded-3xl border-2 border-benja-noite bg-benja-nyanza p-6 text-benja-noite shadow-sticker"
            >
              <div className="flex items-center justify-between">
                <span data-card-icon>
                  <BrandIcon name={step.icone.name} color={step.icone.color} size={52} />
                </span>
                <span className="text-4xl font-black text-benja-azul/30">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-4 text-xl font-black text-benja-verde">{step.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-benja-grafite">{step.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
