/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : policy.ts
 Descrição    : Política de mídia: formatos, limites, assinatura de bytes, caminhos e URLs do Storage.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 27/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ARC-10).
 27/10/2026 Vinícius Nishimura Reis  Correções da revisão de segurança (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

import { slugify } from "../content/slug";

/** Bucket do Supabase Storage para mídia do CMS (ARC-10). */
export const MEDIA_BUCKET = "media";

export type MediaKind = "image" | "document";

export interface MediaRule {
  kind: MediaKind;
  extension: string;
  maxBytes: number;
}

const MB = 1024 * 1024;

/**
 * Formatos aceitos no upload. SVG fica de fora (pode carregar script — risco de XSS);
 * ícones vetoriais oficiais vêm do repositório (public/brand). Vídeos entram como link
 * externo (YouTube/Vimeo/Instagram), não como arquivo.
 */
export const MEDIA_RULES: Readonly<Record<string, MediaRule>> = {
  "image/jpeg": { kind: "image", extension: "jpg", maxBytes: 5 * MB },
  "image/png": { kind: "image", extension: "png", maxBytes: 5 * MB },
  "image/webp": { kind: "image", extension: "webp", maxBytes: 5 * MB },
  "image/avif": { kind: "image", extension: "avif", maxBytes: 5 * MB },
  "application/pdf": { kind: "document", extension: "pdf", maxBytes: 10 * MB },
};

/**
 * Limite do envio pelo painel. O arquivo viaja no corpo da Server Action, e a Vercel recusa
 * corpo acima de 4,5 MB antes de a action rodar, sem a mensagem de validação (TECH-13). Vale
 * até o envio ir direto do navegador ao Storage; MEDIA_RULES continua sendo o limite do banco.
 */
export const PANEL_UPLOAD_MAX_BYTES = 4 * MB;

/** Maior lado aceito para imagens (px); acima disso o CMS pede para reduzir antes de enviar. */
export const MAX_IMAGE_DIMENSION = 4000;
/** Largura recomendada de exportação para fotos de capa/galeria (UX-14). */
export const RECOMMENDED_IMAGE_WIDTH = 2400;

export type MediaProblem =
  | { code: "UNSUPPORTED_MEDIA_TYPE"; message: string }
  | { code: "PAYLOAD_TOO_LARGE"; message: string }
  | { code: "TYPE_MISMATCH"; message: string }
  | { code: "EMPTY_FILE"; message: string }
  | { code: "DIMENSIONS_TOO_LARGE"; message: string };

/** Identifica o tipo real do arquivo pelos primeiros bytes (assinatura), sem confiar na extensão. */
export function sniffMimeType(bytes: Uint8Array): string | null {
  const startsWith = (...signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (startsWith(0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf";
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
  if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "image/avif";
  return null;
}

export interface UploadCandidate {
  fileName: string;
  /** Tipo declarado pelo navegador (não confiável). */
  declaredType: string;
  size: number;
  /** Primeiros bytes do arquivo (≥ 16) para detecção da assinatura. */
  head: Uint8Array;
  width?: number;
  height?: number;
}

/** Valida um upload antes de enviá-lo ao Storage. Retorna os problemas encontrados. */
export function validateUpload(candidate: UploadCandidate): MediaProblem[] {
  if (candidate.size === 0) return [{ code: "EMPTY_FILE", message: "Arquivo vazio." }];

  const rule = MEDIA_RULES[candidate.declaredType];
  if (!rule) {
    return [{ code: "UNSUPPORTED_MEDIA_TYPE", message: "Formato não aceito. Use JPG, PNG, WebP, AVIF ou PDF." }];
  }

  const problems: MediaProblem[] = [];
  const sniffed = sniffMimeType(candidate.head);
  if (sniffed !== candidate.declaredType) {
    problems.push({ code: "TYPE_MISMATCH", message: "O conteúdo do arquivo não corresponde ao formato informado." });
  }
  const maxBytes = Math.min(rule.maxBytes, PANEL_UPLOAD_MAX_BYTES);
  if (candidate.size > maxBytes) {
    problems.push({ code: "PAYLOAD_TOO_LARGE", message: uploadTooLargeMessage(maxBytes) });
  }
  if (
    rule.kind === "image" &&
    ((candidate.width ?? 0) > MAX_IMAGE_DIMENSION || (candidate.height ?? 0) > MAX_IMAGE_DIMENSION)
  ) {
    problems.push({
      code: "DIMENSIONS_TOO_LARGE",
      message: `Reduza a imagem para no máximo ${MAX_IMAGE_DIMENSION} px no maior lado.`,
    });
  }
  return problems;
}

/** Mensagem de arquivo grande demais, a mesma no navegador e no servidor. */
export function uploadTooLargeMessage(maxBytes: number = PANEL_UPLOAD_MAX_BYTES): string {
  return `Arquivo maior que ${Math.round(maxBytes / MB)} MB. Reduza o arquivo (para imagens, exporte em WebP) e envie de novo.`;
}

/**
 * Caminho no bucket: `AAAA/MM/<uuid>-<nome-normalizado>.<ext>`. O UUID torna a URL
 * imprevisível e evita colisão; o nome normalizado ajuda a reconhecer o arquivo no CMS.
 */
export function buildStoragePath(fileName: string, mimeType: string, uuid: string, now: Date = new Date()): string {
  const rule = MEDIA_RULES[mimeType];
  if (!rule) throw new Error(`Tipo de mídia não suportado: ${mimeType}`);
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const safeName = slugify(baseName).slice(0, 60) || "arquivo";
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}/${month}/${uuid}-${safeName}.${rule.extension}`;
}

/** URL pública de um objeto do bucket de mídia. */
export function publicMediaUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${MEDIA_BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}
