/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : publication-status.ts
 Descrição    : Estados de publicação do conteúdo (rascunho, publicado, arquivado) e rótulos.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-12).
──────────────────────────────────────────────────────────────────────────────
*/

/** Estados de publicação do conteúdo (ADM-12). Fonte única para CMS, site e API. */
export const PUBLICATION_STATUSES = ["draft", "published", "archived"] as const;

export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export const PUBLICATION_STATUS_LABELS: Record<PublicationStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

/** Tom visual do selo de estado no painel (mapeado para tokens do design system). */
export const PUBLICATION_STATUS_TONES: Record<PublicationStatus, "neutral" | "success" | "muted"> = {
  draft: "neutral",
  published: "success",
  archived: "muted",
};

export function isPublicationStatus(value: unknown): value is PublicationStatus {
  return typeof value === "string" && (PUBLICATION_STATUSES as readonly string[]).includes(value);
}
