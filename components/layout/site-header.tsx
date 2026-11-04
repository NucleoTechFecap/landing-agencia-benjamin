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
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";
import Link from "next/link";
import { Container } from "../ui/container";
import { HeaderContactCta } from "./contact-cta";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

/** Cabeçalho fixo com logo, navegação e CTA principal (PRJ §7.3). */
export function SiteHeader() {
  return (
    <header
      data-site-header
      className="sticky top-0 z-40 border-b-2 border-benja-noite bg-benja-nyanza/95 backdrop-blur transition-shadow duration-300 supports-[backdrop-filter]:bg-benja-nyanza/85 data-scrolled:shadow-[0_4px_0_0_var(--color-benja-noite)]"
    >
      <Container className="relative flex h-20 items-center justify-between gap-4">
        <Link href="/" data-motion="chrome" className="shrink-0" aria-label="Agência Benjamin — página inicial">
          {/* Tamanho mínimo do logotipo em telas: 70 px (brandbook). */}
          <Image
            src="/brand/logos/logo-horizontal.svg"
            alt="Agência Benjamin"
            width={107}
            height={70}
            priority
            className="h-14 w-auto"
          />
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-2">
          <NavLinks />
          <HeaderContactCta />
          <MobileMenu />
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
