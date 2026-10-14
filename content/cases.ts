/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Content
 Arquivo      : cases.ts
 Descrição    : Categorias de trabalhos e cases iniciais (Aventura de Construir, Meridiano, FECAP).

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

import type { CaseCategory, CaseStudy } from "../lib/domain/content/types";

const published = {
  status: "published" as const,
  publishedAt: "2026-10-13T00:00:00.000Z",
  updatedAt: "2026-10-13T00:00:00.000Z",
  provisional: true,
};

/** Categorias de trabalhos (PRJ §12). */
export const categories: CaseCategory[] = [
  {
    ...published,
    provisional: false,
    id: "category-copywriting",
    slug: "copywriting",
    name: "Copywriting",
    description: "Artigos, textos e narrativas desenvolvidos pela Agência Benjamin.",
    order: 1,
  },
  {
    ...published,
    provisional: false,
    id: "category-social-media-e-criacao",
    slug: "social-media-e-criacao",
    name: "Social Media & Criação",
    description: "Desdobramentos visuais, criativos e estratégicos para as redes sociais dos clientes.",
    order: 2,
  },
  {
    ...published,
    provisional: false,
    id: "category-assessoria-de-imprensa",
    slug: "assessoria-de-imprensa",
    name: "Assessoria de Imprensa",
    description: "Releases, pautas, publicações, clippings e matérias conquistadas.",
    order: 3,
  },
];

/**
 * Cases iniciais citados no documento de requisitos (PRJ §11). Apenas fatos do
 * relatório; desafio, solução, resultados e imagens reais dependem de CON-06…CON-08.
 * As capas são ilustrações provisórias da marca.
 */
export const cases: CaseStudy[] = [
  {
    ...published,
    id: "case-aventura-de-construir",
    slug: "aventura-de-construir",
    title: "Conteúdo para o blog Aventura de Construir",
    client: "Aventura de Construir",
    categoryId: "category-copywriting",
    serviceIds: ["service-copywriting", "service-producao-de-conteudo"],
    deliveryType: "Artigos para blog",
    summary: "Artigos e textos desenvolvidos pela Agência Benjamin para o blog Aventura de Construir.",
    cover: {
      src: "/brand/cases/aventura-de-construir.webp",
      alt: "Ilustração provisória com ícone de envio e sticker da Agência Benjamin",
      width: 1200,
      height: 750,
    },
    gallery: [],
    externalLinks: [],
    team: [],
    featured: true,
    order: 1,
  },
  {
    ...published,
    id: "case-meridiano",
    slug: "meridiano",
    title: "Social media e criação para a Meridiano",
    client: "Meridiano",
    // Categoria a confirmar com o material do case (CON-07).
    categoryId: "category-social-media-e-criacao",
    serviceIds: ["service-social-media", "service-design-e-identidade-visual"],
    deliveryType: "Redes sociais",
    summary: "Desdobramentos visuais, criativos e estratégicos desenvolvidos para as redes sociais da Meridiano.",
    cover: {
      src: "/brand/cases/meridiano.webp",
      alt: "Ilustração provisória com ícone de coração e sticker da Agência Benjamin",
      width: 1200,
      height: 750,
    },
    gallery: [],
    externalLinks: [],
    team: [],
    featured: true,
    order: 2,
  },
  {
    ...published,
    id: "case-fecap",
    slug: "fecap",
    title: "Assessoria de imprensa para a FECAP",
    client: "FECAP",
    categoryId: "category-assessoria-de-imprensa",
    serviceIds: ["service-assessoria-de-imprensa"],
    deliveryType: "Releases e publicações",
    summary:
      "Releases, pautas e conteúdos publicados no site da FECAP e conquistados em veículos externos pela Agência Benjamin.",
    cover: {
      src: "/brand/cases/fecap.webp",
      alt: "Ilustração provisória com ícone de megafone e sticker da Agência Benjamin",
      width: 1200,
      height: 750,
    },
    gallery: [],
    externalLinks: [],
    team: [],
    featured: true,
    order: 3,
  },
];
