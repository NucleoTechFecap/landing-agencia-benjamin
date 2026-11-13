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
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (SEO da landing).
 01/11/2026 Vinícius Nishimura Reis  SEO e compartilhamento (SEG-09).
 04/11/2026 Vinícius Nishimura Reis  Editor do site (campos, SEO e páginas personalizadas).
 12/11/2026 Codex                     Inclui artigos publicados no sitemap (FUT-10).
──────────────────────────────────────────────────────────────────────────────
*/
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config/public-env";
import { getPage, listCases, listFreePages, listServices } from "@/lib/server/content/repository";
import { listArticles } from "@/lib/server/blog/repository";
const STATIC_ROUTES = [
  { slug: "home", path: "", priority: 1, changeFrequency: "weekly" },
  { slug: "sobre", path: "/sobre", priority: 0.8, changeFrequency: "monthly" },
  { slug: "areas", path: "/areas", priority: 0.8, changeFrequency: "monthly" },
  { slug: "servicos", path: "/servicos", priority: 0.9, changeFrequency: "weekly" },
  { slug: "cases", path: "/cases", priority: 0.9, changeFrequency: "weekly" },
  { slug: "contato", path: "/contato", priority: 0.8, changeFrequency: "yearly" },
  { slug: "feedback", path: "/feedback", priority: 0.4, changeFrequency: "yearly" },
  { slug: "privacidade", path: "/privacidade", priority: 0.2, changeFrequency: "yearly" },
] as const;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, cases, freePages, routePages, articles] = await Promise.all([
    listServices(),
    listCases(),
    listFreePages(),
    Promise.all(STATIC_ROUTES.map(({ slug }) => getPage(slug))),
    listArticles(),
  ]);
  const hidden = new Set(routePages.flatMap((page) => (page?.seo?.noindex ? [page.slug] : [])));
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
      .filter((item) => !item.seo?.noindex)
      .map((item) => ({
        url: `${siteUrl}/servicos/${item.slug}`,
        lastModified: new Date(item.updatedAt),
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
        ...(item.cover ? { images: [new URL(item.cover.src, siteUrl).href] } : {}),
      })),
    { url: `${siteUrl}/blog`, changeFrequency: "weekly" as const, priority: 0.8 },
    ...articles.map((item) => ({
      url: `${siteUrl}/blog/${item.slug}`,
      lastModified: new Date(item.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
