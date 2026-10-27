/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : structured-data.ts
 Descrição    : Dados estruturados schema.org (Organization, WebSite, Breadcrumb, Service, CreativeWork).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (SEO da landing).
 26/10/2026 Vinícius Nishimura Reis  Logotipos em /brand/logos (UX-14).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Area, CaseStudy, Service, SiteSettings } from "../content/types";

/** Monta dados estruturados schema.org a partir do conteúdo (SEO e assistentes de IA). */

export function organizationSchema(settings: SiteSettings, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organizacao`,
    name: settings.name,
    alternateName: settings.shortName,
    slogan: settings.tagline,
    description: settings.description,
    url: siteUrl,
    logo: `${siteUrl}/brand/logos/logo-horizontal.png`,
    image: `${siteUrl}/brand/logos/logo-vertical.png`,
    sameAs: Object.values(settings.socials).filter(Boolean),
    ...(settings.contact.email ? { email: settings.contact.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Av. da Liberdade, 532",
      addressLocality: "São Paulo",
      addressRegion: "SP",
      postalCode: "01502-001",
      addressCountry: "BR",
    },
    parentOrganization: {
      "@type": "CollegeOrUniversity",
      name: "FECAP — Fundação Escola de Comércio Álvares Penteado",
      url: "https://www.fecap.br",
    },
    knowsAbout: settings.keywords,
  };
}

export function websiteSchema(settings: SiteSettings, siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#site`,
    name: settings.name,
    url: siteUrl,
    inLanguage: "pt-BR",
    publisher: { "@id": `${siteUrl}/#organizacao` },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

export function serviceSchema(service: Service, areas: Area[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    serviceType: service.name,
    description: service.description,
    url: `${siteUrl}/servicos/${service.slug}`,
    provider: { "@id": `${siteUrl}/#organizacao` },
    areaServed: { "@type": "Country", name: "Brasil" },
    category: areas.map((area) => area.name),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `Entregas de ${service.name}`,
      itemListElement: service.examples.map((example) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: example },
      })),
    },
  };
}

export function caseSchema(item: CaseStudy, categoryName: string | undefined, services: Service[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: item.title,
    headline: item.title,
    abstract: item.summary,
    url: `${siteUrl}/cases/${item.slug}`,
    creator: { "@id": `${siteUrl}/#organizacao` },
    about: { "@type": "Organization", name: item.client },
    genre: categoryName,
    keywords: services.map((service) => service.name).join(", "),
    inLanguage: "pt-BR",
    ...(item.cover ? { image: `${siteUrl}${item.cover.src}` } : {}),
    ...(item.date ? { dateCreated: item.date } : {}),
    ...(item.publishedAt ? { datePublished: item.publishedAt } : {}),
  };
}

export function itemListSchema(name: string, items: { name: string; path: string }[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: `${siteUrl}${item.path}`,
    })),
  };
}
