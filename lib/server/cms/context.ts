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
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Biblioteca de mídia no store e opções de imagem (ADM-06).
 26/10/2026 Vinícius Nishimura Reis  Categorias, cases, galeria e envio de mídia (ADM-08).
28/10/2026 Codex                     Usa códigos de aviso fechados (TECH-13).
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 02/11/2026 Vinícius Nishimura Reis  Envio de mídia em dois passos no servidor, sem receber o arquivo (TECH-13, #313).
 04/11/2026 Vinícius Nishimura Reis  Editar texto alternativo e excluir arquivo sem uso da biblioteca (ADM-09).
 04/11/2026 Vinícius Nishimura Reis  Ações aceitam conteúdo sem endereço próprio, como o CTA (ADM-11).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
 12/11/2026 Codex                     Invalida capas do blog ao editar mídia (FUT-10).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { redirect, unstable_rethrow } from "next/navigation";
import { publicEnv } from "@/lib/config/public-env";
import { safeAdminRedirect } from "@/lib/domain/auth/redirect";
import type { Action, Resource } from "@/lib/domain/auth/rbac";
import type { CmsFlash, CmsFormState, CmsWarning, MediaUploadTicket } from "@/lib/domain/content/cms-form";
import { COMMAND_PERMISSION, type PublicationCommand } from "@/lib/domain/content/publication";
import type { VersionEntity } from "@/lib/domain/content/versions";
import { recordAuditEvent } from "../audit";
import { requirePermission } from "../auth/guards";
import type { SessionUser } from "../auth/session";
import { invalidateContentFromAction } from "../content/invalidate";
import { newRequestId, toPublicError } from "../errors";
import { createSessionClient } from "../supabase/server";
import { runContentCommand, saveContent, type CmsDeps } from "./content-service";
import type { CmsItem, EntityDefinition } from "./entities";
import { checked, command, itemRef, text, typedValues } from "./form-data";
import { deleteMedia, finalizeMediaUpload, prepareMediaUpload, updateMediaDetails } from "./media-service";
import { createSupabaseMediaStorage } from "./media-storage";
import type { CmsSnapshot } from "./store";
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
export async function loadCmsSnapshot(): Promise<CmsSnapshot> {
  return (await cmsDeps()).store.snapshot();
}

/** Última alteração registrada do item, para mostrar quem mexeu por último. */
export async function loadLastChange(entity: VersionEntity, id: string) {
  const [latest] = await (await cmsDeps()).store.listVersions({ entity, entityId: id, limit: 1 });
  return latest
    ? {
        author: latest.authorName ?? (latest.authorId ? "Pessoa sem nome no perfil" : "Conta removida"),
        createdAt: latest.createdAt,
      }
    : undefined;
}

/** Imagens da biblioteca de mídia para os campos de escolha (rótulo = texto alternativo). */
export async function loadImageOptions(): Promise<{ id: string; label: string; src: string }[]> {
  const media = await (await cmsDeps()).store.listMedia();
  return media
    .filter((asset) => asset.mimeType.startsWith("image/"))
    .map((asset) => ({
      id: asset.id,
      label: asset.decorative ? `Decorativa — ${asset.src.split("/").pop()}` : asset.alt || asset.src.split("/").pop()!,
      src: asset.src,
    }));
}

/** Fotos que podem entrar no "Nosso time": imagens da biblioteca com texto alternativo. */
export async function loadPhotoOptions(): Promise<{ id: string; label: string; src: string }[]> {
  const media = await (await cmsDeps()).store.listMedia();
  return media
    .filter((asset) => asset.mimeType.startsWith("image/") && asset.alt)
    .map((asset) => ({ id: asset.id, label: asset.alt, src: asset.src }));
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
export function withFlash(path: string, flash: CmsFlash, warnings: CmsWarning[] = []): string {
  const params = new URLSearchParams({ ok: flash });
  if (warnings.length) params.set("aviso", warnings.join(","));
  return `${path}${path.includes("?") ? "&" : "?"}${params}`;
}

const FLASH_BY_COMMAND: Record<Exclude<PublicationCommand, "save" | "delete">, CmsFlash> = {
  publish: "publicado",
  unpublish: "despublicado",
  archive: "arquivado",
  restore: "restaurado",
};

/** Server Action de salvar (criar rascunho ou editar), comum a todas as entidades do painel. */
export async function cmsSaveAction<I extends { slug?: string }, T extends CmsItem>(
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
export async function cmsCommandAction<I extends { slug?: string }, T extends CmsItem>(
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

const mediaMeta = (form: FormData) => ({ alt: text(form, "alt"), decorative: checked(form, "decorative") });
const typedMediaMeta = (form: FormData) => ({
  alt: text(form, "alt"),
  decorative: checked(form, "decorative") ? "on" : "",
});

async function mediaStorage() {
  return createSupabaseMediaStorage(await createSessionClient());
}

/**
 * Primeiro passo do envio para a biblioteca (ADR-0005): confere permissão, formato, tamanho e
 * texto alternativo declarados e devolve a autorização para o navegador mandar os bytes direto
 * ao Storage. A Server Action nunca recebe o arquivo, porque a Vercel recusa corpo acima de 4,5 MB.
 */
export async function cmsRequestMediaUpload(form: FormData): Promise<MediaUploadTicket> {
  const requestId = newRequestId();
  try {
    const user = await requirePermission("media", "create");
    const ticket = await prepareMediaUpload(
      { ...(await cmsDeps()), storage: await mediaStorage(), newId: () => crypto.randomUUID() },
      user,
      { name: text(form, "name"), type: text(form, "type"), size: Number(text(form, "size")), ...mediaMeta(form) },
    );
    return { status: "ready", ...ticket };
  } catch (error) {
    unstable_rethrow(error);
    return {
      status: "error",
      ...toPublicError(error, requestId, "cms.action.unexpected_error"),
      values: typedMediaMeta(form),
    };
  }
}

/**
 * Último passo: confere os bytes que chegaram ao Storage e registra na biblioteca. Volta para
 * `voltar` quando é um caminho seguro do painel (ex.: o case que pediu a imagem) ou para a
 * própria biblioteca.
 */
export async function cmsFinishMediaUpload(form: FormData): Promise<CmsFormState> {
  const back = safeAdminRedirect(form.get("voltar"));
  const destination = back === "/admin" ? "/admin/midia" : back;
  return cmsFormAction(
    "media",
    "create",
    async (user, deps) => {
      await finalizeMediaUpload({ ...deps, storage: await mediaStorage() }, user, {
        path: text(form, "path"),
        name: text(form, "name"),
        type: text(form, "type"),
        ...mediaMeta(form),
      });
      return withFlash(destination, "enviado");
    },
    typedMediaMeta(form),
  );
}

/** Salva texto alternativo e marcação de decorativa de um arquivo da biblioteca (ADM-09). */
export async function cmsSaveMedia(form: FormData): Promise<CmsFormState> {
  return cmsFormAction(
    "media",
    "edit",
    async (user, deps) => {
      const ref = itemRef(form)!;
      const warnings = await updateMediaDetails(deps, user, ref, mediaMeta(form));
      deps.invalidate({ entity: "blog" });
      return withFlash(`/admin/midia/${ref.id}`, "salvo", warnings);
    },
    typedMediaMeta(form),
  );
}

/** Exclui um arquivo sem uso da biblioteca e do Storage (ADM-09). */
export async function cmsDeleteMedia(form: FormData): Promise<CmsFormState> {
  return cmsFormAction("media", "delete", async (user, deps) => {
    const warnings = await deleteMedia({ ...deps, storage: await mediaStorage() }, user, text(form, "id"));
    return withFlash("/admin/midia", "excluido", warnings);
  });
}
