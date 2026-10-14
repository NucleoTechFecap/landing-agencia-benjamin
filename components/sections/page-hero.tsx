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
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 13/10/2026 Vinícius Nishimura Reis  BreadcrumbList em JSON-LD (SEO da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { ReactNode } from "react";
import { siteUrl } from "@/lib/config/public-env";
import { breadcrumbSchema } from "@/lib/domain/seo/structured-data";
import { JsonLd } from "../seo/json-ld";
import { ProvisionalBadge } from "../ui/badge";
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
  provisional = false,
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
  provisional?: boolean;
  /** Caminho da página: gera o BreadcrumbList em JSON-LD. */
  path?: string;
  children?: ReactNode;
}) {
  const crumbsForSchema = path
    ? breadcrumbs.map((crumb, index) => ({ name: crumb.label, path: crumb.href ?? (index === breadcrumbs.length - 1 ? path : "/") }))
    : [];
  return (
    <Section tone={tone} halftone className="py-12 sm:py-16" labelledBy="pagina-titulo">
      {path ? <JsonLd data={breadcrumbSchema(crumbsForSchema, siteUrl)} /> : null}
      <Breadcrumbs items={breadcrumbs} />
      <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          {eyebrow ? <p className="text-sm font-bold tracking-widest uppercase opacity-90">{eyebrow}</p> : null}
          <h1 id="pagina-titulo" className="mt-2 text-balance text-4xl leading-[1.02] font-black tracking-tight sm:text-6xl">
            {title}
          </h1>
          {description ? <div className="mt-5 text-lg leading-relaxed opacity-95">{description}</div> : null}
          {provisional ? <ProvisionalBadge className="mt-4" /> : null}
          {children}
        </div>
        {icon ? <BrandIcon name={icon} color={iconColor} size={150} className="hidden shrink-0 md:block" /> : null}
      </div>
    </Section>
  );
}
