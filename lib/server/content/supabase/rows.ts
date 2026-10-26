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
  ctas: `id, label, placement, target_kind, target_path, target_url, target_service_id, target_case_id, target_area_id, sort_order, ${PUBLISHABLE}`,
  pages: `id, slug, title, description, ${PUBLISHABLE}`,
  blocks: "id, page_id, type, content, sort_order",
  site_settings: "name, short_name, tagline, description, manifesto, about, contact, socials, keywords",
} as const;

export type CmsTable = keyof typeof COLUMNS;
