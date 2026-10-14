/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : og.ts
 Descrição    : Logotipo e fontes usados nas imagens Open Graph.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (SEO da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 } as const;

let cachedLogo: string | undefined;
let cachedFonts: { name: string; data: Buffer; weight: 700 | 900; style: "normal" }[] | undefined;

/** Poppins Bold/Black (OFL, em assets/fonts) para as imagens de compartilhamento. */
export async function ogFonts() {
  if (!cachedFonts) {
    const [bold, black] = await Promise.all([
      readFile(join(process.cwd(), "assets", "fonts", "Poppins-Bold.ttf")),
      readFile(join(process.cwd(), "assets", "fonts", "Poppins-Black.ttf")),
    ]);
    cachedFonts = [
      { name: "Poppins", data: bold, weight: 700, style: "normal" },
      { name: "Poppins", data: black, weight: 900, style: "normal" },
    ];
  }
  return cachedFonts;
}

/** Logotipo horizontal em data URL para as imagens Open Graph. */
export async function ogLogoDataUrl(): Promise<string> {
  if (!cachedLogo) {
    const file = await readFile(join(process.cwd(), "public", "brand", "logo-horizontal.png"));
    cachedLogo = `data:image/png;base64,${file.toString("base64")}`;
  }
  return cachedLogo;
}
