/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : store.ts
 Descrição    : Contrato de persistência do CMS (tabelas, vínculos e concorrência otimista).

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Biblioteca de mídia no store e opções de imagem (ADM-06).
 26/10/2026 Vinícius Nishimura Reis  Categorias, cases, galeria e envio de mídia (ADM-08).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { ContentSnapshot, MediaRef } from "@/lib/domain/content/types";

/** Tabelas de itens editáveis no painel. */
export type EntityTable = "areas" | "services" | "case_categories" | "cases" | "ctas";

/** Tabelas de vínculo N:M (sem estado próprio). */
export type LinkTable = "service_areas" | "case_services";

export type Row = Record<string, unknown>;

export interface SavedRow {
  id: string;
  /** Versão otimista: o próximo save precisa devolver este valor (TECH-04 §5). */
  updatedAt: string;
}

/** Colunas gravadas ao registrar um arquivo na biblioteca (public.media_assets). */
export interface MediaRow {
  path: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  decorative: boolean;
}

/** Arquivo da biblioteca de mídia, como o painel lista para escolha. */
export interface MediaAsset extends MediaRef {
  id: string;
  mimeType: string;
  decorative: boolean;
}

export interface LinkSync {
  table: LinkTable;
  ownerColumn: string;
  ownerId: string;
  otherColumn: string;
  current: readonly string[];
  next: readonly string[];
}

/**
 * Persistência usada pela camada de serviço do CMS. A implementação de produção grava com a
 * sessão de quem está logado (a RLS do banco é a segunda barreira, ADR-0003); a de memória
 * existe para testar as regras sem banco. Erros saem como AppError: NOT_FOUND, CONFLICT
 * (versão desatualizada ou item em uso), VALIDATION_FAILED (slug repetido), FORBIDDEN.
 */
export interface CmsStore {
  /** Conteúdo em qualquer estado: base das listagens do painel e das regras de integridade. */
  snapshot(): Promise<ContentSnapshot>;
  /** Biblioteca de mídia inteira (imagens e PDFs), mais recentes primeiro. */
  listMedia(): Promise<MediaAsset[]>;
  insert(table: EntityTable, values: Row): Promise<SavedRow>;
  /** Grava só se `updated_at` ainda for `expectedUpdatedAt` (concorrência otimista). */
  update(table: EntityTable, id: string, values: Row, expectedUpdatedAt: string): Promise<SavedRow>;
  remove(table: EntityTable, id: string): Promise<void>;
  /** Registra um arquivo já enviado ao Storage na biblioteca de mídia. */
  insertMedia(values: MediaRow): Promise<MediaAsset>;
  /** Galeria do case na ordem dada (reordena, inclui e remove). */
  syncGallery(caseId: string, mediaIds: readonly string[]): Promise<void>;
  /**
   * Ajusta os vínculos de um item. Inclui os novos antes de remover os antigos: se a segunda
   * etapa falhar, sobra um vínculo a mais (corrigido no próximo save), nunca um a menos.
   */
  syncLinks(sync: LinkSync): Promise<void>;
}
