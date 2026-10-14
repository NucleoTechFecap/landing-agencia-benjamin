/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : guards.test.ts
 Descrição    : Testes dos guardas: casos negativos N01–N05, N08 e ações protegidas.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-03).
 13/10/2026 Vinícius Nishimura Reis  Teste do registro de acesso negado (TECH-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterEach, describe, expect, it, vi } from "vitest";
import type { SessionUser } from "./session";

let currentUser: SessionUser | null = null;
vi.mock("./session", () => ({ getSessionUser: async () => currentUser }));
const { recordAuditEvent } = vi.hoisted(() => ({ recordAuditEvent: vi.fn(async () => {}) }));
vi.mock("../audit", () => ({ recordAuditEvent }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && error.message.startsWith("REDIRECT:")) throw error;
  },
}));

const { guardedAction, requirePageAccess, requirePermission } = await import("./guards");

const user = (role: SessionUser["role"]): SessionUser => ({ id: "u1", email: "x@y.com", name: "X", role });

describe("requirePermission (Server Actions / Route Handlers)", () => {
  afterEach(() => {
    currentUser = null;
    vi.restoreAllMocks();
  });

  it("N02 — sem sessão lança UNAUTHENTICATED (401)", async () => {
    await expect(requirePermission("case", "edit")).rejects.toMatchObject({ code: "UNAUTHENTICATED", status: 401 });
  });

  it("N04 — editor excluindo case lança FORBIDDEN (403)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    currentUser = user("editor");
    await expect(requirePermission("case", "delete")).rejects.toMatchObject({ code: "FORBIDDEN", status: 403 });
  });

  it("registra a negação na trilha de auditoria (TECH-10)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    currentUser = user("viewer");
    await expect(requirePermission("case", "publish")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: "access.denied", outcome: "denied", metadata: { resource: "case", action: "publish" } }),
    );
  });

  it("N08 — super_admin não lê leads", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    currentUser = user("super_admin");
    await expect(requirePermission("lead", "view")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("libera quando o papel tem a permissão", async () => {
    currentUser = user("admin");
    await expect(requirePermission("lead", "export")).resolves.toMatchObject({ role: "admin" });
  });
});

describe("requirePageAccess (páginas do painel)", () => {
  afterEach(() => {
    currentUser = null;
    vi.restoreAllMocks();
  });

  it("N01 — sem sessão redireciona ao login com retorno", async () => {
    await expect(requirePageAccess("case", "view", "/admin/cases")).rejects.toThrow(
      "REDIRECT:/admin/login?next=%2Fadmin%2Fcases",
    );
  });

  it("N03 — conta pendente vai para o aviso de acesso pendente", async () => {
    currentUser = user("pending");
    await expect(requirePageAccess("dashboard", "view", "/admin")).rejects.toThrow("REDIRECT:/admin/acesso-pendente");
  });

  it("N05 — editor abrindo leads vai para 'sem permissão'", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    currentUser = user("editor");
    await expect(requirePageAccess("lead", "view", "/admin/leads")).rejects.toThrow("REDIRECT:/admin/sem-permissao");
  });
});

describe("guardedAction", () => {
  afterEach(() => {
    currentUser = null;
    vi.restoreAllMocks();
  });

  it("não executa a ação sem permissão e devolve envelope de erro", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    currentUser = user("viewer");
    const run = vi.fn();
    const result = await guardedAction("case", "publish", run);
    expect(run).not.toHaveBeenCalled();
    expect(result).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
  });

  it("executa e devolve dados com permissão", async () => {
    currentUser = user("editor");
    await expect(guardedAction("case", "publish", async (u) => u.role)).resolves.toEqual({ ok: true, data: "editor" });
  });

  it("relança redirecionamentos do Next", async () => {
    currentUser = user("editor");
    await expect(
      guardedAction("case", "edit", async () => {
        throw new Error("REDIRECT:/admin");
      }),
    ).rejects.toThrow("REDIRECT:/admin");
  });
});
