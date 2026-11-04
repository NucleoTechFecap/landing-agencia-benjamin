/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : media-service.ts
 Descrição    : Envio de arquivo para a biblioteca de mídia do CMS (validação, Storage e registro).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
 02/11/2026 Vinícius Nishimura Reis  Autoriza o envio e confere o que chegou ao Storage (TECH-13, #313).
 04/11/2026 Vinícius Nishimura Reis  Registra quando um arquivo recusado não sai do bucket (SEG-05).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { can } from "@/lib/domain/auth/rbac";
import { readImageDimensions } from "@/lib/domain/media/dimensions";
import {
  MEDIA_RULES,
  buildStoragePath,
  checkDeclaredUpload,
  isUploadPath,
  uploadIdOf,
  validateUpload,
  type MediaProblem,
} from "@/lib/domain/media/policy";
import { AppError } from "../errors";
import { logger } from "../logger";
import type { CmsActor, CmsDeps } from "./content-service";
import type { MediaAsset } from "./store";

/** Início de um objeto do Storage, com o tamanho total e o tipo gravados nele. */
export interface StoredObject {
  bytes: Uint8Array;
  size: number;
  contentType: string;
}

/** Onde os bytes ficam (bucket "media" do Supabase Storage em produção). */
export interface MediaStorage {
  /** Autorização de uso único para o navegador enviar direto a este caminho. */
  createUploadToken(path: string): Promise<string>;
  /** Primeiros `limit` bytes do objeto; `null` se ele não existe. */
  readStart(path: string, limit: number): Promise<StoredObject | null>;
  remove(path: string): Promise<void>;
}

export interface UploadMeta {
  alt: string;
  decorative: boolean;
}

export interface UploadRequest extends UploadMeta {
  name: string;
  /** Tipo declarado pelo navegador: conferido de novo sobre os bytes, no último passo. */
  type: string;
  size: number;
}

export interface FinishedUpload extends UploadMeta {
  path: string;
  name: string;
  type: string;
}

const ALT_LIMITS = { min: 3, max: 160 } as const;
/**
 * Quanto ler de um PDF: basta a assinatura. Imagem é lida inteira (até o limite), porque o marcador
 * de dimensões do JPEG pode vir depois de metadados longos.
 */
const SIGNATURE_BYTES = 64 * 1024;

function altError(type: string, meta: UploadMeta): AppError | null {
  const alt = meta.alt.trim();
  if (MEDIA_RULES[type]?.kind !== "image" || meta.decorative) return null;
  if (alt.length >= ALT_LIMITS.min && alt.length <= ALT_LIMITS.max) return null;
  return new AppError("VALIDATION_FAILED", {
    fieldErrors: {
      alt: [`Descreva a imagem em ${ALT_LIMITS.min} a ${ALT_LIMITS.max} caracteres (texto alternativo).`],
    },
  });
}

function problemsError(problems: readonly MediaProblem[]): AppError {
  const code =
    problems[0].code === "UNSUPPORTED_MEDIA_TYPE" || problems[0].code === "TYPE_MISMATCH"
      ? "UNSUPPORTED_MEDIA_TYPE"
      : problems[0].code === "PAYLOAD_TOO_LARGE"
        ? "PAYLOAD_TOO_LARGE"
        : "VALIDATION_FAILED";
  return new AppError(code, {
    message: problems.map((problem) => problem.message).join(" "),
    fieldErrors: { file: problems.map((problem) => problem.message) },
  });
}

/**
 * Primeiro passo do envio (ADR-0005 / ARC-10): permissão media:create, formato, tamanho e texto
 * alternativo declarados. Devolve o caminho imprevisível e o token para o navegador enviar.
 */
export async function prepareMediaUpload(
  deps: Pick<CmsDeps, "now"> & { storage: MediaStorage; newId: () => string },
  actor: CmsActor,
  request: UploadRequest,
): Promise<{ path: string; token: string }> {
  if (!can(actor.role, "media", "create")) throw new AppError("FORBIDDEN");
  const problem = checkDeclaredUpload(request.type, request.size);
  if (problem) throw problemsError([problem]);
  const invalidAlt = altError(request.type, request);
  if (invalidAlt) throw invalidAlt;
  const path = buildStoragePath(request.name, request.type, deps.newId(), deps.now());
  return { path, token: await deps.storage.createUploadToken(path) };
}

/**
 * Último passo: confere o que chegou ao Storage (tipo gravado, assinatura dos bytes, tamanho real e
 * dimensões) e registra em media_assets. Arquivo recusado é apagado, para não sobrar no bucket
 * público. Nada é apagado antes de saber que o caminho não está registrado: quem tem media:delete
 * poderia, com um caminho forjado, tirar do ar um arquivo em uso.
 */
export async function finalizeMediaUpload(
  deps: CmsDeps & { storage: MediaStorage },
  actor: CmsActor,
  upload: FinishedUpload,
): Promise<MediaAsset> {
  if (!can(actor.role, "media", "create")) throw new AppError("FORBIDDEN");
  const { path, type } = upload;
  if (!isUploadPath(path, type)) {
    throw new AppError("VALIDATION_FAILED", {
      fieldErrors: { file: ["Envio inválido. Escolha o arquivo e envie de novo."] },
    });
  }
  const isRegistered = (asset: MediaAsset) => asset.src.endsWith(`/${path}`);
  // Repetição do mesmo envio (a resposta anterior se perdeu): o trabalho já está feito.
  const registered = (await deps.store.listMedia()).find(isRegistered);
  if (registered) return registered;

  // Quem envia vê o motivo da recusa, não a falha da limpeza. O log leva o que a operação precisa para
  // apagar à mão o arquivo que continua público, sem registro (ADR-0005).
  const discard = () =>
    deps.storage
      .remove(path)
      .catch((error: unknown) => logger.warn("media.discard.failed", { objectId: uploadIdOf(path), error }));
  const rule = MEDIA_RULES[type];
  const isImage = rule.kind === "image";
  let stored: StoredObject | null;
  try {
    stored = await deps.storage.readStart(path, isImage ? rule.maxBytes : SIGNATURE_BYTES);
  } catch (error) {
    await discard();
    throw error;
  }
  if (!stored) {
    throw new AppError("VALIDATION_FAILED", {
      fieldErrors: { file: ["O arquivo não chegou ao armazenamento. Envie de novo."] },
    });
  }

  const dimensions = isImage ? readImageDimensions(stored.bytes, type) : null;
  const problems = validateUpload({
    fileName: upload.name,
    declaredType: type,
    size: stored.size,
    head: stored.bytes.slice(0, 32),
    width: dimensions?.width,
    height: dimensions?.height,
  });
  if (stored.size > 0 && stored.contentType !== type && !problems.some((item) => item.code === "TYPE_MISMATCH")) {
    problems.push({ code: "TYPE_MISMATCH", message: "O conteúdo do arquivo não corresponde ao formato informado." });
  }
  const refusal = problems.length ? problemsError(problems) : altError(type, upload);
  if (refusal) {
    await discard();
    throw refusal;
  }

  const alt = upload.alt.trim();
  let asset: MediaAsset;
  try {
    asset = await deps.store.insertMedia({
      path,
      mime_type: type,
      size_bytes: stored.size,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
      alt_text: isImage && upload.decorative ? null : alt || null,
      decorative: isImage && upload.decorative,
    });
  } catch (error) {
    // Outra requisição do mesmo envio pode ter registrado antes: aí o arquivo fica.
    const concurrent = (await deps.store.listMedia().catch(() => [])).find(isRegistered);
    if (concurrent) return concurrent;
    await discard();
    throw error;
  }
  await deps.audit({
    event: "media.uploaded",
    resourceId: asset.id,
    metadata: { mimeType: type, size: stored.size },
  });
  return asset;
}
