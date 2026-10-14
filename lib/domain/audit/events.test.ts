/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : events.test.ts
 Descrição    : Testes do catálogo de auditoria e da consistência com o banco.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AUDIT_EVENTS, isAuditEvent, sanitizeAuditMetadata } from "./events";

describe("sanitizeAuditMetadata", () => {
  it("mantém só chaves permitidas com valores primitivos curtos", () => {
    expect(
      sanitizeAuditMetadata({
        slug: "meridiano",
        toStatus: "published",
        count: 3,
        email: "pessoa@x.com",
        name: "Maria",
        message: "conteúdo do formulário",
        filters: { nested: true },
      }),
    ).toEqual({ slug: "meridiano", toStatus: "published", count: 3 });
  });

  it("trunca textos longos", () => {
    expect((sanitizeAuditMetadata({ reason: "x".repeat(500) }).reason as string).length).toBe(120);
  });
});

describe("catálogo de eventos", () => {
  it("reconhece apenas eventos do catálogo", () => {
    expect(isAuditEvent("content.published")).toBe(true);
    expect(isAuditEvent("content.hacked")).toBe(false);
  });

  it("operações destrutivas e de permissão são críticas", () => {
    for (const event of ["user.role_changed", "content.deleted", "lead.exported", "media.deleted"] as const) {
      expect(AUDIT_EVENTS[event].critical).toBe(true);
    }
  });

  it("o check do banco aceita exatamente os eventos do catálogo", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/20261013000300_audit_log.sql"), "utf8");
    const checkBlock = sql.slice(sql.indexOf("event text not null check"), sql.indexOf("resource_type text not null"));
    const fromSql = [...checkBlock.matchAll(/'([a-z_.]+)'/g)].map((match) => match[1]).sort();
    expect(fromSql).toEqual(Object.keys(AUDIT_EVENTS).sort());
  });
});
