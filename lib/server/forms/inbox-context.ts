/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : inbox-context.ts
 Descrição    : Liga as telas de envios à sessão: guardas por tipo, leitura auditada e Server Actions.

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
 04/11/2026 Vinícius Nishimura Reis  Exclusão de envio arquivado, a pedido do titular (FORM-09).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import type { Action } from "@/lib/domain/auth/rbac";
import type { CmsFormState } from "@/lib/domain/content/cms-form";
import { INBOX_PATH, canOnKind, isSubmissionId, kindsAllowed } from "@/lib/domain/forms/inbox";
import type { SubmissionKind } from "@/lib/domain/forms/schemas";
import { recordAuditEvent } from "../audit";
import { FORBIDDEN_PATH, requirePageAccess, requirePermission, requireUser } from "../auth/guards";
import type { SessionUser } from "../auth/session";
import { withFlash } from "../cms/context";
import { text } from "../cms/form-data";
import { newRequestId, toPublicError } from "../errors";
import { logger } from "../logger";
import { createSessionClient } from "../supabase/server";
import { changeSubmissionStatus, deleteSubmission, getSubmission, type InboxDeps } from "./inbox";

/**
 * Guarda das telas de envios: a tela serve a dois recursos (`lead` e `feedback`), então entra quem
 * tem ao menos um. `requirePageAccess` resolve sessão e conta pendente; aqui fica o recorte por tipo.
 * Roda antes de qualquer leitura e antes de validar o id, para não revelar se um registro existe.
 */
export async function requireInboxPage(path: string): Promise<{ user: SessionUser; kinds: SubmissionKind[] }> {
  const user = await requirePageAccess("dashboard", "view", path);
  const kinds = kindsAllowed(user.role, "view");
  if (kinds.length === 0) {
    logger.warn("auth.page.denied", { userId: user.id, role: user.role, resource: "lead|feedback", action: "view" });
    redirect(FORBIDDEN_PATH);
  }
  return { user, kinds };
}

const VIEW_EVENT = { lead: "lead.viewed", contact: "lead.viewed", feedback: "feedback.viewed" } as const;

/**
 * Abre um envio para quem já passou pela guarda. Sem linha, ou sem permissão para o tipo, a resposta
 * é a mesma (`null`). Cada abertura gera `lead.viewed`/`feedback.viewed`, só com referências (TECH-08).
 */
export async function openSubmission(user: SessionUser, id: string) {
  if (!isSubmissionId(id)) return null;
  const record = await getSubmission(await createSessionClient(), id);
  if (!record || !canOnKind(user.role, record.kind, "view")) return null;
  await recordAuditEvent({
    event: VIEW_EVENT[record.kind],
    resourceId: record.id,
    metadata: { kind: record.kind, category: record.category },
  });
  return record;
}

async function inboxDeps(): Promise<InboxDeps> {
  return { db: await createSessionClient(), audit: recordAuditEvent };
}

/**
 * Envelope das Server Actions de envios. O tipo só é conhecido depois de ler a linha, então a primeira
 * barreira é "tem a permissão em algum tipo": quem não tem cai em `requirePermission`, que lança 403 e
 * grava `access.denied`, sem tocar no registro. O serviço confere de novo com o tipo real.
 */
async function inboxAction(
  action: Action,
  run: (user: SessionUser, deps: InboxDeps) => Promise<string>,
): Promise<CmsFormState> {
  const requestId = newRequestId();
  let destination: string;
  try {
    const user = await requireUser();
    if (kindsAllowed(user.role, action).length === 0) await requirePermission("lead", action);
    destination = await run(user, await inboxDeps());
  } catch (error) {
    unstable_rethrow(error);
    return { status: "error", ...toPublicError(error, requestId, "forms.inbox.action_failed") };
  }
  // Sem isto, a lista já visitada continuaria mostrando o status antigo ao voltar.
  revalidatePath(INBOX_PATH);
  redirect(destination);
}

/** Server Action do formulário de status de atendimento. */
export async function changeStatusFromForm(form: FormData): Promise<CmsFormState> {
  return inboxAction("edit", async (user, deps) => {
    const id = text(form, "id");
    await changeSubmissionStatus(deps, user.role, {
      id,
      status: text(form, "status"),
      currentStatus: text(form, "currentStatus"),
    });
    return withFlash(`${INBOX_PATH}/${id}`, "salvo");
  });
}

/** Server Action da exclusão de um envio arquivado. */
export async function deleteFromForm(form: FormData): Promise<CmsFormState> {
  return inboxAction("delete", async (user, deps) => {
    await deleteSubmission(deps, user.role, text(form, "id"));
    return withFlash(INBOX_PATH, "excluido");
  });
}
