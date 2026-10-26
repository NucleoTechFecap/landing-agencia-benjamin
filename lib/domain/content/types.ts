/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : types.ts
 Descrição    : Tipos das entidades de conteúdo: áreas, serviços, categorias, cases, CTAs e configurações.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-05).
 26/10/2026 Vinícius Nishimura Reis  Página editável e entidade page (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import type { PageBlock } from "./blocks";
import type { PublicationStatus } from "./publication-status";

/** Campos de controle comuns a todo conteúdo publicável (ADM-12). */
export interface Publishable {
  status: PublicationStatus;
  /** ISO 8601. Preenchido na primeira publicação. */
  publishedAt: string | null;
  archivedAt?: string | null;
  updatedAt: string;
  /** Texto provisório (PRJ §40): exibe selo e bloqueia o go-live (GO-01). */
  provisional?: boolean;
}

export interface MediaRef {
  /** Caminho em /public ou URL do bucket de mídia (ARC-10). */
  src: string;
  /** Texto alternativo obrigatório para imagens informativas (RNF-03). */
  alt: string;
  width?: number;
  height?: number;
}

export interface ExternalLink {
  label: string;
  url: string;
}

/** Áreas de atuação da agência (PRJ §9). */
export interface Area extends Publishable {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  /** Itens de atuação exibidos em lista (ex.: "Instagram", "TikTok"). */
  highlights: string[];
  /** Chave do ícone do brandbook (public/brand/icons). */
  icon?: string;
  order: number;
}

/** Serviços oferecidos (PRJ §10). Relaciona-se com 1..N áreas. */
export interface Service extends Publishable {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  areaIds: string[];
  examples: string[];
  icon?: string;
  image?: MediaRef;
  featured: boolean;
  order: number;
}

/** Categorias de trabalhos do portfólio (PRJ §12). */
export interface CaseCategory extends Publishable {
  id: string;
  slug: string;
  name: string;
  description: string;
  order: number;
}

/** Case/conteúdo do portfólio (PRJ §13; campos validados em CASE-11). */
export interface CaseStudy extends Publishable {
  id: string;
  slug: string;
  title: string;
  client: string;
  categoryId: string;
  serviceIds: string[];
  /** Ex.: "Artigos para blog", "Campanha", "Release". */
  deliveryType?: string;
  summary: string;
  challenge?: string;
  solution?: string;
  results?: string;
  cover?: MediaRef;
  gallery: MediaRef[];
  externalLinks: ExternalLink[];
  /** Mês de referência no formato AAAA-MM. */
  date?: string;
  team: string[];
  featured: boolean;
  order: number;
}

/** Destino de uma chamada para ação (TECH-05). */
export type CtaTarget =
  | { kind: "internal"; path: string }
  | { kind: "external"; url: string }
  | { kind: "service"; serviceId: string }
  | { kind: "case"; caseId: string }
  | { kind: "area"; areaId: string }
  | { kind: "contact"; serviceId?: string };

export type CtaPlacement = "home-hero" | "home-highlight" | "footer" | "service-detail" | "case-detail";

export interface Cta extends Publishable {
  id: string;
  label: string;
  target: CtaTarget;
  placement: CtaPlacement;
  order: number;
}

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  linkedin?: string;
}

/** Configuração institucional editável no CMS (ADM-10). */
export interface SiteSettings {
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  manifesto: { title: string; paragraphs: string[]; provisional?: boolean };
  about: {
    title: string;
    intro: string;
    valueProposition: string;
    howWeWork: string;
    fecapRelation: string;
    provisional?: boolean;
  };
  contact: { email?: string; phone?: string; address?: string; mapsUrl?: string };
  socials: SocialLinks;
  keywords: string[];
}

/** Recorte de todo o conteúdo usado nas validações de integridade. */
export interface ContentSnapshot {
  areas: Area[];
  services: Service[];
  categories: CaseCategory[];
  cases: CaseStudy[];
  ctas: Cta[];
}

/** Página editável (DB-01/DB-03). Os blocos já chegam validados pelo catálogo de blocks.ts. */
export interface Page extends Publishable {
  id: string;
  slug: string;
  title: string;
  description?: string;
  blocks: PageBlock[];
}

export type ContentEntityType = "area" | "service" | "category" | "case" | "cta" | "page";
