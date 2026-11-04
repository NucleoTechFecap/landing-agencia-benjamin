/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : inbox-context.test.ts
 Descrição    : Guardas das telas de envios: o que cada papel recebe antes de qualquer leitura.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (SEG-04).
 04/11/2026 Vinícius Nishimura Reis  Exclusão de envio arquivado (FORM-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Role } from "@/lib/domain/auth/rbac";
import type { SessionUser } from "../auth/session";

const SUBMISSION_ID = "00000000-0000-4000-8000-000000000601";

let currentUser: SessionUser | null = null;
vi.mock("../auth/session", () => ({ getSessionUser: async () => currentUser }));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && error.message.startsWith("REDIRECT:")) throw error;
  },
}));
const { recordAuditEvent, revalidatePath, createSessionClient } = vi.hoisted(() => ({
  recordAuditEvent: vi.fn(async () => {}),
  revalidatePath: vi.fn(),
  createSessionClient: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("../audit", () => ({ recordAuditEvent }));
vi.mock("../supabase/server", () => ({ createSessionClient }));
vi.mock("../cms/context", () => ({ withFlash: (path: string, flash: string) => `${path}?ok=${flash}` }));

const { changeStatusFromForm, deleteFromForm, openSubmission, requireInboxPage } = await import("./inbox-context");

const user = (role: Role): SessionUser => ({ id: "u1", email: "x@y.test", name: "X", role });

/** Banco de mentira que só responde à leitura de um registro. */
function clientWith(row: Record<string, unknown> | null) {
  const update = vi.fn(() => ({
    eq: () => ({ eq: () => ({ select: async () => ({ data: [{ id: SUBMISSION_ID }], error: null }) }) }),
  }));
  const select = vi.fn(() => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: null }) }) }));
  const remove = vi.fn(() => ({
    eq: () => ({ eq: () => ({ select: async () => ({ data: [{ id: SUBMISSION_ID }], error: null }) }) }),
  }));
  return { from: vi.fn(() => ({ select, update, delete: remove })), update, remove };
}

const statusForm = (status = "em_atendimento") => {
  const form = new FormData();
  form.set("id", SUBMISSION_ID);
  form.set("status", status);
  form.set("currentStatus", "novo");
  return form;
};

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  currentUser = null;
  vi.restoreAllMocks();
  recordAuditEvent.mockClear();
  revalidatePath.mockClear();
  createSessionClient.mockReset();
});

describe("requireInboxPage", () => {
  it("N01: sem sessão vai ao login, sem nome nem e-mail na URL", async () => {
    await expect(requireInboxPage(`/admin/leads/${SUBMISSION_ID}`)).rejects.toThrow(
      `REDIRECT:/admin/login?next=%2Fadmin%2Fleads%2F${SUBMISSION_ID}`,
    );
  });

  it("N03: conta pendente vê o aviso de acesso pendente", async () => {
    currentUser = user("pending");
    await expect(requireInboxPage("/admin/leads")).rejects.toThrow("REDIRECT:/admin/acesso-pendente");
  });

  it.each(["editor", "viewer", "super_admin"] as const)("N05/N08: %s recebe 'sem permissão'", async (role) => {
    currentUser = user(role);
    await expect(requireInboxPage("/admin/leads")).rejects.toThrow("REDIRECT:/admin/sem-permissao");
    expect(createSessionClient).not.toHaveBeenCalled();
  });

  it("admin entra e vê os três tipos", async () => {
    currentUser = user("admin");
    await expect(requireInboxPage("/admin/leads")).resolves.toMatchObject({
      kinds: ["lead", "contact", "feedback"],
    });
  });
});

