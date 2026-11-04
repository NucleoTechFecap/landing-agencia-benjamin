/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : inbox.ts
 Descrição    : Consulta e status de atendimento dos envios no painel, sempre com o cliente da sessão (RLS).

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-09).
 04/11/2026 Vinícius Nishimura Reis  Situação da notificação e filtro (INT-07).
 04/11/2026 Vinícius Nishimura Reis  Exclusão de envio arquivado, a pedido do titular (FORM-09).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "@/lib/domain/auth/rbac";
import {
  canOnKind,
  isSubmissionId,
  isSubmissionStatus,
  pageRange,
  statusOptions,
  totalPages,
  type InboxItem,
  type InboxPage,
  type InboxQuery,
  type NotificationStatus,
  type SubmissionDetail,
  type SubmissionStatus,
} from "@/lib/domain/forms/inbox";
import type { SubmissionKind } from "@/lib/domain/forms/schemas";
import type { AuditInput } from "../audit";
import { AppError } from "../errors";

/*
 * Este módulo recebe o cliente de quem chama e nunca importa `supabase/admin`: nas telas do painel a
 * RLS é quem protege de verdade, e service role aqui anularia a barreira. Nada de `use cache`: o
 * resultado tem dados pessoais e depende do papel de quem lê (TECH-08).
 */
const TABLE = "form_submissions";

/** Lista: nome e dados de controle, sem o restante do conteúdo enviado (TECH-08 §4). */
const LIST_COLUMNS =
  "id, protocol, kind, category, status, notification_status, notification_attempts, created_at, name:payload->>name";

/** Detalhe: sem `ip_hash`, `fingerprint` e `last_notification_error`, que o atendimento não precisa ver. */
const DETAIL_COLUMNS =
  "id, protocol, kind, category, payload, source_path, status, notification_status, notification_attempts, created_at, updated_at";

interface ListRow {
  id: string;
  protocol: string;
  kind: SubmissionKind;
  category: string;
  status: SubmissionStatus;
  notification_status: NotificationStatus;
  notification_attempts: number;
  created_at: string;
  name: string | null;
}

interface DetailRow extends Omit<ListRow, "name"> {
  payload: unknown;
  source_path: string | null;
  updated_at: string;
}

interface DbError {
  code?: string;
  message: string;
}

/** Quem chama só vê a mensagem padrão; o erro do banco fica em `cause`, para o log mascarado. */
function dbFailure(error: DbError): AppError {
  if (error.code === "42501") return new AppError("FORBIDDEN", { cause: error });
  return new AppError("SERVICE_UNAVAILABLE", { cause: error, internal: { code: error.code } });
}

const toItem = (row: ListRow): InboxItem => ({
  id: row.id,
  protocol: row.protocol,
  kind: row.kind,
  category: row.category,
  name: row.name || null,
  status: row.status,
  notificationStatus: row.notification_status,
  notificationAttempts: row.notification_attempts,
  createdAt: row.created_at,
});

/** Página da lista, do envio mais novo ao mais antigo. A RLS decide o que entra nela. */
export async function listSubmissions(
  db: SupabaseClient,
  query: InboxQuery,
  kinds: readonly SubmissionKind[],
): Promise<InboxPage> {
  if (kinds.length === 0) return { items: [], total: 0, page: 1, totalPages: 1 };

  const fetchPage = (page: number) => {
    let builder = db.from(TABLE).select(LIST_COLUMNS, { count: "exact" }).in("kind", kinds);
    if (query.kind) builder = builder.eq("kind", query.kind);
    if (query.status) builder = builder.eq("status", query.status);
    if (query.category) builder = builder.eq("category", query.category);
    if (query.notification) builder = builder.eq("notification_status", query.notification);
    const { from, to } = pageRange(page);
    return builder
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to)
      .returns<ListRow[]>();
  };

  let page = query.page;
  let result = await fetchPage(page);
  // O PostgREST responde 416 (PGRST103) a uma página além do fim: mostra a última que existe.
  if (result.error?.code === "PGRST103") {
    result = await fetchPage(1);
    if (!result.error) {
      page = totalPages(result.count ?? 0);
      if (page > 1) result = await fetchPage(page);
    }
  }
  if (result.error) throw dbFailure(result.error);

  const total = result.count ?? 0;
  return { items: (result.data ?? []).map(toItem), total, page, totalPages: totalPages(total) };
}

/**
 * Quantos envios visíveis estão com o e-mail em `failed` (INT-07): a equipe precisa saber disso sem
 * depender de o e-mail chegar. Conta só o que a RLS deixa ver.
 */
export async function countFailedNotifications(db: SupabaseClient, kinds: readonly SubmissionKind[]): Promise<number> {
  if (kinds.length === 0) return 0;
  const { count, error } = await db
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .in("kind", kinds)
    .eq("notification_status", "failed");
  if (error) throw dbFailure(error);
  return count ?? 0;
}

/**
 * Quantos envios novos cada tipo tem, para os indicadores do início. Só conta, sem ler o conteúdo: não
 * é abertura de dado pessoal, e a RLS decide o que entra na conta.
 */
