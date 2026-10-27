/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : dimensions.test.ts
 Descrição    : Testes da leitura de dimensões com arquivos reais da marca.

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

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readImageDimensions } from "./dimensions";

const file = (path: string) => new Uint8Array(readFileSync(join(process.cwd(), path)));

describe("readImageDimensions (ADM-08)", () => {
  it("lê PNG e WebP reais do repositório", () => {
    expect(readImageDimensions(file("app/icon.png"), "image/png")).toEqual({ width: 512, height: 512 });
    expect(readImageDimensions(file("public/brand/cases/fecap.webp"), "image/webp")).toEqual({
      width: 1200,
      height: 750,
    });
    expect(readImageDimensions(file("public/brand/icons/estrela-azul.webp"), "image/webp")).toEqual({
      width: 157,
      height: 160,
    });
  });

  it("lê JPEG pelo marcador de início de quadro", () => {
    // SOI + APP0 curto + SOF0 com altura 300 e largura 400.
    const jpeg = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x01, 0x2c, 0x01, 0x90, 0x03, 0x01,
      0x22, 0x00,
    ]);
    expect(readImageDimensions(jpeg, "image/jpeg")).toEqual({ width: 400, height: 300 });
  });

  it("cabeçalho truncado, formato sem leitura ou lixo devolvem null", () => {
    expect(readImageDimensions(new Uint8Array([0x89, 0x50]), "image/png")).toBeNull();
    expect(readImageDimensions(new Uint8Array(64), "image/avif")).toBeNull();
    expect(readImageDimensions(new Uint8Array(64).fill(7), "image/jpeg")).toBeNull();
  });
});
