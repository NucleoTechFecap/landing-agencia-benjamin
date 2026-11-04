/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : site-header.tsx
 Descrição    : Cabeçalho fixo com logo, navegação e CTA principal.

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
 25/10/2026 Caio Moraes              Esconde o CTA do header abaixo de 640 px (LAY-02).
 26/10/2026 Vinícius Nishimura Reis  Logotipo horizontal em SVG (UX-14).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Sem o botão de contato na própria página de contato (INT-06).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import type { ResolvedPage } from "@/lib/domain/content/catalog";
import type { GERAL } from "@/lib/domain/content/catalog/geral";
import type { ImageValue } from "@/lib/domain/content/fields";
import { DEFAULT_LOGOS } from "@/lib/domain/content/theme";
import { Container } from "../ui/container";
import { SiteImage } from "../ui/site-image";
import { HeaderContactCta } from "./contact-cta";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

/** Cabeçalho fixo com logo, navegação e CTA principal (PRJ §7.3). */
export function SiteHeader({
  campos,
  logo,
}: {
  campos: ResolvedPage<typeof GERAL>["cabecalho"];
  /** Logotipo escolhido em Aparência; sem ele, o da marca. */
  logo?: ImageValue;
}) {
  const logotipo = logo ?? DEFAULT_LOGOS.logoHeader;
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 border-b-2 border-benja-noite bg-benja-nyanza/95 backdrop-blur transition-shadow duration-300 supports-[backdrop-filter]:bg-benja-nyanza/85 data-scrolled:shadow-[0_4px_0_0_var(--color-benja-noite)]"
    >
      <Container className="relative flex h-20 items-center justify-between gap-4">
        <Link href="/" data-motion="chrome" className="shrink-0" aria-label="Agência Benjamin — página inicial">
          {/* Tamanho mínimo do logotipo em telas: 70 px (brandbook). */}
          <SiteImage
            src={logotipo.src}
            alt={logotipo.alt || DEFAULT_LOGOS.logoHeader.alt}
            width={logotipo.width ?? DEFAULT_LOGOS.logoHeader.width}
            height={logotipo.height ?? DEFAULT_LOGOS.logoHeader.height}
            priority
            className="h-14 w-auto"
          />
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-2">
          <NavLinks items={campos.menu} ctaHref={campos.cta.href} />
          <HeaderContactCta link={campos.cta} />
          <MobileMenu main={campos.menu} secondary={campos.menuSecundario} />
        </nav>
      </Container>
      {/* Progresso de leitura da página (só com as animações ligadas). */}
      <span
        aria-hidden
        data-scroll-progress
        className="absolute inset-x-0 -bottom-0.5 hidden h-1 origin-left bg-benja-lima motion-on:block"
        style={{ transform: "scaleX(0)" }}
      />
    </header>
  );
}
