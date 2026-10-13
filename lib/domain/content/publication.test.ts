/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : publication.test.ts
 Descrição    : Testes de transições, permissões, validação e invariantes de publicação.

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

import { describe, expect, it } from "vitest";
import {
  PUBLICATION_COMMANDS,
  TRANSITIONS,
  allowedCommands,
  checkInvariants,
  transition,
  type PublicationState,
  type TransitionContext,
} from "./publication";
import { PUBLICATION_STATUSES } from "./publication-status";

const NOW = new Date("2026-10-13T15:00:00.000Z");
const context = (overrides: Partial<TransitionContext> = {}): TransitionContext => ({
  role: "editor",
  resource: "case",
  now: NOW,
  validateForPublish: () => [],
  ...overrides,
});

const draft: PublicationState = { status: "draft", publishedAt: null, archivedAt: null };
const published: PublicationState = { status: "published", publishedAt: "2026-10-01T10:00:00.000Z", archivedAt: null };
const archived: PublicationState = { status: "archived", publishedAt: null, archivedAt: "2026-10-05T10:00:00.000Z" };

describe("transições", () => {
  it("rejeita toda transição fora da tabela", () => {
    const states = { draft, published, archived };
    for (const status of PUBLICATION_STATUSES) {
      for (const command of PUBLICATION_COMMANDS) {
        const result = transition(states[status], command, context({ role: "super_admin" }));
        if (TRANSITIONS[status][command]) expect(result.ok).toBe(true);
        else expect(result).toMatchObject({ ok: false, error: { code: "INVALID_TRANSITION" } });
      }
    }
  });

  it("publicar rascunho define a data da primeira publicação", () => {
    const result = transition(draft, "publish", context());
    expect(result).toEqual({
      ok: true,
      command: "publish",
      next: { status: "published", publishedAt: NOW.toISOString(), archivedAt: null },
    });
  });

  it("republicar mantém a data original", () => {
    const unpublished = { ...published, status: "draft" as const };
    const result = transition(unpublished, "publish", context());
    expect(result.ok && "publishedAt" in result.next && result.next.publishedAt).toBe(published.publishedAt);
  });

  it("arquivar registra a data e restaurar volta para rascunho limpando-a", () => {
    const archivedResult = transition(published, "archive", context());
    expect(archivedResult.ok && archivedResult.next).toMatchObject({ status: "archived", archivedAt: NOW.toISOString() });
    const restored = transition(archived, "restore", context());
    expect(restored.ok && restored.next).toMatchObject({ status: "draft", archivedAt: null });
  });

  it("excluir só é possível a partir de arquivado", () => {
    expect(transition(published, "delete", context({ role: "admin" }))).toMatchObject({ ok: false });
    expect(transition(archived, "delete", context({ role: "admin" }))).toMatchObject({ ok: true, next: { status: "deleted" } });
  });
});

describe("permissões", () => {
  it("viewer não salva nem publica", () => {
    expect(transition(draft, "save", context({ role: "viewer" }))).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(transition(draft, "publish", context({ role: "viewer" }))).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  });

  it("editor não exclui definitivamente", () => {
    expect(transition(archived, "delete", context())).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  });

  it("sessão sem papel é negada", () => {
    expect(transition(draft, "save", context({ role: null }))).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  });

  it("lista apenas os comandos permitidos ao papel", () => {
    expect(allowedCommands("archived", "editor", "case")).toEqual(["restore"]);
    expect(allowedCommands("archived", "admin", "case")).toEqual(["restore", "delete"]);
    expect(allowedCommands("published", "viewer", "case")).toEqual([]);
  });
});

describe("validação de conteúdo", () => {
  const invalid = () => ["Título é obrigatório."];

  it("impede publicar conteúdo incompleto", () => {
    expect(transition(draft, "publish", context({ validateForPublish: invalid }))).toMatchObject({
      ok: false,
      error: { code: "VALIDATION_FAILED", details: ["Título é obrigatório."] },
    });
  });

  it("impede salvar item publicado que ficaria incompleto", () => {
    expect(transition(published, "save", context({ validateForPublish: invalid }))).toMatchObject({
      ok: false,
      error: { code: "VALIDATION_FAILED" },
    });
  });

  it("rascunho pode ser salvo incompleto", () => {
    expect(transition(draft, "save", context({ validateForPublish: invalid })).ok).toBe(true);
  });
});

describe("invariantes", () => {
  it("detecta estados inconsistentes", () => {
    expect(checkInvariants({ status: "published", publishedAt: null, archivedAt: null })).toHaveLength(1);
    expect(checkInvariants({ status: "archived", publishedAt: null, archivedAt: null })).toHaveLength(1);
    expect(checkInvariants({ status: "draft", publishedAt: null, archivedAt: "2026-10-01T00:00:00Z" })).toHaveLength(1);
    expect(checkInvariants(published)).toEqual([]);
  });
});
