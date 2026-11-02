/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : seo.ts
 Descrição    : Metadados de página (canonical, Open Graph, Twitter, keywords e robots).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (SEO da landing).
 01/11/2026 Vinícius Nishimura Reis  SEO e compartilhamento das páginas públicas (SEG-09).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { Metadata } from "next";
import { isIndexable, siteUrl } from "@/lib/config/public-env";
import type { SiteSettings } from "@/lib/domain/content/types";

export const SITE_NAME = "Agência Benjamin";
export const DEFAULT_TITLE = "Agência Benjamin — agência experimental de comunicação da FECAP";

export interface PageSeo {
  title: string;
  description: string;
  /** Caminho canônico iniciado por "/" (sem domínio). */
  path: string;
  keywords?: string[];
  type?: "website" | "article";
  /** Imagem de compartilhamento específica; sem ela vale a da marca (app/opengraph-image). */
  image?: { url: string; alt: string; width?: number; height?: number };
  /** A rota tem opengraph-image próprio: nada aqui pode encobrir o arquivo do segmento. */
  segmentImage?: boolean;
  noindex?: boolean;
  /** Ignora o template "%s | Agência Benjamin" (Home). */
  absoluteTitle?: boolean;
}

/*
 * O `openGraph` da página substitui o do segmento pai por inteiro: sem `images`, o arquivo
 * app/opengraph-image some do HTML (medido no SEG-09). Por isso a imagem da marca vem declarada.
 */
const BRAND_IMAGE = { url: "/opengraph-image", alt: DEFAULT_TITLE, width: 1200, height: 630 };
const BRAND_TWITTER_IMAGE = "/twitter-image";

/** URL absoluta a partir de um caminho interno. */
export function absoluteUrl(path = "/"): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Metadados completos de uma página (SEO, Open Graph e Twitter) com canonical e
 * keywords; fora de produção a indexação é sempre bloqueada (ARC-06).
 */
export function buildMetadata(page: PageSeo, settings?: Pick<SiteSettings, "keywords">): Metadata {
  const keywords = [...new Set([...(page.keywords ?? []), ...(settings?.keywords ?? [])])];
  const index = isIndexable && !page.noindex;
  const openGraphImage = page.segmentImage ? {} : { images: [page.image ?? BRAND_IMAGE] };
  const twitterImage = page.segmentImage ? {} : { images: [page.image?.url ?? BRAND_TWITTER_IMAGE] };
  return {
    title: page.absoluteTitle ? { absolute: page.title } : page.title,
    description: page.description,
    keywords,
    alternates: { canonical: page.path },
    robots: {
      index,
      follow: index,
      googleBot: { index, follow: index, "max-image-preview": "large", "max-snippet": -1 },
    },
    openGraph: {
      type: page.type ?? "website",
      locale: "pt_BR",
      siteName: SITE_NAME,
      url: page.path,
      title: page.title,
      description: page.description,
      ...openGraphImage,
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      ...twitterImage,
    },
  };
}
