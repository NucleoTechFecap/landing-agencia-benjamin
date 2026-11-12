/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : list.ts
 Descrição    : Consulta protegida da trilha de operações do painel.
 Desenvolvedor: Vinícius Nishimura Reis
 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 12/11/2026
 Modificado em: 12/11/2026
 Histórico    : 12/11/2026 Codex — Consulta da auditoria (TECH-10).
════════════════════════════════════════════════════════════════════════════════
*/
import "server-only";
import { createSessionClient } from "@/lib/server/supabase/server";
import { AppError } from "@/lib/server/errors";

export interface AuditRow {
  id: number;
  occurred_at: string;
  actor_id: string | null;
  actor_role: string | null;
  event: string;
  resource_type: string;
  outcome: "success" | "failure" | "denied";
}

/** Chamar após exigir audit:view; o banco também aplica RLS. Sem payloads nem dados dos formulários. */
export async function listRecentAudit(
  page = 1,
): Promise<{ events: AuditRow[]; actors: Record<string, string>; hasNext: boolean }> {
  const client = await createSessionClient();
  const offset = (page - 1) * 100;
  const { data, error } = await client
    .from("audit_log")
    .select("id,occurred_at,actor_id,actor_role,event,resource_type,outcome")
    .order("occurred_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + 100);
  if (error) throw new AppError("SERVICE_UNAVAILABLE");
  const fetched = (data ?? []) as AuditRow[];
  const hasNext = fetched.length > 100;
  const events = fetched.slice(0, 100);
  const ids = [...new Set(events.flatMap((event) => (event.actor_id ? [event.actor_id] : [])))];
  if (!ids.length) return { events, actors: {}, hasNext };
  const profiles = await client.from("profiles").select("id,full_name").in("id", ids);
  if (profiles.error) throw new AppError("SERVICE_UNAVAILABLE");
  return {
    events,
    actors: Object.fromEntries((profiles.data ?? []).map((item) => [item.id, item.full_name || "Usuário sem nome"])),
    hasNext,
  };
}
