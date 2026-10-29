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
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { redirect, unstable_rethrow } from "next/navigation";
import { publicEnv } from "@/lib/config/public-env";
import { safeAdminRedirect } from "@/lib/domain/auth/redirect";
import {
  MEDIA_BUCKET,
  MEDIA_RULES,
  buildStoragePath,
  MAX_MEDIA_UPLOAD_BYTES,
  publicMediaUrl,
} from "@/lib/domain/media/policy";
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
import { registerUploadedMedia, type MediaStorage } from "./media-service";
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

export type MediaUploadTicket =
  | { status: "error"; code: string; message: string; requestId: string; fieldErrors?: Record<string, string[]> }
  | { status: "ready"; path: string; token: string };

const MEDIA_VALIDATION_HEAD_BYTES = 256 * 1024;

/** Baixa somente o início do objeto, suficiente para assinatura e dimensões, preservando o tamanho total. */
async function downloadMediaHead(url: string): Promise<{ head: Uint8Array; size: number }> {
  const response = await fetch(url, {
    headers: { Range: `bytes=0-${MEDIA_VALIDATION_HEAD_BYTES - 1}` },
    cache: "no-store",
  });
  if (!response.ok || !response.body) throw new AppError("SERVICE_UNAVAILABLE");
  const contentRange = response.headers.get("content-range");
  if (response.status === 206 && !contentRange) {
    await response.body.cancel();
    throw new AppError("SERVICE_UNAVAILABLE");
  }
  const total =
    response.status === 206
      ? Number(contentRange?.match(/\/(\d+)$/)?.[1])
      : Number(response.headers.get("content-length"));
  if (!Number.isSafeInteger(total) || total <= 0) {
    await response.body.cancel();
    throw new AppError("SERVICE_UNAVAILABLE");
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (length < MEDIA_VALIDATION_HEAD_BYTES) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        const chunk = value.subarray(0, MEDIA_VALIDATION_HEAD_BYTES - length);
        chunks.push(chunk);
        length += chunk.length;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const head = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    head.set(chunk, offset);
    offset += chunk.length;
  }
  return { head, size: total };
}

/** Emite uma URL assinada depois de autorizar a pessoa e validar o tamanho/tipo declarados. */
export async function cmsCreateMediaUpload(form: FormData): Promise<MediaUploadTicket> {
  const requestId = newRequestId();
  try {
    await requirePermission("media", "create");
    const name = text(form, "name");
    const type = text(form, "type");
    const size = Number(text(form, "size"));
    const alt = text(form, "alt").trim();
    const decorative = checked(form, "decorative");
    const rule = MEDIA_RULES[type];
    if (!rule) throw new AppError("UNSUPPORTED_MEDIA_TYPE", { fieldErrors: { file: ["Formato não aceito."] } });
    if (!Number.isSafeInteger(size) || size <= 0 || size > Math.min(rule.maxBytes, MAX_MEDIA_UPLOAD_BYTES)) {
      throw new AppError("PAYLOAD_TOO_LARGE", {
        fieldErrors: { file: ["Arquivo vazio ou acima do limite permitido."] },
      });
    }
    if (rule.kind === "image" && !decorative && (alt.length < 3 || alt.length > 160)) {
      throw new AppError("VALIDATION_FAILED", { fieldErrors: { alt: ["Descreva a imagem em 3 a 160 caracteres."] } });
    }
    const client = await createSessionClient();
    const path = buildStoragePath(name, type, crypto.randomUUID());
    const { data, error } = await client.storage.from(MEDIA_BUCKET).createSignedUploadUrl(path, { upsert: false });
    if (error || !data) throw new AppError("SERVICE_UNAVAILABLE", { message: "Não foi possível preparar o envio." });
    return { status: "ready", path, token: data.token };
  } catch (error) {
    unstable_rethrow(error);
    return { status: "error", ...toPublicError(error, requestId, "cms.media.upload_ticket_failed") };
  }
}

/** Confere os bytes do objeto enviado e só então registra a mídia no catálogo. */
export async function cmsFinalizeMediaUpload(form: FormData): Promise<CmsFormState> {
  const path = text(form, "path");
  const name = text(form, "name");
  const type = text(form, "type");
  const back = safeAdminRedirect(form.get("voltar"));
  const destination = back === "/admin" ? "/admin/midia" : back;
  return cmsFormAction(
    "media",
    "create",
    async (user, deps) => {
      if (!/^\d{4}\/\d{2}\/[0-9a-f-]{36}-[a-z0-9-]+\.[a-z0-9]+$/i.test(path) || !MEDIA_RULES[type]) {
        throw new AppError("VALIDATION_FAILED", {
          fieldErrors: { file: ["Envio inválido. Inicie o envio novamente."] },
        });
      }
      const client = await createSessionClient();
      const bucket = client.storage.from(MEDIA_BUCKET);
      let downloaded: { head: Uint8Array; size: number };
      try {
        downloaded = await downloadMediaHead(publicMediaUrl(publicEnv.NEXT_PUBLIC_SUPABASE_URL!, path));
      } catch {
        await bucket.remove([path]).catch(() => undefined);
        throw new AppError("SERVICE_UNAVAILABLE", { message: "Não foi possível conferir o arquivo enviado." });
      }
      await registerUploadedMedia(
        { ...deps, storage: supabaseStorage(client) },
        user,
        path,
        { name, type, bytes: downloaded.head, size: downloaded.size },
        { alt: text(form, "alt"), decorative: checked(form, "decorative") },
      );
      return withFlash(destination, "enviado");
    },
    { alt: text(form, "alt"), decorative: checked(form, "decorative") ? "on" : "" },
  );
}