describe("changeStatusFromForm", () => {
  it("N02: sem sessão responde 401 e não toca no banco", async () => {
    const result = await changeStatusFromForm(statusForm());
    expect(result).toMatchObject({ status: "error", code: "UNAUTHENTICATED" });
    expect(createSessionClient).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it.each(["editor", "viewer", "super_admin", "pending"] as const)(
    "N05/N08: %s recebe 403, com a negação na trilha e sem tocar no banco",
    async (role) => {
      currentUser = user(role);
      const result = await changeStatusFromForm(statusForm());
      expect(result).toMatchObject({ status: "error", code: "FORBIDDEN" });
      expect(recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: "access.denied", metadata: { resource: "lead", action: "edit" } }),
      );
      expect(createSessionClient).not.toHaveBeenCalled();
    },
  );

  it("admin altera o status, audita e volta ao detalhe", async () => {
    currentUser = user("admin");
    const client = clientWith({ kind: "feedback", status: "novo" });
    createSessionClient.mockResolvedValue(client);
    await expect(changeStatusFromForm(statusForm("lido"))).rejects.toThrow(
      `REDIRECT:/admin/leads/${SUBMISSION_ID}?ok=salvo`,
    );
    expect(client.update).toHaveBeenCalledWith({ status: "lido" });
    expect(recordAuditEvent).toHaveBeenCalledWith({
      event: "lead.status_changed",
      resourceId: SUBMISSION_ID,
      metadata: { kind: "feedback", fromStatus: "novo", toStatus: "lido" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/leads");
  });

  it("erro do serviço volta como estado do formulário, sem redirecionar", async () => {
    currentUser = user("admin");
    createSessionClient.mockResolvedValue(clientWith(null));
    await expect(changeStatusFromForm(statusForm())).resolves.toMatchObject({ status: "error", code: "NOT_FOUND" });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteFromForm", () => {
  const deleteForm = () => {
    const form = new FormData();
    form.set("id", SUBMISSION_ID);
    return form;
  };

  it.each(["editor", "viewer", "super_admin", "pending"] as const)(
    "N04/N08: %s recebe 403, com a negação na trilha e sem tocar no banco",
    async (role) => {
      currentUser = user(role);
      await expect(deleteFromForm(deleteForm())).resolves.toMatchObject({ status: "error", code: "FORBIDDEN" });
      expect(recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({ event: "access.denied", metadata: { resource: "lead", action: "delete" } }),
      );
      expect(createSessionClient).not.toHaveBeenCalled();
    },
  );

  it("admin exclui envio arquivado e volta à lista", async () => {
    currentUser = user("admin");
    const client = clientWith({ kind: "contact", status: "arquivado" });
    createSessionClient.mockResolvedValue(client);
    await expect(deleteFromForm(deleteForm())).rejects.toThrow("REDIRECT:/admin/leads?ok=excluido");
    expect(client.remove).toHaveBeenCalled();
    expect(recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ event: "lead.deleted", resourceId: SUBMISSION_ID, metadata: { kind: "contact" } }),
    );
  });

  it("envio que não está arquivado volta como erro do formulário", async () => {
    currentUser = user("admin");
    const client = clientWith({ kind: "contact", status: "novo" });
    createSessionClient.mockResolvedValue(client);
    await expect(deleteFromForm(deleteForm())).resolves.toMatchObject({ status: "error", code: "CONFLICT" });
    expect(client.remove).not.toHaveBeenCalled();
  });
});

describe("openSubmission", () => {
  const record = {
    id: SUBMISSION_ID,
    protocol: "AB-000000",
    kind: "contact",
    category: "contact:imprensa",
    payload: { name: "Pessoa Fictícia", email: "pessoa@exemplo.test" },
    source_path: "/contato",
    status: "novo",
    notification_status: "skipped",
    notification_attempts: 0,
    created_at: "2026-11-04T10:00:00Z",
    updated_at: "2026-11-04T10:00:00Z",
  };

  it("id malformado nem chega ao banco", async () => {
    await expect(openSubmission(user("admin"), "not-a-uuid")).resolves.toBeNull();
    expect(createSessionClient).not.toHaveBeenCalled();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it("registra a abertura só com referências, sem conteúdo", async () => {
    createSessionClient.mockResolvedValue(clientWith(record));
    await expect(openSubmission(user("admin"), SUBMISSION_ID)).resolves.toMatchObject({ protocol: "AB-000000" });
    expect(recordAuditEvent).toHaveBeenCalledWith({
      event: "lead.viewed",
      resourceId: SUBMISSION_ID,
      metadata: { kind: "contact", category: "contact:imprensa" },
    });
    expect(JSON.stringify(recordAuditEvent.mock.calls)).not.toContain("Pessoa Fictícia");
  });

  it("feedback gera feedback.viewed", async () => {
    createSessionClient.mockResolvedValue(clientWith({ ...record, kind: "feedback", category: "feedback:aluno" }));
    await openSubmission(user("admin"), SUBMISSION_ID);
    expect(recordAuditEvent).toHaveBeenCalledWith(expect.objectContaining({ event: "feedback.viewed" }));
  });

  it("registro que a RLS esconde responde igual a inexistente e não gera evento", async () => {
    createSessionClient.mockResolvedValue(clientWith(null));
    await expect(openSubmission(user("admin"), SUBMISSION_ID)).resolves.toBeNull();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });

  it("linha de um tipo que o papel não vê é tratada como inexistente", async () => {
    createSessionClient.mockResolvedValue(clientWith(record));
    await expect(openSubmission(user("editor"), SUBMISSION_ID)).resolves.toBeNull();
    expect(recordAuditEvent).not.toHaveBeenCalled();
  });
});
