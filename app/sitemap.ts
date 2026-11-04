/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : sitemap.ts
 Descrição    : Sitemap com páginas institucionais e conteúdo publicado.

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

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config/public-env";
import { getPage, listCases, listFreePages, listServices } from "@/lib/server/content/repository";

const STATIC_ROUTES: {
  slug: string;
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { slug: "home", path: "", priority: 1, changeFrequency: "weekly" },
  { slug: "sobre", path: "/sobre", priority: 0.8, changeFrequency: "monthly" },
  { slug: "areas", path: "/areas", priority: 0.8, changeFrequency: "monthly" },
  { slug: "servicos", path: "/servicos", priority: 0.9, changeFrequency: "weekly" },
  { slug: "cases", path: "/cases", priority: 0.9, changeFrequency: "weekly" },
  { slug: "contato", path: "/contato", priority: 0.8, changeFrequency: "yearly" },
  { slug: "feedback", path: "/feedback", priority: 0.4, changeFrequency: "yearly" },
  { slug: "privacidade", path: "/privacidade", priority: 0.2, changeFrequency: "yearly" },
];

/**
 * Sitemap com páginas institucionais e somente serviços/cases PUBLICADOS (lidos do
 * mesmo repositório cacheado do site — sai do sitemap na mesma invalidação, TECH-09).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, cases, freePages, routePages] = await Promise.all([
    listServices(),
    listCases(),
    listFreePages(),
    Promise.all(STATIC_ROUTES.map(({ slug }) => getPage(slug))),
  ]);
  // Rota marcada no painel para não aparecer em buscadores também sai daqui.
  const hidden = new Set(routePages.flatMap((page) => (page?.seo?.noindex ? page.slug : [])));
  return [
    ...STATIC_ROUTES.filter(({ slug }) => !hidden.has(slug)).map((route) => ({
      url: `${siteUrl}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...freePages
      .filter((page) => !page.seo?.noindex)
      .map((page) => ({
        url: `${siteUrl}/${page.slug}`,
        lastModified: new Date(page.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
    ...services
      .filter((service) => !service.seo?.noindex)
      .map((service) => ({
        url: `${siteUrl}/servicos/${service.slug}`,
        lastModified: new Date(service.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ...cases
      .filter((item) => !item.seo?.noindex)
      .map((item) => ({
        url: `${siteUrl}/cases/${item.slug}`,
        lastModified: new Date(item.updatedAt),
        changeFrequency: "monthly" as const,
        priority: 0.7,
        // A capa do Storage já é uma URL absoluta; só a de /public recebe o domínio do site.
        ...(item.cover ? { images: [new URL(item.cover.src, siteUrl).href] } : {}),
      })),
  ];
}
