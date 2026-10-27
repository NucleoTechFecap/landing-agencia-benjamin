/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : rows.ts
 Descrição    : Formato das linhas das tabelas do CMS lidas pelo site e colunas selecionadas.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
 26/10/2026 Vinícius Nishimura Reis  Áreas, serviços, vínculos e mídia do CMS (DB-04).
 26/10/2026 Vinícius Nishimura Reis  Categorias, cases, vínculos e galeria do CMS (DB-05).
──────────────────────────────────────────────────────────────────────────────
*/

import type { PublicationStatus } from "@/lib/domain/content/publication-status";
import type { CtaPlacement } from "@/lib/domain/content/types";

/*
 * Espelho manual das tabelas de supabase/migrations/20261025000100_cms_content.sql.
 * O teste rows.test.ts confere que toda coluna listada em COLUMNS existe na migration —
 * renomear uma coluna no banco quebra o teste antes de quebrar o site.
 */

/** Campos de controle de publicação presentes em toda tabela publicável. */
export interface PublishableRow {
  status: PublicationStatus;
  provisional: boolean;
  published_at: string | null;
  archived_at: string | null;
  updated_at: string;
}

export interface AreaRow extends PublishableRow {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  highlights: string[];
  icon: string | null;
  sort_order: number;
}

export interface ServiceRow extends PublishableRow {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  examples: string[];
  icon: string | null;
  image_media_id: string | null;
  featured: boolean;
  sort_order: number;
}

export interface ServiceAreaRow {
  service_id: string;
  area_id: string;
}

export interface CategoryRow extends PublishableRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
}

export interface CaseRow extends PublishableRow {
  id: string;
  slug: string;
  title: string;
  client_name: string | null;
  category_id: string | null;
  delivery_type: string | null;
  summary: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  cover_media_id: string | null;
  /** jsonb: [{ label, url }] — a constraint do banco garante url https e label texto. */
  external_links: unknown;
  /** date com dia 1 (AAAA-MM-01). */
  reference_month: string | null;
  team: string[];
  featured: boolean;
  sort_order: number;
}

export interface CaseServiceRow {
  case_id: string;
  service_id: string;
}

export interface CaseMediaRow {
  case_id: string;
  media_id: string;
  sort_order: number;
}

export interface MediaAssetRow {
  id: string;
  /** Chave do bucket "media" ou caminho em /public (começa com "/"). */
  path: string;
  mime_type: string;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  decorative: boolean;
}

export interface CtaRow extends PublishableRow {
  id: string;
  label: string;
  placement: CtaPlacement;
  target_kind: "internal" | "external" | "service" | "case" | "area" | "contact";
  target_path: string | null;
  target_url: string | null;
  target_service_id: string | null;
  target_case_id: string | null;
  target_area_id: string | null;
  sort_order: number;
}

export interface PageRow extends PublishableRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
}

export interface BlockRow {
  id: string;
  page_id: string;
  type: string;
  content: unknown;
  sort_order: number;
}

export interface SiteSettingsRow {
  name: string;
  short_name: string;
  tagline: string;
  description: string;
  manifesto: unknown;
  about: unknown;
  contact: unknown;
  socials: unknown;
  keywords: string[] | null;
}

const PUBLISHABLE = "status, provisional, published_at, archived_at, updated_at";

/** Colunas pedidas ao PostgREST, por tabela. Nada de `*`: o site só lê o que exibe. */
export const COLUMNS = {
  areas: `id, slug, name, summary, description, highlights, icon, sort_order, ${PUBLISHABLE}`,
  services: `id, slug, name, summary, description, examples, icon, image_media_id, featured, sort_order, ${PUBLISHABLE}`,
  service_areas: "service_id, area_id",
  media_assets: "id, path, mime_type, width, height, alt_text, decorative",
  case_categories: `id, slug, name, description, sort_order, ${PUBLISHABLE}`,
  cases: `id, slug, title, client_name, category_id, delivery_type, summary, challenge, solution, results, cover_media_id, external_links, reference_month, team, featured, sort_order, ${PUBLISHABLE}`,
  case_services: "case_id, service_id",
  case_media: "case_id, media_id, sort_order",
  ctas: `id, label, placement, target_kind, target_path, target_url, target_service_id, target_case_id, target_area_id, sort_order, ${PUBLISHABLE}`,
  pages: `id, slug, title, description, ${PUBLISHABLE}`,
  blocks: "id, page_id, type, content, sort_order",
  site_settings: "name, short_name, tagline, description, manifesto, about, contact, socials, keywords",
} as const;

export type CmsTable = keyof typeof COLUMNS;
