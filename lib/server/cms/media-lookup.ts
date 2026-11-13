/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : media-lookup.ts
 Descrição    : Converte arquivos da biblioteca de mídia no valor gravado nos campos de imagem.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import type { ImageValue } from "@/lib/domain/content/fields";
import type { MediaAsset } from "./store";

export const toImageValue = (asset: MediaAsset): ImageValue => ({
  src: asset.src,
  alt: asset.decorative ? "" : asset.alt,
  ...(asset.width ? { width: asset.width } : {}),
  ...(asset.height ? { height: asset.height } : {}),
});

/** Só imagem: PDF da biblioteca não entra em campo de imagem. */
export function mediaLookup(media: readonly MediaAsset[]) {
  const byId = new Map(media.map((asset) => [asset.id, asset]));
  return (id: string): ImageValue | undefined => {
    const asset = byId.get(id);
    return asset?.mimeType.startsWith("image/") ? toImageValue(asset) : undefined;
  };
}
