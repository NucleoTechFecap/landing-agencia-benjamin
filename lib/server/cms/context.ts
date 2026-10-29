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
 26/10/2026 Vinícius Nishimura Reis  Categorias, cases, galeria e envio de mídia (ADM-08).
 28/10/2026 Vinícius Nishimura Reis  Passa códigos, não texto livre, nos avisos do CMS (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { redirect, unstable_rethrow } from "next/navigation";
import { publicEnv } from "@/lib/config/public-env";
import { safeAdminRedirect } from "@/lib/domain/auth/redirect";
import { MEDIA_BUCKET } from "@/lib/domain/media/policy";
import type { Action, Resource } from "@/lib/domain/auth/rbac";
import type { CmsFlash, CmsFormState } from "@/lib/domain/content/cms-form";
import { COMMAND_PERMISSION, type PublicationCommand } from "@/lib/domain/content/publication";
import type { ContentSnapshot } from "@/lib/domain/content/types";
import { recordAuditEvent } from "../audit";
import { requirePermission } from "../auth/guards";
import type { SessionUser } from "../auth/session";
import { invalidateContentFromAction } from "../content/invalidate";
import { AppError, newRequestId, toPublicError } from "../errors";
import { createSessionClient } from "../supabase/server";
import { runContentCommand, saveContent, type CmsDeps } from "./content-service";
import type { CmsItem, EntityDefinition } from "./entities";
import { checked, command, itemRef, text, typedValues } from "./form-data";
import { uploadMedia, type MediaStorage } from "./media-service";
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
  const warningCodes = new Set<string>();
  for (const warning of warnings) {
    if (warning.startsWith("O vínculo com ")) warningCodes.add("vinculos");
    if (warning.includes("CTA(s) passarão a usar o link de fallback.")) warningCodes.add("ctas");
  }
  for (const code of warningCodes) params.append("aviso", code);
  return `${path}${path.includes("?") ? "&" : "?"}${params}`;
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

/** Bucket "media" do Supabase Storage, com a sessão de quem envia (políticas media:*). */
function supabaseStorage(client: Awaited<ReturnType<typeof createSessionClient>>): MediaStorage {
  const bucket = client.storage.from(MEDIA_BUCKET);
  return {
    async upload(path, bytes, contentType) {
      const { error } = await bucket.upload(path, bytes, { contentType, upsert: false, cacheControl: "31536000" });
      if (error)
        throw new AppError("SERVICE_UNAVAILABLE", {
          message: "Não foi possível enviar o arquivo. Tente de novo.",
          cause: error,
        });
    },
    async remove(path) {
      await bucket.remove([path]);
    },
  };
}

/**
 * Server Action de envio para a biblioteca de mídia (ADR-0005). Volta para `voltar` quando é
 * um caminho seguro do painel (ex.: o case que pediu a imagem) ou para a própria biblioteca.
 */
export async function cmsUploadAction(form: FormData): Promise<CmsFormState> {
  const back = safeAdminRedirect(form.get("voltar"));
  const destination = back === "/admin" ? "/admin/midia" : back;
  return cmsFormAction(
    "media",
    "create",
    async (user, deps) => {
      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) {
        throw new AppError("VALIDATION_FAILED", { fieldErrors: { file: ["Escolha um arquivo."] } });
      }
      const client = await createSessionClient();
      await uploadMedia(
        { ...deps, storage: supabaseStorage(client), newId: () => crypto.randomUUID() },
        user,
        { name: file.name, type: file.type, bytes: new Uint8Array(await file.arrayBuffer()) },
        { alt: text(form, "alt"), decorative: checked(form, "decorative") },
      );
      return withFlash(destination, "enviado");
    },
    { alt: text(form, "alt"), decorative: checked(form, "decorative") ? "on" : "" },
  );
}
