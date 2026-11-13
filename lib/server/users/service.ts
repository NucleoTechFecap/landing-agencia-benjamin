/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : service.ts
 Descrição    : Convites e gestão de acesso da equipe.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Gestão de usuários no painel (ADM-01).
════════════════════════════════════════════════════════════════════════════════
*/
import "server-only";
import { can, canAssignRole, isRole, type Role } from "@/lib/domain/auth/rbac";
import { fieldErrorsOf, uuidField } from "@/lib/domain/content/cms-schema";
import { inviteSchema, type InviteInput } from "@/lib/domain/users/invite";
import type { ManagedProfile } from "@/lib/domain/users/profile";
import type { AuditInput } from "@/lib/server/audit";
import { AppError } from "@/lib/server/errors";

export type UserActor = { id: string; role: Role };
export interface UserManagementDeps {
  audit: (input: AuditInput) => Promise<void>;
  invite: (input: InviteInput) => Promise<string>;
  findProfile: (id: string) => Promise<ManagedProfile | null>;
  assignRole: (id: string, role: Role) => Promise<void>;
  setActive: (id: string, active: boolean) => Promise<void>;
}

/** Convites sempre criam perfis pendentes: a liberação é uma ação separada e auditada. */
export async function invitePanelUser(deps: UserManagementDeps, actor: UserActor, raw: unknown): Promise<string> {
  if (!can(actor.role, "user", "create")) throw new AppError("FORBIDDEN");
  const parsed = inviteSchema.safeParse(raw);
  if (!parsed.success) throw new AppError("VALIDATION_FAILED", { fieldErrors: fieldErrorsOf(parsed.error) });
  // Registrar a intenção antes do efeito externo; falha na auditoria bloqueia o envio.
  await deps.audit({ event: "user.invited", metadata: { reason: "convite-iniciado", toRole: "pending" } });
  let id: string;
  try {
    id = await deps.invite(parsed.data);
  } catch {
    await deps
      .audit({ event: "user.invited", outcome: "failure", metadata: { reason: "convite-falhou" } })
      .catch(() => undefined);
    throw new AppError("SERVICE_UNAVAILABLE", {
      message: "Não foi possível enviar o convite. Confira a configuração de e-mail e tente novamente.",
    });
  }
  // O envio já ocorreu: uma falha aqui não pode levar a interface a oferecer reenvio indevido.
  await deps
    .audit({ event: "user.invited", resourceId: id, metadata: { reason: "convite-enviado", toRole: "pending" } })
    .catch(() => undefined);
  return id;
}

export async function updateUserRole(
  deps: UserManagementDeps,
  actor: UserActor,
  id: string,
  role: unknown,
): Promise<void> {
  if (!can(actor.role, "user", "edit")) throw new AppError("FORBIDDEN");
  if (!uuidField.safeParse(id).success || !isRole(role)) throw new AppError("BAD_REQUEST");
  const target = await deps.findProfile(id);
  if (!target) throw new AppError("NOT_FOUND");
  if (!canAssignRole(actor, { id: target.id, currentRole: target.role }, role)) throw new AppError("FORBIDDEN");
  if (target.role !== role) await deps.assignRole(id, role);
}

export async function updateUserActive(
  deps: UserManagementDeps,
  actor: UserActor,
  id: string,
  active: boolean,
): Promise<void> {
  if (!can(actor.role, "user", "edit")) throw new AppError("FORBIDDEN");
  if (!uuidField.safeParse(id).success || typeof active !== "boolean") throw new AppError("BAD_REQUEST");
  const target = await deps.findProfile(id);
  if (!target) throw new AppError("NOT_FOUND");
  if (!canAssignRole(actor, { id: target.id, currentRole: target.role }, target.role)) throw new AppError("FORBIDDEN");
  if (target.active !== active) await deps.setActive(id, active);
}
