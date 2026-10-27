/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : context.ts
 Descrição    : Dependências de produção do CMS e envelope das Server Actions do painel.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Biblioteca de mídia no store e opções de imagem (ADM-06).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { redirect, unstable_rethrow } from "next/navigation";
import { publicEnv } from "@/lib/config/public-env";
import type { Action, Resource } from "@/lib/domain/auth/rbac";
import type { CmsFlash, CmsFormState } from "@/lib/domain/content/cms-form";
import { COMMAND_PERMISSION, type PublicationCommand } from "@/lib/domain/content/publication";
import type { ContentSnapshot } from "@/lib/domain/content/types";
import { recordAuditEvent } from "../audit";
import { requirePermission } from "../auth/guards";
import type { SessionUser } from "../auth/session";
import { invalidateContentFromAction } from "../content/invalidate";
import { newRequestId, toPublicError } from "../errors";
import { createSessionClient } from "../supabase/server";
import { runContentCommand, saveContent, type CmsDeps } from "./content-service";
import type { CmsItem, EntityDefinition } from "./entities";
import { command, itemRef, text, typedValues } from "./form-data";
import { createSupabaseCmsStore } from "./supabase-store";

/** Store do CMS com a sessão de quem está logado: toda leitura e gravação passa pela RLS. */
export async function cmsDeps(): Promise<CmsDeps> {
  const client = await createSessionClient();
  return {
    store: createSupabaseCmsStore(client, publicEnv.NEXT_PUBLIC_SUPABASE_URL!),
    audit: recordAuditEvent,
    invalidate: invalidateContentFromAction,
    now: () => new Date(),
  };
}

/** Snapshot do painel (todos os estados) para as páginas de listagem e edição. */
export async function loadCmsSnapshot(): Promise<ContentSnapshot> {
  return (await cmsDeps()).store.snapshot();
}

/** Imagens da biblioteca de mídia para os campos de escolha (rótulo = texto alternativo). */
export async function loadImageOptions(): Promise<{ id: string; label: string }[]> {
  const media = await (await cmsDeps()).store.listMedia();
  return media
    .filter((asset) => asset.mimeType.startsWith("image/"))
    .map((asset) => ({
      id: asset.id,
      label: asset.decorative ? `Decorativa — ${asset.src.split("/").pop()}` : asset.alt || asset.src.split("/").pop()!,
    }));
}

/**
 * Envelope das Server Actions de formulário do CMS: exige a permissão (ADM-03) antes de tudo,
 * executa e, no sucesso, redireciona para o caminho devolvido (a página relê o item com a
 * versão nova). Erros viram estado do formulário, com os valores digitados para repreencher.
 */
export async function cmsFormAction(
  resource: Resource,
  action: Action,
  run: (user: SessionUser, deps: CmsDeps) => Promise<string>,
  values?: Record<string, string>,
): Promise<CmsFormState> {
  const requestId = newRequestId();
  let destination: string;
  try {
    const user = await requirePermission(resource, action);
    destination = await run(user, await cmsDeps());
  } catch (error) {
    unstable_rethrow(error);
    const publicError = toPublicError(error, requestId, "cms.action.unexpected_error");
    return { status: "error", ...publicError, values };
  }
  redirect(destination);
}

/** Caminho com mensagem de sucesso (?ok=) e avisos de impacto (?aviso=). */
export function withFlash(path: string, flash: string, warnings: string[] = []): string {
  const params = new URLSearchParams({ ok: flash });
  if (warnings.length) params.set("aviso", warnings.join(" "));
  return `${path}?${params}`;
}

const FLASH_BY_COMMAND: Record<Exclude<PublicationCommand, "save" | "delete">, CmsFlash> = {
  publish: "publicado",
  unpublish: "despublicado",
  archive: "arquivado",
  restore: "restaurado",
};

/** Server Action de salvar (criar rascunho ou editar), comum a todas as entidades do painel. */
export async function cmsSaveAction<I extends { slug: string }, T extends CmsItem>(
  def: EntityDefinition<I, T>,
  form: FormData,
  raw: unknown,
): Promise<CmsFormState> {
  const editing = Boolean(text(form, "id"));
  return cmsFormAction(
    def.resource,
    editing ? "edit" : "create",
    async (user, deps) => {
      const result = await saveContent(deps, user, def, raw, itemRef(form));
      return withFlash(`${def.adminPath}/${result.id}`, result.created ? "criado" : "salvo");
    },
    typedValues(form, ["id", "expectedUpdatedAt"]),
  );
}

/** Server Action de publicação (publicar, despublicar, arquivar, restaurar, excluir). */
export async function cmsCommandAction<I extends { slug: string }, T extends CmsItem>(
  def: EntityDefinition<I, T>,
  form: FormData,
): Promise<CmsFormState> {
  let requested: PublicationCommand;
  try {
    requested = command(form);
  } catch (error) {
    return { status: "error", ...toPublicError(error, newRequestId()) };
  }
  return cmsFormAction(def.resource, COMMAND_PERMISSION[requested], async (user, deps) => {
    const ref = itemRef(form)!;
    const result = await runContentCommand(deps, user, def, ref, requested);
    if (result.status === "deleted") return withFlash(def.adminPath, "excluido", result.warnings);
    return withFlash(
      `${def.adminPath}/${ref.id}`,
      FLASH_BY_COMMAND[requested as keyof typeof FLASH_BY_COMMAND],
      result.warnings,
    );
  });
}
