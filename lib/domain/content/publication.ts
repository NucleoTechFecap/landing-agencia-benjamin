/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : publication.ts
 Descrição    : Máquina de estados de publicação com permissões, validação e invariantes.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { can, type Action, type Resource, type Role } from "../auth/rbac";
import type { PublicationStatus } from "./publication-status";

/** Comandos que o CMS pode aplicar a um item de conteúdo (TECH-04). */
export const PUBLICATION_COMMANDS = ["save", "publish", "unpublish", "archive", "restore", "delete"] as const;
export type PublicationCommand = (typeof PUBLICATION_COMMANDS)[number];

export type TransitionTarget = PublicationStatus | "deleted";

/** Tabela de transições permitidas. Qualquer par ausente é transição inválida. */
export const TRANSITIONS: Readonly<Record<PublicationStatus, Partial<Record<PublicationCommand, TransitionTarget>>>> = {
  draft: { save: "draft", publish: "published", archive: "archived" },
  published: { save: "published", unpublish: "draft", archive: "archived" },
  archived: { restore: "draft", delete: "deleted" },
};

/** Permissão RBAC exigida por comando. */
export const COMMAND_PERMISSION: Readonly<Record<PublicationCommand, Action>> = {
  save: "edit",
  publish: "publish",
  unpublish: "publish",
  archive: "archive",
  restore: "archive",
  delete: "delete",
};

export type PublicationErrorCode = "INVALID_TRANSITION" | "FORBIDDEN" | "VALIDATION_FAILED";

export interface PublicationError {
  code: PublicationErrorCode;
  message: string;
  details?: string[];
}

export interface PublicationState {
  status: PublicationStatus;
  publishedAt: string | null;
  archivedAt: string | null;
}

export type TransitionResult =
  | { ok: true; next: PublicationState | { status: "deleted" }; command: PublicationCommand }
  | { ok: false; error: PublicationError };

export interface TransitionContext {
  role: Role | null | undefined;
  resource: Resource;
  now: Date;
  /**
   * Validação de campos obrigatórios para publicação. Retorna a lista de problemas
   * (vazia = válido). Executada ao publicar e ao salvar item já publicado.
   */
  validateForPublish: () => string[];
}

export function allowedCommands(
  status: PublicationStatus,
  role: Role | null | undefined,
  resource: Resource,
): PublicationCommand[] {
  return PUBLICATION_COMMANDS.filter(
    (command) => TRANSITIONS[status][command] !== undefined && can(role, resource, COMMAND_PERMISSION[command]),
  );
}

/**
 * Aplica um comando ao estado atual respeitando as invariantes de publicação:
 * transição permitida → permissão do papel → validação de conteúdo → novos campos de controle.
 */
export function transition(
  current: PublicationState,
  command: PublicationCommand,
  context: TransitionContext,
): TransitionResult {
  const target = TRANSITIONS[current.status][command];
  if (!target) {
    return {
      ok: false,
      error: {
        code: "INVALID_TRANSITION",
        message: `Não é possível executar "${command}" em item com estado "${current.status}".`,
      },
    };
  }

  if (!can(context.role, context.resource, COMMAND_PERMISSION[command])) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Seu papel não permite esta operação." } };
  }

  if (target === "published") {
    const problems = context.validateForPublish();
    if (problems.length > 0) {
      return {
        ok: false,
        error: { code: "VALIDATION_FAILED", message: "Conteúdo incompleto para publicação.", details: problems },
      };
    }
  }

  if (target === "deleted") return { ok: true, next: { status: "deleted" }, command };

  const nowIso = context.now.toISOString();
  const next: PublicationState = {
    status: target,
    // Mantém a data da primeira publicação ao republicar/despublicar (estabilidade para SEO).
    publishedAt: target === "published" ? (current.publishedAt ?? nowIso) : current.publishedAt,
    archivedAt: target === "archived" ? nowIso : null,
  };
  return { ok: true, next, command };
}

/** Invariantes verificáveis de um estado persistido (usadas em testes e no CMS). */
export function checkInvariants(state: PublicationState): string[] {
  const problems: string[] = [];
  if (state.status === "published" && !state.publishedAt) problems.push("Publicado sem data de publicação.");
  if (state.status === "archived" && !state.archivedAt) problems.push("Arquivado sem data de arquivamento.");
  if (state.status !== "archived" && state.archivedAt) problems.push("Data de arquivamento em item não arquivado.");
  return problems;
}
