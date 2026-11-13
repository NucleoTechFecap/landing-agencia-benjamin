/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : repository.ts
 Descrição    : Acesso protegido aos perfis e ao serviço de convites.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Persistência dos usuários (ADM-01).
════════════════════════════════════════════════════════════════════════════════
*/
import "server-only";
import { siteUrl } from "@/lib/config/public-env";
import { isRole } from "@/lib/domain/auth/rbac";
import type { ManagedProfile } from "@/lib/domain/users/profile";
import { recordAuditEvent } from "@/lib/server/audit";
import { toCmsError } from "@/lib/server/cms/supabase-store";
import { AppError } from "@/lib/server/errors";
import { getServiceClient } from "@/lib/server/supabase/admin";
import { createSessionClient } from "@/lib/server/supabase/server";
import type { UserManagementDeps } from "./service";

const COLUMNS = "id,full_name,role,active,created_at,updated_at";
function profile(value: unknown): ManagedProfile | null {
  const row = value as ManagedProfile | null;
  return row && isRole(row.role) ? row : null;
}

/** Chamar apenas depois de exigir `user:view`; a consulta também passa pela RLS. */
export async function listPanelProfiles(): Promise<ManagedProfile[]> {
  const client = await createSessionClient();
  const { data, error } = await client.from("profiles").select(COLUMNS).order("created_at", { ascending: false });
  if (error) throw new AppError("SERVICE_UNAVAILABLE");
  return (data ?? []).map(profile).filter((item): item is ManagedProfile => item !== null);
}

/** O cliente privilegiado só é usado para enviar o convite após a guarda e validação. */
export async function userManagementDeps(): Promise<UserManagementDeps> {
  const client = await createSessionClient();
  const run = async (name: "assign_role" | "set_profile_active", args: Record<string, unknown>) => {
    const { error } = await client.rpc(name, args);
    if (error) throw toCmsError(error, { table: "profiles", operation: name });
  };
  return {
    audit: recordAuditEvent,
    async invite(input) {
      const admin = getServiceClient();
      if (!admin) throw new AppError("SERVICE_UNAVAILABLE");
      const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
        data: { full_name: input.name },
        redirectTo: `${siteUrl}/admin/auth/callback?next=/admin/nova-senha`,
      });
      if (error || !data.user?.id) throw new AppError("SERVICE_UNAVAILABLE");
      return data.user.id;
    },
    async findProfile(id) {
      const { data, error } = await client.from("profiles").select(COLUMNS).eq("id", id).maybeSingle();
      if (error) throw new AppError("SERVICE_UNAVAILABLE");
      return profile(data);
    },
    assignRole: (id, role) => run("assign_role", { p_target: id, p_role: role }),
    setActive: (id, active) => run("set_profile_active", { p_target: id, p_active: active }),
  };
}
