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
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Biblioteca de mídia no store e opções de imagem (ADM-06).
 26/10/2026 Vinícius Nishimura Reis  Categorias, cases, galeria e envio de mídia (ADM-08).
 29/10/2026 Vinicius Binda             Endereços antigos e reservados (retiredSlugs) (DB-08).
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 02/11/2026 Vinícius Nishimura Reis  saveWithRelations no lugar de syncLinks e syncGallery (TECH-13, #314).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { ContentSnapshot, MediaRef, Page } from "@/lib/domain/content/types";

/** Tabelas de itens editáveis no painel. */
export type EntityTable = "areas" | "services" | "case_categories" | "cases" | "ctas" | "pages";

/** Conteúdo do painel: o do site mais as páginas, que só o painel lê em conjunto. */
export interface CmsSnapshot extends ContentSnapshot {
  pages: Page[];
}

/** Colunas de um bloco de página; o conteúdo já chega validado por BLOCK_SCHEMAS. */
export interface BlockValues {
  page_id: string;
  type: string;
  content: unknown;
  sort_order: number;
}

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

/** Tipos com página própria, cujo endereço antigo redireciona (public.slug_redirects, DB-08). */
export type RedirectEntity = "service" | "case";

/** Endereço que um item publicado já usou: segue com ele (301) ou, se foi excluído, reservado. */
export interface RetiredSlug {
  slug: string;
  /** Item que responde pelo endereço; `null` quando ele foi excluído (endereço reservado). */
  itemId: string | null;
}

/** Relações gravadas junto com o item, na mesma transação do banco (TECH-13). */
export type ItemRelations =
  | { table: "services"; areaIds: readonly string[] }
  | { table: "cases"; serviceIds: readonly string[]; galleryIds: readonly string[] };

/**
 * Persistência usada pela camada de serviço do CMS. A implementação de produção grava com a
 * sessão de quem está logado (a RLS do banco é a segunda barreira, ADR-0003); a de memória
 * existe para testar as regras sem banco. Erros saem como AppError: NOT_FOUND, CONFLICT
 * (versão desatualizada ou item em uso), VALIDATION_FAILED (slug repetido), FORBIDDEN.
 */
export interface CmsStore {
  /** Conteúdo em qualquer estado: base das listagens do painel e das regras de integridade. */
  snapshot(): Promise<CmsSnapshot>;
  /** Biblioteca de mídia inteira (imagens e PDFs), mais recentes primeiro. */
  listMedia(): Promise<MediaAsset[]>;
  /**
   * Endereços antigos e reservados do tipo. Quem grava é o banco (trigger track_slug), ao
   * trocar o slug de item já publicado ou excluí-lo; o painel só consulta para avisar antes.
   */
  retiredSlugs(entity: RedirectEntity): Promise<RetiredSlug[]>;
  insert(table: EntityTable, values: Row): Promise<SavedRow>;
  /** Grava só se `updated_at` ainda for `expectedUpdatedAt` (concorrência otimista). */
  update(table: EntityTable, id: string, values: Row, expectedUpdatedAt: string): Promise<SavedRow>;
  /**
   * Cria (sem `version`) ou edita o item e substitui as relações dele numa só transação: qualquer
   * falha desfaz tudo, inclusive o texto. A galeria fica na ordem dada.
   */
  saveWithRelations(
    relations: ItemRelations,
    values: Row,
    version?: { id: string; expectedUpdatedAt: string },
  ): Promise<SavedRow>;
  remove(table: EntityTable, id: string): Promise<void>;
  /** Registra um arquivo já enviado ao Storage na biblioteca de mídia. */
  insertMedia(values: MediaRow): Promise<MediaAsset>;
  /** Blocos não têm estado nem versão próprios: a versão que vale é a da página (page-blocks.ts). */
  insertBlock(values: BlockValues): Promise<void>;
  updateBlock(id: string, values: Partial<BlockValues>): Promise<void>;
  removeBlock(id: string): Promise<void>;
}
