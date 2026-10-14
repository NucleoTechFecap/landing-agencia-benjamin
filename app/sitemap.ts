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
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (SEO da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config/public-env";
import { listCases, listServices } from "@/lib/server/content/repository";

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/sobre", priority: 0.8, changeFrequency: "monthly" },
  { path: "/areas", priority: 0.8, changeFrequency: "monthly" },
  { path: "/servicos", priority: 0.9, changeFrequency: "weekly" },
  { path: "/cases", priority: 0.9, changeFrequency: "weekly" },
  { path: "/contato", priority: 0.8, changeFrequency: "yearly" },
  { path: "/feedback", priority: 0.4, changeFrequency: "yearly" },
  { path: "/privacidade", priority: 0.2, changeFrequency: "yearly" },
];

/**
 * Sitemap com páginas institucionais e somente serviços/cases PUBLICADOS (lidos do
 * mesmo repositório cacheado do site — sai do sitemap na mesma invalidação, TECH-09).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, cases] = await Promise.all([listServices(), listCases()]);
  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${siteUrl}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...services.map((service) => ({
      url: `${siteUrl}/servicos/${service.slug}`,
      lastModified: new Date(service.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...cases.map((item) => ({
      url: `${siteUrl}/cases/${item.slug}`,
      lastModified: new Date(item.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      ...(item.cover ? { images: [`${siteUrl}${item.cover.src}`] } : {}),
    })),
  ];
}
