/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : service.test.ts
 Descrição    : Testes da autorização e auditoria de usuários.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Testa gestão de usuários (ADM-01).
════════════════════════════════════════════════════════════════════════════════
*/
import { describe, expect, it, vi } from "vitest";
import { invitePanelUser, updateUserActive, updateUserRole, type UserManagementDeps } from "./service";

const id = "00000000-0000-4000-8000-000000000001";
const target = {
  id,
  full_name: "Pessoa Exemplo",
  role: "pending" as const,
  active: true,
  created_at: "",
  updated_at: "",
};
const actor = { id: "00000000-0000-4000-8000-000000000002", role: "admin" as const };
const setup = (): UserManagementDeps => ({
  audit: vi.fn(async () => {}),
  invite: vi.fn(async () => id),
  findProfile: vi.fn(async () => target),
  assignRole: vi.fn(async () => {}),
  setActive: vi.fn(async () => {}),
});

describe("gestão de usuários", () => {
  it("nega convite a quem não administra usuários e nunca chama o serviço externo", async () => {
    const deps = setup();
    await expect(
      invitePanelUser(deps, { ...actor, role: "editor" }, { name: "Ana", email: "ana@exemplo.com" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(deps.invite).not.toHaveBeenCalled();
  });
  it("valida e registra antes de convidar; sempre inicia como pendente", async () => {
    const deps = setup();
    await invitePanelUser(deps, actor, { name: " Ana ", email: "ANA@EXEMPLO.COM" });
    expect(deps.invite).toHaveBeenCalledWith({ name: "Ana", email: "ana@exemplo.com" });
    expect(deps.audit).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ event: "user.invited", metadata: expect.objectContaining({ toRole: "pending" }) }),
    );
    expect(deps.audit).toHaveBeenNthCalledWith(2, expect.objectContaining({ event: "user.invited", resourceId: id }));
  });
  it("não envia quando a auditoria falha ou o e-mail é inválido", async () => {
    const deps = setup();
    await expect(invitePanelUser(deps, actor, { name: "Ana", email: "invalido" })).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
    vi.mocked(deps.audit).mockRejectedValueOnce(new Error("indisponível"));
    await expect(invitePanelUser(deps, actor, { name: "Ana", email: "ana@exemplo.com" })).rejects.toThrow();
    expect(deps.invite).not.toHaveBeenCalled();
  });
  it("registra falha do provedor sem expor mensagem privada", async () => {
    const deps = setup();
    vi.mocked(deps.invite).mockRejectedValueOnce(new Error("segredo do provedor"));
    await expect(invitePanelUser(deps, actor, { name: "Ana", email: "ana@exemplo.com" })).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
    expect(deps.audit).toHaveBeenLastCalledWith(expect.objectContaining({ outcome: "failure" }));
  });
  it("permite admin liberar editor, mas não promover admin ou alterar a própria conta", async () => {
    const deps = setup();
    await updateUserRole(deps, actor, id, "editor");
    expect(deps.assignRole).toHaveBeenCalledWith(id, "editor");
    await expect(updateUserRole(deps, actor, id, "admin")).rejects.toMatchObject({ code: "FORBIDDEN" });
    vi.mocked(deps.findProfile).mockResolvedValueOnce({ ...target, id: actor.id, role: "admin" });
    await expect(updateUserActive(deps, actor, actor.id, false)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(deps.setActive).not.toHaveBeenCalled();
  });
});
