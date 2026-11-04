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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (SEO da landing).
 01/11/2026 Vinícius Nishimura Reis  SEO e compartilhamento das páginas públicas (SEG-09).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { Metadata } from "next";
import { isIndexable, siteUrl } from "@/lib/config/public-env";
import type { ImageValue } from "@/lib/domain/content/fields";
import { effectiveSeo, type SeoData } from "@/lib/domain/content/seo-schema";
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
  /** O que foi preenchido na aba SEO do painel: vale por cima de tudo acima. */
  seo?: SeoData;
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

/** Imagem de compartilhamento: a do painel usa `src` e texto alternativo próprio, a da rota, `url`. */
function toOpenGraphImage(image: NonNullable<PageSeo["image"]> | ImageValue, title: string) {
  if ("url" in image) return image;
  return {
    url: image.src,
    alt: image.alt || title,
    ...(image.width && image.height ? { width: image.width, height: image.height } : {}),
  };
}

/**
 * Metadados completos de uma página (SEO, Open Graph e Twitter) com canonical e
 * keywords; fora de produção a indexação é sempre bloqueada (ARC-06).
 */
export function buildMetadata(page: PageSeo, settings?: Pick<SiteSettings, "keywords" | "theme">): Metadata {
  const seo = effectiveSeo(page, page.seo);
  const keywords = [...new Set([...seo.keywords, ...(settings?.keywords ?? [])])];
  const index = isIndexable && !page.noindex && !seo.noindex;
  // Imagem da página (painel ou rota) > arquivo opengraph-image do segmento > imagem padrão do tema > marca.
  const custom = page.seo?.ogImage ?? page.image;
  const fallback = settings?.theme?.images?.shareImage;
  const image = custom ?? fallback;
  const imageUrl = image ? ("url" in image ? image.url : image.src) : undefined;
  const openGraphImage =
    page.segmentImage && !page.seo?.ogImage
      ? {}
      : { images: [image ? toOpenGraphImage(image, seo.ogTitle) : BRAND_IMAGE] };
  const twitterImage = page.segmentImage && !page.seo?.ogImage ? {} : { images: [imageUrl ?? BRAND_TWITTER_IMAGE] };
  return {
    title: page.absoluteTitle || page.seo?.title ? { absolute: seo.title } : seo.title,
    description: seo.description,
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
      title: seo.ogTitle,
      description: seo.ogDescription,
      ...openGraphImage,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle,
      description: seo.ogDescription,
      ...twitterImage,
    },
  };
}
