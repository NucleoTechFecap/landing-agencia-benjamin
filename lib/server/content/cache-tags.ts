/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : cache-tags.ts
 Descrição    : Tags de cache do conteúdo público usadas na leitura e na invalidação.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 26/10/2026 Vinícius Nishimura Reis  Tags e invalidação de páginas do CMS (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";

/**
 * Tags de cache do conteúdo público. Toda leitura cacheada declara suas tags e toda
 * mutação no CMS invalida as tags afetadas (TECH-09).
 */
export const CONTENT_TAGS = {
  all: "content",
  settings: "content:settings",
  areas: "content:areas",
  services: "content:services",
  service: (slug: string) => `content:service:${slug}`,
  categories: "content:categories",
  cases: "content:cases",
  case: (slug: string) => `content:case:${slug}`,
  ctas: "content:ctas",
  pages: "content:pages",
  page: (slug: string) => `content:page:${slug}`,
} as const;
