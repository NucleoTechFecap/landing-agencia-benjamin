/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : policy.test.ts
 Descrição    : Testes da política de upload de mídia.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ARC-10).
 27/10/2026 Vinícius Nishimura Reis  Correções da revisão de segurança (TECH-13).
 02/11/2026 Vinícius Nishimura Reis  Limites do ADR-0005, envio declarado e caminho de volta (TECH-13, #313).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import {
  buildStoragePath,
  checkDeclaredUpload,
  isUploadPath,
  publicMediaUrl,
  sniffMimeType,
  validateUpload,
  type UploadCandidate,
} from "./policy";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const PDF = new TextEncoder().encode("%PDF-1.7\n00000000");
const WEBP = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
const AVIF = new Uint8Array([0, 0, 0, 0x1c, ...new TextEncoder().encode("ftypavif"), 0, 0, 0, 0]);
const SVG = new TextEncoder().encode("<svg xmlns='http://");

const candidate = (overrides: Partial<UploadCandidate>): UploadCandidate => ({
  fileName: "capa.png",
  declaredType: "image/png",
  size: 200_000,
  head: PNG,
  width: 2400,
  height: 1350,
  ...overrides,
});

describe("sniffMimeType", () => {
  it("reconhece assinaturas aceitas", () => {
    expect(sniffMimeType(PNG)).toBe("image/png");
    expect(sniffMimeType(JPEG)).toBe("image/jpeg");
    expect(sniffMimeType(PDF)).toBe("application/pdf");
    expect(sniffMimeType(WEBP)).toBe("image/webp");
    expect(sniffMimeType(AVIF)).toBe("image/avif");
    expect(sniffMimeType(SVG)).toBeNull();
  });
});

describe("validateUpload", () => {
  it("aceita imagem válida", () => {
    expect(validateUpload(candidate({}))).toEqual([]);
  });

  it("recusa SVG e formatos não listados", () => {
    expect(validateUpload(candidate({ declaredType: "image/svg+xml", head: SVG }))[0].code).toBe(
      "UNSUPPORTED_MEDIA_TYPE",
    );
    expect(validateUpload(candidate({ declaredType: "video/mp4" }))[0].code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("detecta arquivo disfarçado (extensão/tipo não batem com o conteúdo)", () => {
    expect(validateUpload(candidate({ declaredType: "image/jpeg", head: PNG })).map((p) => p.code)).toContain(
      "TYPE_MISMATCH",
    );
  });

  it("volta aos limites do ADR-0005: imagem até 5 MB e PDF até 10 MB (TECH-13, #313)", () => {
    const pdf = (size: number) => validateUpload(candidate({ declaredType: "application/pdf", head: PDF, size }));
    expect(validateUpload(candidate({ size: 5 * 1024 * 1024 }))).toEqual([]);
    expect(validateUpload(candidate({ size: 5 * 1024 * 1024 + 1 }))[0]).toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
      message: expect.stringContaining("5 MB"),
    });
    expect(pdf(8 * 1024 * 1024)).toEqual([]);
    expect(pdf(10 * 1024 * 1024)).toEqual([]);
    expect(pdf(10 * 1024 * 1024 + 1)[0]).toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
      message: expect.stringContaining("10 MB"),
    });
  });

  it("recusa antes de enviar o que o navegador já declara errado", () => {
    expect(checkDeclaredUpload("application/pdf", 8 * 1024 * 1024)).toBeNull();
    expect(checkDeclaredUpload("image/png", 5 * 1024 * 1024 + 1)?.code).toBe("PAYLOAD_TOO_LARGE");
    expect(checkDeclaredUpload("image/svg+xml", 10)?.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    expect(checkDeclaredUpload("", 10)?.code).toBe("UNSUPPORTED_MEDIA_TYPE");
    expect(checkDeclaredUpload("image/png", 0)?.code).toBe("EMPTY_FILE");
    expect(checkDeclaredUpload("image/png", Number.NaN)?.code).toBe("EMPTY_FILE");
    expect(checkDeclaredUpload("image/png", Number.POSITIVE_INFINITY)?.code).toBe("PAYLOAD_TOO_LARGE");
  });

  it("só aceita de volta um caminho no formato gerado, com a extensão do tipo", () => {
    const uuid = "11111111-2222-4333-8444-555555555555";
    const path = buildStoragePath("Release de Imprensa.pdf", "application/pdf", uuid);
    expect(isUploadPath(path, "application/pdf")).toBe(true);
    expect(isUploadPath(path, "image/png")).toBe(false);
    expect(isUploadPath(path, "image/svg+xml")).toBe(false);
    expect(isUploadPath(`../${path}`, "application/pdf")).toBe(false);
    expect(isUploadPath(`${path}?x=1`, "application/pdf")).toBe(false);
    expect(isUploadPath(`2026/10/${uuid}-a/../../b.pdf`, "application/pdf")).toBe(false);
    expect(isUploadPath("/brand/cases/meridiano.webp", "image/webp")).toBe(false);
  });

  it("limita dimensões de imagem e rejeita arquivo vazio", () => {
    expect(validateUpload(candidate({ width: 6000 }))[0].code).toBe("DIMENSIONS_TOO_LARGE");
    expect(validateUpload(candidate({ size: 0 }))[0].code).toBe("EMPTY_FILE");
  });
});

describe("buildStoragePath / publicMediaUrl", () => {
  it("gera caminho por ano/mês com UUID e nome normalizado", () => {
    const path = buildStoragePath(
      "Campanha Aventura de Construir!.PNG",
      "image/png",
      "6f1c",
      new Date("2026-10-13T12:00:00Z"),
    );
    expect(path).toBe("2026/10/6f1c-campanha-aventura-de-construir.png");
  });

  it("usa a extensão do tipo real, não a do nome", () => {
    expect(buildStoragePath("foto.jpeg", "image/webp", "id", new Date("2026-01-05T00:00:00Z"))).toBe(
      "2026/01/id-foto.webp",
    );
  });

  it("monta a URL pública do bucket", () => {
    expect(publicMediaUrl("https://abc.supabase.co/", "2026/10/id-foto.webp")).toBe(
      "https://abc.supabase.co/storage/v1/object/public/media/2026/10/id-foto.webp",
    );
  });
});
