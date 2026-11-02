/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : media-storage.ts
 Descrição    : Bucket de mídia do Supabase: token de envio direto, leitura do início e remoção.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinícius Nishimura Reis  Criação inicial (TECH-13, #313).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MEDIA_BUCKET, publicMediaUrl } from "@/lib/domain/media/policy";
import { AppError } from "../errors";
import type { MediaStorage, StoredObject } from "./media-service";

const unavailable = (cause?: unknown) =>
  new AppError("SERVICE_UNAVAILABLE", { message: "Não foi possível conferir o arquivo enviado.", cause });

/**
 * Baixa só o início do objeto (o bucket é público) e devolve o tamanho total e o tipo gravados.
 * Se o servidor ignorar o Range, o corpo inteiro é no máximo o limite do bucket (10 MB).
 */
export async function readObjectStart(url: string, limit: number): Promise<StoredObject | null> {
  const response = await fetch(url, { headers: { Range: `bytes=0-${limit - 1}` }, cache: "no-store" });
  if (response.status === 404 || response.status === 400) return null;
  const contentType = response.headers.get("content-type") ?? "";
  // Range fora do arquivo: só acontece com arquivo vazio, recusado adiante pela validação.
  if (response.status === 416) return { bytes: new Uint8Array(), size: 0, contentType };
  if (!response.ok) throw unavailable(`status ${response.status}`);

  const body = new Uint8Array(await response.arrayBuffer());
  if (response.status !== 206) return { bytes: body.slice(0, limit), size: body.length, contentType };
  const total = Number(response.headers.get("content-range")?.match(/\/(\d+)$/)?.[1]);
  if (!Number.isSafeInteger(total)) throw unavailable("content-range inválido");
  return { bytes: body, size: total, contentType };
}

/** Bucket "media" com a sessão de quem envia: as políticas media:* do Storage continuam valendo. */
export function createSupabaseMediaStorage(client: SupabaseClient, supabaseUrl: string): MediaStorage {
  const bucket = client.storage.from(MEDIA_BUCKET);
  return {
    async createUploadToken(path) {
      const { data, error } = await bucket.createSignedUploadUrl(path);
      if (error || !data) {
        throw new AppError("SERVICE_UNAVAILABLE", {
          message: "Não foi possível preparar o envio. Tente de novo.",
          cause: error,
        });
      }
      return data.token;
    },
    readStart: (path, limit) => readObjectStart(publicMediaUrl(supabaseUrl, path), limit),
    async remove(path) {
      await bucket.remove([path]);
    },
  };
}
