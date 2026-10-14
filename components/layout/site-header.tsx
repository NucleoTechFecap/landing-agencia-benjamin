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
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "../ui/button-link";
import { Container } from "../ui/container";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

/** Cabeçalho fixo com logo, navegação e CTA principal (PRJ §7.3). */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-benja-noite bg-benja-nyanza/95 backdrop-blur supports-[backdrop-filter]:bg-benja-nyanza/85">
      <Container className="relative flex h-20 items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label="Agência Benjamin — página inicial">
          {/* Tamanho mínimo do logotipo em telas: 70 px (brandbook). */}
          <Image src="/brand/logo-horizontal.webp" alt="Agência Benjamin" width={110} height={70} priority className="h-14 w-auto" />
        </Link>
        <nav aria-label="Principal" className="flex items-center gap-2">
          <NavLinks />
          <ButtonLink href="/contato" variant="primary" className="hidden px-5 py-2 text-sm sm:inline-flex">
            Fale com a gente
          </ButtonLink>
          <MobileMenu />
        </nav>
      </Container>
    </header>
  );
}
