/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : dimensions.ts
 Descrição    : Lê largura e altura de imagens PNG, JPEG e WebP pelo cabeçalho do arquivo.

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

export interface Dimensions {
  width: number;
  height: number;
}

/*
 * Leitura mínima do cabeçalho, sem dependência de biblioteca de imagem: basta para guardar
 * as dimensões na biblioteca de mídia (layout sem salto no next/image) e aplicar o limite de
 * 4000 px (ADR-0005). Formato desconhecido ou cabeçalho truncado devolve null — o upload
 * continua, só sem dimensões (as colunas aceitam nulo). AVIF fica sem leitura no MVP.
 */
export function readImageDimensions(bytes: Uint8Array, mimeType: string): Dimensions | null {
  try {
    if (mimeType === "image/png") return png(bytes);
    if (mimeType === "image/jpeg") return jpeg(bytes);
    if (mimeType === "image/webp") return webp(bytes);
  } catch {
    return null;
  }
  return null;
}

const u16be = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1];
const u32be = (b: Uint8Array, i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const u16le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u24le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);

function valid(width: number, height: number): Dimensions | null {
  return width > 0 && height > 0 ? { width, height } : null;
}

/** PNG: o primeiro chunk é IHDR, com largura e altura em 32 bits big-endian. */
function png(b: Uint8Array): Dimensions | null {
  if (b.length < 24) return null;
  return valid(u32be(b, 16), u32be(b, 20));
}

/** JPEG: percorre os marcadores até um SOF (início de quadro), que traz altura e largura. */
function jpeg(b: Uint8Array): Dimensions | null {
  let offset = 2;
  while (offset + 9 < b.length) {
    if (b[offset] !== 0xff) return null;
    const marker = b[offset + 1];
    const length = u16be(b, offset + 2);
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isStartOfFrame) return valid(u16be(b, offset + 7), u16be(b, offset + 5));
    offset += 2 + length;
  }
  return null;
}

/** WebP: VP8 (com perdas), VP8L (sem perdas) ou VP8X (estendido). */
function webp(b: Uint8Array): Dimensions | null {
  if (b.length < 30) return null;
  const chunk = String.fromCharCode(b[12], b[13], b[14], b[15]);
  if (chunk === "VP8 ") return valid(u16le(b, 26) & 0x3fff, u16le(b, 28) & 0x3fff);
  if (chunk === "VP8L") {
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    return valid((bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1);
  }
  if (chunk === "VP8X") return valid(u24le(b, 24) + 1, u24le(b, 27) + 1);
  return null;
}
