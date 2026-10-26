/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : hero-manifesto.tsx
 Descrição    : Primeira dobra da Home com manifesto, CTAs e logotipo.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 25/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 25/10/2026 Caio Moraes              Hero sem corte de texto em telas estreitas (HOME-01).
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";
import type { SiteSettings } from "@/lib/domain/content/types";
import { ProvisionalBadge } from "../ui/badge";
import { ButtonLink } from "../ui/button-link";
import { Container } from "../ui/container";
import { Sticker } from "../ui/sticker";

export interface HeroCta {
  id: string;
  label: string;
  href: string;
  external: boolean;
}

/** Primeira dobra da Home: manifesto de marca + CTAs principais (PRJ §7.1 / HOME-01). */
export function HeroManifesto({ settings, ctas }: { settings: SiteSettings; ctas: HeroCta[] }) {
  const { manifesto } = settings;
  return (
    <section aria-labelledby="manifesto-titulo" className="relative overflow-hidden bg-benja-verde text-benja-nyanza">
      <div aria-hidden className="halftone pointer-events-none absolute inset-0 text-benja-lima opacity-40" />
      <Container className="relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr]">
        {/* min-w-0: sem ele a coluna do grid não encolhe abaixo da maior palavra e o texto era cortado em 320 px (HOME-01). */}
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border-2 border-benja-lima px-4 py-1 text-xs font-bold tracking-widest text-benja-lima uppercase">
            Agência experimental da FECAP
          </p>
          <h1
            id="manifesto-titulo"
            className="mt-6 text-[clamp(2.25rem,11vw,3rem)] leading-[0.95] font-black tracking-tight text-balance break-words sm:text-7xl"
          >
            {manifesto.title}
          </h1>
          <div className="mt-6 max-w-xl space-y-3 text-lg leading-relaxed text-benja-nyanza/90">
            {manifesto.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {manifesto.provisional ? <ProvisionalBadge className="mt-4" /> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            {ctas.map((cta, index) => (
              <ButtonLink
                key={cta.id}
                href={cta.href}
                external={cta.external}
                variant={index === 0 ? "lima" : "secondary"}
              >
                {cta.label}
              </ButtonLink>
            ))}
          </div>
        </div>
        {/* Logotipo sem rotação, sombra extra ou sobreposição: zona de exclusão do brandbook. */}
        <div className="relative mx-auto w-full max-w-[240px] px-6 py-10 sm:max-w-xs lg:max-w-sm">
          <Image
            src="/brand/logo-vertical.webp"
            alt=""
            aria-hidden
            width={480}
            height={496}
            priority
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 320px, 240px"
            className="relative z-10 h-auto w-full"
          />
          <Sticker
            name="poupa-meu-tempo"
            color="laranja"
            width={96}
            className="absolute -top-4 -left-10 rotate-[-12deg] animate-float sm:-left-16"
          />
          <Sticker
            name="ta-no-briefing"
            color="rosa"
            width={110}
            className="absolute -right-10 -bottom-6 rotate-[8deg] animate-float [animation-delay:1.5s] sm:-right-16"
          />
        </div>
      </Container>
      <p className="relative border-t-2 border-benja-noite bg-benja-lima px-4 py-3 text-center text-xs font-black tracking-[0.25em] text-benja-verde uppercase sm:text-sm sm:tracking-[0.3em]">
        {settings.tagline}
        <span className="hidden sm:inline"> · estratégia · conteúdo · criação · eventos · imprensa</span>
      </p>
    </section>
  );
}
