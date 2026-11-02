/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : page-hero.tsx
 Descrição    : Cabeçalho padrão das páginas internas com breadcrumbs e ícone.

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
 13/10/2026 Vinícius Nishimura Reis  BreadcrumbList em JSON-LD (SEO da landing).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
──────────────────────────────────────────────────────────────────────────────
*/

import type { ReactNode } from "react";
import { siteUrl } from "@/lib/config/public-env";
import { breadcrumbSchema } from "@/lib/domain/seo/structured-data";
import { PageReady } from "../motion/page-ready";
import { JsonLd } from "../seo/json-ld";
import { BrandIcon, type BrandIconColor } from "../ui/brand-icon";
import { Breadcrumbs, type Crumb } from "../ui/breadcrumbs";
import { Section, type SectionTone } from "../ui/section";

/** Cabeçalho das páginas internas com breadcrumbs, título (h1) e ícone da marca. */
export function PageHero({
  eyebrow,
  title,
  description,
  breadcrumbs,
  tone = "verde",
  icon,
  iconColor = "lima",
  path,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  breadcrumbs: Crumb[];
  tone?: SectionTone;
  icon?: string;
  iconColor?: BrandIconColor;
  /** Caminho da página: gera o BreadcrumbList em JSON-LD. */
  path?: string;
  children?: ReactNode;
}) {
  const crumbsForSchema = path
    ? breadcrumbs.map((crumb, index) => ({
        name: crumb.label,
        path: crumb.href ?? (index === breadcrumbs.length - 1 ? path : "/"),
      }))
    : [];
  return (
    <Section tone={tone} halftone className="py-12 sm:py-16" labelledBy="pagina-titulo">
      <PageReady />
      {path ? <JsonLd data={breadcrumbSchema(crumbsForSchema, siteUrl)} /> : null}
      <div data-motion="intro-fade" data-at="0">
        <Breadcrumbs items={breadcrumbs} />
      </div>
      <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? (
            <div data-motion="intro-fade" data-at="0.05">
              <p className="text-sm font-bold tracking-widest uppercase opacity-90">{eyebrow}</p>
            </div>
          ) : null}
          <h1
            id="pagina-titulo"
            data-motion="intro-lines"
            data-at="0.1"
            className="mt-2 text-balance text-4xl leading-[1.02] font-black tracking-tight sm:text-6xl"
          >
            {title}
          </h1>
          {description ? (
            <div data-motion="intro-fade" data-at="0.45">
              <div className="mt-5 text-lg leading-relaxed opacity-95">{description}</div>
            </div>
          ) : null}
          {children ? (
            <div data-motion="intro-fade" data-at="0.55">
              {children}
            </div>
          ) : null}
        </div>
        {icon ? (
          <div data-parallax="-32" className="hidden shrink-0 md:block">
            <div data-motion="intro-icon" data-at="0.25">
              <BrandIcon name={icon} color={iconColor} size={150} />
            </div>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
