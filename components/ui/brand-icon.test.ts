/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : brand-icon.test.ts
 Descrição    : Confere que todo ícone oferecido no CMS existe em todas as cores.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
──────────────────────────────────────────────────────────────────────────────
*/

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND_ICONS, isBrandIcon } from "@/lib/domain/content/icons";
import { BRAND_ICON_COLORS } from "./brand-icon";

const STICKERS = [
  "benja",
  "fofoca-aceitas",
  "pokkk",
  "poupa-meu-tempo",
  "publi-amigos-v1",
  "publi-amigos-v2",
  "rplovers",
  "ta-no-briefing",
];
const STICKER_COLORS = ["verde", "lima", "laranja", "rosa", "azul"];

const brandFolder = (name: string) => join(process.cwd(), "public", "brand", name);

describe("marca em vetor", () => {
  it("todo sticker existe em todas as cores", () => {
    const missing = STICKERS.flatMap((name) =>
      STICKER_COLORS.map((color) => `${name}-${color}.svg`).filter(
        (file) => !existsSync(join(brandFolder("stickers"), file)),
      ),
    );
    expect(missing).toEqual([]);
  });

  it("os ícones de redes sociais existem", () => {
    const missing = ["instagram", "tiktok", "linkedin"].filter(
      (name) => !existsSync(join(brandFolder("social"), `${name}.svg`)),
    );
    expect(missing).toEqual([]);
  });

  it("os SVGs são só vetor: sem imagem embutida, script, texto ou referência externa", () => {
    const unsafe = ["icons", "stickers", "social"].flatMap((folder) =>
      readdirSync(brandFolder(folder))
        .filter((file) => {
          const svg = readFileSync(join(brandFolder(folder), file), "utf8");
          return (
            !/viewBox=/.test(svg) ||
            /<(script|image|text|foreignObject)\b|\son\w+=|https?:\/\/(?!www\.w3\.org)/.test(svg)
          );
        })
        .map((file) => `${folder}/${file}`),
    );
    expect(unsafe).toEqual([]);
  });
});

describe("ícones do CMS (ADM-07)", () => {
  it("cada ícone oferecido tem o arquivo SVG em todas as cores", () => {
    // `interrogacao` não está no CMS, mas a página do case o usa no bloco "Desafio".
    const missing = [...BRAND_ICONS, "interrogacao"].flatMap((name) =>
      BRAND_ICON_COLORS.map((color) => `${name}-${color}.svg`).filter(
        (file) => !existsSync(join(process.cwd(), "public", "brand", "icons", file)),
      ),
    );
    expect(missing).toEqual([]);
  });

  it("recusa nome fora da lista", () => {
    expect(isBrandIcon("raio")).toBe(true);
    expect(isBrandIcon("foguete")).toBe(false);
  });
});
