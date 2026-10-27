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
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { can } from "@/lib/domain/auth/rbac";
import { readImageDimensions } from "@/lib/domain/media/dimensions";
import { MEDIA_RULES, buildStoragePath, validateUpload } from "@/lib/domain/media/policy";
import { AppError } from "../errors";
import type { CmsActor, CmsDeps } from "./content-service";
import type { MediaAsset } from "./store";

/** Onde os bytes ficam (bucket "media" do Supabase Storage em produção). */
export interface MediaStorage {
  upload(path: string, bytes: Uint8Array, contentType: string): Promise<void>;
  remove(path: string): Promise<void>;
}

export interface UploadFile {
  name: string;
  /** Tipo declarado pelo navegador — conferido contra a assinatura dos bytes. */
  type: string;
  bytes: Uint8Array;
}

export interface UploadMeta {
  alt: string;
  decorative: boolean;
}

const ALT_LIMITS = { min: 3, max: 160 } as const;

/**
 * Valida e envia um arquivo (ADR-0005 / ARC-10): permissão media:create, texto alternativo
 * obrigatório para imagem não decorativa, tipo real pela assinatura dos bytes, tamanho e
 * dimensões. Depois do envio ao Storage o arquivo é registrado em media_assets; se o
 * registro falhar, o objeto enviado é apagado para não sobrar arquivo órfão no bucket.
 */
export async function uploadMedia(
  deps: CmsDeps & { storage: MediaStorage; newId: () => string },
  actor: CmsActor,
  file: UploadFile,
  meta: UploadMeta,
): Promise<MediaAsset> {
  if (!can(actor.role, "media", "create")) throw new AppError("FORBIDDEN");

  const isImage = MEDIA_RULES[file.type]?.kind === "image";
  const alt = meta.alt.trim();
  if (isImage && !meta.decorative && (alt.length < ALT_LIMITS.min || alt.length > ALT_LIMITS.max)) {
    throw new AppError("VALIDATION_FAILED", {
      fieldErrors: {
        alt: [`Descreva a imagem em ${ALT_LIMITS.min} a ${ALT_LIMITS.max} caracteres (texto alternativo).`],
      },
    });
  }

  const dimensions = isImage ? readImageDimensions(file.bytes, file.type) : null;
  const problems = validateUpload({
    fileName: file.name,
    declaredType: file.type,
    size: file.bytes.length,
    head: file.bytes.slice(0, 32),
    width: dimensions?.width,
    height: dimensions?.height,
  });
  if (problems.length) {
    const code =
      problems[0].code === "UNSUPPORTED_MEDIA_TYPE" || problems[0].code === "TYPE_MISMATCH"
        ? "UNSUPPORTED_MEDIA_TYPE"
        : problems[0].code === "PAYLOAD_TOO_LARGE"
          ? "PAYLOAD_TOO_LARGE"
          : "VALIDATION_FAILED";
    throw new AppError(code, {
      message: problems.map((problem) => problem.message).join(" "),
      fieldErrors: { file: problems.map((problem) => problem.message) },
    });
  }

  const path = buildStoragePath(file.name, file.type, deps.newId(), deps.now());
  await deps.storage.upload(path, file.bytes, file.type);
  let asset: MediaAsset;
  try {
    asset = await deps.store.insertMedia({
      path,
      mime_type: file.type,
      size_bytes: file.bytes.length,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
      alt_text: isImage && meta.decorative ? null : alt || null,
      decorative: isImage && meta.decorative,
    });
  } catch (error) {
    await deps.storage.remove(path).catch(() => undefined);
    throw error;
  }
  await deps.audit({
    event: "media.uploaded",
    resourceId: asset.id,
    metadata: { mimeType: file.type, size: file.bytes.length },
  });
  return asset;
}
