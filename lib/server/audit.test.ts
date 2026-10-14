/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : audit.test.ts
 Descrição    : Testes da gravação de auditoria e do tratamento de falhas.

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

import { afterEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("./supabase/server", () => ({ createSessionClient: async () => ({ rpc }) }));

const { recordAuditEvent } = await import("./audit");

describe("recordAuditEvent", () => {
  afterEach(() => {
    rpc.mockReset();
    vi.restoreAllMocks();
  });

  it("envia evento com metadados filtrados (sem PII)", async () => {
    rpc.mockResolvedValue({ error: null });
    await recordAuditEvent({ event: "content.published", resourceId: "case-1", metadata: { slug: "fecap", email: "x@y.com" } });
    expect(rpc).toHaveBeenCalledWith("record_audit_event", {
      p_event: "content.published",
      p_resource_type: "content",
      p_resource_id: "case-1",
      p_outcome: "success",
      p_metadata: { slug: "fecap" },
      p_request_id: null,
    });
  });

  it("falha em evento crítico aborta a operação", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    rpc.mockResolvedValue({ error: new Error("db down") });
    await expect(recordAuditEvent({ event: "content.deleted", resourceId: "x" })).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });

  it("falha em evento não crítico só registra no log", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    rpc.mockResolvedValue({ error: new Error("db down") });
    await expect(recordAuditEvent({ event: "lead.viewed", resourceId: "x" })).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
  });
});
