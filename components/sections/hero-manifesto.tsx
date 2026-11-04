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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 25/10/2026 Caio Moraes              Hero sem corte de texto em telas estreitas (HOME-01).
 25/10/2026 Caio Moraes              Sticker "tá no briefing" ancorado na base (LAY-06).
 26/10/2026 Vinícius Nishimura Reis  Logotipo vertical em SVG (UX-14).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Sem CTA publicado, não sobra caixa vazia no topo (HOME-07).
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";
import type { SiteSettings } from "@/lib/domain/content/types";
import { ButtonLink } from "../ui/button-link";
import { Container } from "../ui/container";
import { Sticker } from "../ui/sticker";
import { PageReady } from "../motion/page-ready";

/** Texto da faixa lima da marca (hero e tela de carregamento). */
export const bandText = (tagline: string) => `${tagline} · estratégia · conteúdo · criação · eventos · imprensa ·`;

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
      <PageReady />
      <div
        aria-hidden
        data-motion-halftone
        data-wave
        className="halftone pointer-events-none absolute inset-0 text-benja-lima opacity-40 motion-on:bg-none motion-on:opacity-100"
      />
      <Container className="relative grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_0.85fr]">
        {/* min-w-0: sem ele a coluna do grid não encolhe abaixo da maior palavra e o texto era cortado em 320 px (HOME-01). */}
        <div className="min-w-0">
          <p
            data-motion="intro-fade"
            data-at="0"
            className="inline-flex items-center gap-2 rounded-full border-2 border-benja-lima px-4 py-1 text-xs font-bold tracking-widest text-benja-lima uppercase"
          >
            Agência experimental da FECAP
          </p>
          <h1
            id="manifesto-titulo"
            data-motion="intro-lines"
            data-at="0.08"
            className="mt-6 text-[clamp(2.25rem,11vw,3rem)] leading-[0.95] font-black tracking-tight text-balance break-words sm:text-7xl"
          >
            {manifesto.title}
          </h1>
          <div
            data-motion="intro-fade"
            data-at="0.5"
            className="mt-6 max-w-xl space-y-3 text-lg leading-relaxed text-benja-nyanza/90"
          >
            {manifesto.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          {ctas.length ? (
            <div data-motion="intro-cta" data-at="0.65" className="mt-8 flex flex-wrap gap-3">
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
          ) : null}
        </div>
        {/* Logotipo sem rotação, sombra extra ou sobreposição: zona de exclusão do brandbook. */}
        <div className="relative mx-auto w-full max-w-[240px] px-6 py-10 sm:max-w-xs lg:max-w-sm">
          <div data-parallax="-28" className="relative z-10">
            <div data-motion="intro-logo" data-at="0.15">
              <Image
                src="/brand/logos/logo-vertical.svg"
                alt=""
                aria-hidden
                width={480}
                height={496}
                priority
                className="h-auto w-full"
              />
            </div>
          </div>
          <div data-parallax="-64" data-float className="absolute -top-4 -left-10 sm:-left-16">
            <div data-motion="intro-sticker" data-at="0.85" className="rotate-[-12deg]">
              <Sticker name="poupa-meu-tempo" color="laranja" width={96} />
            </div>
          </div>
          <div data-parallax="-44" data-float className="absolute -right-10 -bottom-6 sm:-right-16">
            <div data-motion="intro-sticker" data-at="1" className="rotate-[8deg]">
              <Sticker name="ta-no-briefing" color="rosa" width={110} anchor="bottom" />
            </div>
          </div>
        </div>
      </Container>
      <div className="relative overflow-hidden border-t-2 border-benja-noite bg-benja-lima px-4 py-3 text-xs font-black tracking-[0.25em] text-benja-verde uppercase sm:text-sm sm:tracking-[0.3em]">
        <p className="text-center motion-on:sr-only">
          {settings.tagline}
          <span className="hidden sm:inline"> · estratégia · conteúdo · criação · eventos · imprensa</span>
        </p>
        {/* Com as animações ligadas, a faixa anda com a rolagem; o texto acima segue para os leitores de tela. */}
        <div aria-hidden data-band-track className="hidden w-max gap-[1.5em] whitespace-nowrap motion-on:flex">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index}>{bandText(settings.tagline)}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