export async function countNewSubmissions(db: SupabaseClient, kinds: readonly SubmissionKind[]): Promise<number> {
  if (kinds.length === 0) return 0;
  const { count, error } = await db
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .in("kind", kinds)
    .eq("status", "novo");
  if (error) throw dbFailure(error);
  return count ?? 0;
}

/** Registro aberto, ou `null` se não existe, se o id é inválido ou se a RLS não deixa ver. */
export async function getSubmission(db: SupabaseClient, id: string): Promise<SubmissionDetail | null> {
  if (!isSubmissionId(id)) return null;
  const { data, error } = await db.from(TABLE).select(DETAIL_COLUMNS).eq("id", id).maybeSingle<DetailRow>();
  if (error) throw dbFailure(error);
  if (!data) return null;
  return {
    id: data.id,
    protocol: data.protocol,
    kind: data.kind,
    category: data.category,
    name: presentName(data.payload),
    status: data.status,
    notificationStatus: data.notification_status,
    notificationAttempts: data.notification_attempts,
    createdAt: data.created_at,
    payload: data.payload,
    sourcePath: data.source_path,
    updatedAt: data.updated_at,
  };
}

function presentName(payload: unknown): string | null {
  const name = (payload as { name?: unknown } | null)?.name;
  return typeof name === "string" && name ? name : null;
}

export interface InboxDeps {
  db: SupabaseClient;
  audit(input: AuditInput): Promise<void>;
}

export interface StatusChange {
  id: string;
  status: string;
  /** Status que a pessoa via ao escolher: se mudou nesse meio-tempo, a alteração é recusada. */
  currentStatus: string;
}

/**
 * Altera o status de atendimento. O tipo vem do banco, nunca do formulário, e `lead.status_changed`
 * vale para os três tipos: o catálogo e a guarda do banco ainda não têm `feedback.status_changed`.
 * O tipo real fica em `metadata.kind` (TECH-10).
 */
export async function changeSubmissionStatus(deps: InboxDeps, role: Role, change: StatusChange) {
  const { db } = deps;
  if (!isSubmissionId(change.id)) throw new AppError("NOT_FOUND");
  if (!isSubmissionStatus(change.status)) {
    throw new AppError("VALIDATION_FAILED", { message: "Escolha um status da lista." });
  }

  const { data: row, error: readError } = await db
    .from(TABLE)
    .select("kind, status")
    .eq("id", change.id)
    .maybeSingle<{ kind: SubmissionKind; status: SubmissionStatus }>();
  if (readError) throw dbFailure(readError);
  if (!row) throw new AppError("NOT_FOUND");
  if (!canOnKind(role, row.kind, "edit")) throw new AppError("FORBIDDEN");
  if (row.status !== change.currentStatus) throw new AppError("CONFLICT");
  if (row.status === change.status) return { changed: false };
  if (!statusOptions(row.kind).includes(change.status)) {
    throw new AppError("VALIDATION_FAILED", { message: "Este status não se aplica a este tipo de envio." });
  }

  // A condição em `status` fecha a corrida entre duas pessoas: só uma muda a linha.
  const { data: updated, error: updateError } = await db
    .from(TABLE)
    .update({ status: change.status })
    .eq("id", change.id)
    .eq("status", row.status)
    .select("id");
  if (updateError) throw dbFailure(updateError);
  if (!updated?.length) throw new AppError("CONFLICT");

  await deps.audit({
    event: "lead.status_changed",
    resourceId: change.id,
    metadata: { kind: row.kind, fromStatus: row.status, toStatus: change.status },
  });
  return { changed: true };
}

const DELETE_EVENT = { lead: "lead.deleted", contact: "lead.deleted", feedback: "feedback.deleted" } as const;

/**
 * Exclui um envio a pedido do titular ou no fim da retenção (SEG-01 §5). Só depois de arquivado, um
 * por vez, para um clique errado não apagar dado de ninguém. O evento é crítico e vem antes da
 * exclusão: sem trilha não há exclusão, e se ela falhar fica o registro da falha (TECH-10 §3).
 */
export async function deleteSubmission(deps: InboxDeps, role: Role, id: string) {
  const { db } = deps;
  if (!isSubmissionId(id)) throw new AppError("NOT_FOUND");

  const { data: row, error: readError } = await db
    .from(TABLE)
    .select("kind, status")
    .eq("id", id)
    .maybeSingle<{ kind: SubmissionKind; status: SubmissionStatus }>();
  if (readError) throw dbFailure(readError);
  if (!row) throw new AppError("NOT_FOUND");
  if (!canOnKind(role, row.kind, "delete")) throw new AppError("FORBIDDEN");
  if (row.status !== "arquivado") {
    throw new AppError("CONFLICT", { message: "Arquive o envio antes de excluir." });
  }

  const audit = (outcome: "success" | "failure") =>
    deps.audit({ event: DELETE_EVENT[row.kind], resourceId: id, outcome, metadata: { kind: row.kind } });

  await audit("success");
  try {
    const { data: deleted, error } = await db.from(TABLE).delete().eq("id", id).eq("status", "arquivado").select("id");
    if (error) throw dbFailure(error);
    if (!deleted?.length) throw new AppError("CONFLICT");
  } catch (error) {
    await audit("failure").catch(() => undefined);
    throw error;
  }
}
