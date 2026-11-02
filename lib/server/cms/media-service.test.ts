/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : media-service.test.ts
 Descrição    : Testes do envio de mídia do CMS com Storage e store em memória.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
 02/11/2026 Vinícius Nishimura Reis  Testes dos passos de autorizar e conferir o envio (TECH-13, #313).
──────────────────────────────────────────────────────────────────────────────
*/

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/domain/auth/rbac";
import type { AuditInput } from "../audit";
import { finalizeMediaUpload, prepareMediaUpload, type MediaStorage, type StoredObject } from "./media-service";
import { createMemoryCmsStore } from "./memory-store";

const webp = new Uint8Array(readFileSync(join(process.cwd(), "public/brand/cases/fecap.webp")));
const MB = 1024 * 1024;
const UUID = "11111111-2222-4333-8444-555555555555";
const PATH = `2026/10/${UUID}-capa-da-campanha.webp`;
const PDF_PATH = `2026/10/${UUID}-release.pdf`;

const stored = (bytes: Uint8Array, contentType: string, size = bytes.length): StoredObject => ({
  bytes,
  contentType,
  size,
});

function setup(options: { failInsert?: boolean; failRead?: boolean } = {}) {
  const { store, tables } = createMemoryCmsStore();
  if (options.failInsert) store.insertMedia = async () => Promise.reject(new Error("banco fora"));
  const objects = new Map<string, StoredObject>();
  const limits: number[] = [];
  const storage: MediaStorage = {
    createUploadToken: async (path) => `token:${path}`,
    readStart: async (path, limit) => {
      if (options.failRead) throw new Error("Storage fora");
      limits.push(limit);
      const object = objects.get(path);
      return object ? { ...object, bytes: object.bytes.slice(0, limit) } : null;
    },
    remove: async (path) => void objects.delete(path),
  };
  const audits: AuditInput[] = [];
  const deps = {
    store,
    storage,
    audit: async (input: AuditInput) => void audits.push(input),
    invalidate: () => {},
    now: () => new Date("2026-10-26T15:00:00.000Z"),
    newId: () => UUID,
  };
  return { deps, tables, objects, audits, limits, actor: (role: Role) => ({ id: "u1", role }) };
}

const request = (overrides: Partial<Parameters<typeof prepareMediaUpload>[2]> = {}) => ({
  name: "Capa da Campanha.webp",
  type: "image/webp",
  size: webp.length,
  alt: "Capa da campanha",
  decorative: false,
  ...overrides,
});
const upload = (overrides: Partial<Parameters<typeof finalizeMediaUpload>[2]> = {}) => ({
  path: PATH,
  name: "Capa da Campanha.webp",
  type: "image/webp",
  alt: "Capa da campanha",
  decorative: false,
  ...overrides,
});

describe("passo 1: autorizar o envio (TECH-13, #313)", () => {
  it("devolve caminho imprevisível e token, sem receber o arquivo", async () => {
    const env = setup();
    await expect(prepareMediaUpload(env.deps, env.actor("editor"), request())).resolves.toEqual({
      path: PATH,
      token: `token:${PATH}`,
    });
  });

  it("aceita PDF de 8 MB e imagem de 5 MB; recusa o que passa dos limites do ADR-0005", async () => {
    const env = setup();
    const editor = env.actor("editor");
    await expect(
      prepareMediaUpload(env.deps, editor, request({ name: "r.pdf", type: "application/pdf", size: 8 * MB, alt: "" })),
    ).resolves.toMatchObject({ path: expect.stringMatching(/\.pdf$/) });
    await expect(prepareMediaUpload(env.deps, editor, request({ size: 5 * MB }))).resolves.toBeDefined();
    await expect(prepareMediaUpload(env.deps, editor, request({ size: 5 * MB + 1 }))).rejects.toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
      fieldErrors: { file: [expect.stringContaining("5 MB")] },
    });
    await expect(
      prepareMediaUpload(env.deps, editor, request({ type: "application/pdf", size: 10 * MB + 1 })),
    ).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
  });

  it("recusa formato não aceito (SVG) e imagem informativa sem texto alternativo", async () => {
    const env = setup();
    await expect(
      prepareMediaUpload(env.deps, env.actor("editor"), request({ type: "image/svg+xml" })),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_MEDIA_TYPE" });
    await expect(prepareMediaUpload(env.deps, env.actor("editor"), request({ alt: "" }))).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      fieldErrors: { alt: [expect.stringMatching(/texto alternativo/)] },
    });
    await expect(
      prepareMediaUpload(env.deps, env.actor("editor"), request({ alt: "", decorative: true })),
    ).resolves.toBeDefined();
  });

  it("leitor não recebe autorização", async () => {
    const env = setup();
    await expect(prepareMediaUpload(env.deps, env.actor("viewer"), request())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("passo 3: conferir e registrar (ADM-08 / ARC-10 / TECH-13)", () => {
  it("registra com dimensões e tamanho real, e audita", async () => {
    const env = setup();
    env.objects.set(PATH, stored(webp, "image/webp"));
    const asset = await finalizeMediaUpload(env.deps, env.actor("editor"), upload());
    expect(asset).toMatchObject({ alt: "Capa da campanha", width: 1200, height: 750, mimeType: "image/webp" });
    expect(env.tables.media_assets[0]).toMatchObject({ path: PATH, size_bytes: webp.length });
    expect(env.audits).toEqual([expect.objectContaining({ event: "media.uploaded", resourceId: asset.id })]);
    expect(env.objects.has(PATH)).toBe(true);
  });

  it("PDF de 8 MB: lê só o início e registra o tamanho total", async () => {
    const env = setup();
    env.objects.set(PDF_PATH, stored(new TextEncoder().encode("%PDF-1.7\n"), "application/pdf", 8 * MB));
    await finalizeMediaUpload(
      env.deps,
      env.actor("editor"),
      upload({ path: PDF_PATH, name: "release.pdf", type: "application/pdf", alt: "" }),
    );
    expect(env.limits[0]).toBeLessThan(MB);
    expect(env.tables.media_assets[0]).toMatchObject({ path: PDF_PATH, size_bytes: 8 * MB });
  });

  it("assinatura falsa é recusada e o arquivo não sobra no bucket", async () => {
    const env = setup();
    env.objects.set(PATH, stored(new TextEncoder().encode("<svg onload=alert(1)>"), "image/webp"));
    await expect(finalizeMediaUpload(env.deps, env.actor("editor"), upload())).rejects.toMatchObject({
      code: "UNSUPPORTED_MEDIA_TYPE",
    });
    expect(env.objects.has(PATH)).toBe(false);
    expect(env.tables.media_assets).toEqual([]);
    expect(env.audits).toEqual([]);
  });

  it("assinatura válida, mas gravada com outro tipo: também recusa e apaga", async () => {
    const env = setup();
    env.objects.set(PATH, stored(webp, "application/pdf"));
    await expect(finalizeMediaUpload(env.deps, env.actor("editor"), upload())).rejects.toMatchObject({
      code: "UNSUPPORTED_MEDIA_TYPE",
    });
    expect(env.objects.has(PATH)).toBe(false);
  });

  it("o tamanho declarado no passo 1 não vale: o que manda é o que chegou", async () => {
    const env = setup();
    env.objects.set(PATH, stored(webp, "image/webp", 5 * MB + 1));
    await expect(finalizeMediaUpload(env.deps, env.actor("editor"), upload())).rejects.toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
    });
    expect(env.objects.has(PATH)).toBe(false);
  });

  it("caminho forjado é recusado sem tocar no Storage", async () => {
    const env = setup();
    const path = "/brand/cases/meridiano.webp";
    env.objects.set(path, stored(webp, "image/webp"));
    await expect(finalizeMediaUpload(env.deps, env.actor("admin"), upload({ path }))).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
    expect(env.objects.has(path)).toBe(true);
  });

  it("caminho já registrado nunca é apagado, mesmo com tipo errado na repetição", async () => {
    const env = setup();
    env.objects.set(PATH, stored(webp, "image/webp"));
    const asset = await finalizeMediaUpload(env.deps, env.actor("admin"), upload());
    env.audits.length = 0;
    env.objects.set(PATH, stored(new TextEncoder().encode("<html>"), "image/webp"));
    await expect(finalizeMediaUpload(env.deps, env.actor("admin"), upload())).resolves.toMatchObject({ id: asset.id });
    expect(env.objects.has(PATH)).toBe(true);
    expect(env.tables.media_assets).toHaveLength(1);
    expect(env.audits).toEqual([]);
  });

  it("arquivo que não chegou: mensagem clara, sem registro", async () => {
    const env = setup();
    await expect(finalizeMediaUpload(env.deps, env.actor("editor"), upload())).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      fieldErrors: { file: [expect.stringContaining("não chegou")] },
    });
    expect(env.tables.media_assets).toEqual([]);
  });

  it("falha ao ler o arquivo: apaga o envio e devolve o erro", async () => {
    const env = setup({ failRead: true });
    env.objects.set(PATH, stored(webp, "image/webp"));
    await expect(finalizeMediaUpload(env.deps, env.actor("editor"), upload())).rejects.toThrow(/Storage fora/);
    expect(env.objects.has(PATH)).toBe(false);
  });

  it("se o registro falhar, o arquivo enviado é apagado do Storage", async () => {
    const env = setup({ failInsert: true });
    env.objects.set(PATH, stored(webp, "image/webp"));
    await expect(finalizeMediaUpload(env.deps, env.actor("editor"), upload())).rejects.toThrow(/banco fora/);
    expect(env.objects.has(PATH)).toBe(false);
    expect(env.audits).toEqual([]);
  });

  it("imagem informativa exige texto alternativo; decorativa não", async () => {
    const env = setup();
    env.objects.set(PATH, stored(webp, "image/webp"));
    await expect(finalizeMediaUpload(env.deps, env.actor("editor"), upload({ alt: "" }))).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
    env.objects.set(PATH, stored(webp, "image/webp"));
    await expect(
      finalizeMediaUpload(env.deps, env.actor("editor"), upload({ alt: "", decorative: true })),
    ).resolves.toMatchObject({ alt: "", decorative: true });
  });

  it("leitor não registra, e o arquivo de quem enviou continua lá", async () => {
    const env = setup();
    env.objects.set(PATH, stored(webp, "image/webp"));
    await expect(finalizeMediaUpload(env.deps, env.actor("viewer"), upload())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(env.objects.has(PATH)).toBe(true);
  });
});
