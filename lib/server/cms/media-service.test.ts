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
import type { Role } from "@/lib/domain/auth/rbac";
import type { AuditInput } from "../audit";
import { registerUploadedMedia, uploadMedia, type MediaStorage } from "./media-service";
import { createMemoryCmsStore } from "./memory-store";

const webp = new Uint8Array(readFileSync(join(process.cwd(), "public/brand/cases/fecap.webp")));
const pdf = new TextEncoder().encode("%PDF-1.7\n");

function setup(options: { failInsert?: boolean } = {}) {
  const { store, tables } = createMemoryCmsStore();
  if (options.failInsert) store.insertMedia = async () => Promise.reject(new Error("banco fora"));
  const objects = new Map<string, number>();
  const storage: MediaStorage = {
    upload: async (path, bytes) => void objects.set(path, bytes.length),
    remove: async (path) => void objects.delete(path),
  };
  const audits: AuditInput[] = [];
  const deps = {
    store,
    storage,
    audit: async (input: AuditInput) => void audits.push(input),
    invalidate: () => {},
    now: () => new Date("2026-10-26T15:00:00.000Z"),
    newId: () => "11111111-2222-4333-8444-555555555555",
  };
  return { deps, tables, objects, audits, actor: (role: Role) => ({ id: "u1", role }) };
}

const file = (overrides: Partial<{ name: string; type: string; bytes: Uint8Array }> = {}) => ({
  name: "Capa da Campanha.webp",
  type: "image/webp",
  bytes: webp,
  ...overrides,
});

describe("envio de mídia (ADM-08 / ARC-10)", () => {
  it("envia, registra com dimensões e caminho imprevisível, e audita", async () => {
    const env = setup();
    const asset = await uploadMedia(env.deps, env.actor("editor"), file(), {
      alt: "Capa da campanha",
      decorative: false,
    });
    expect(asset).toMatchObject({ alt: "Capa da campanha", width: 1200, height: 750, mimeType: "image/webp" });
    expect([...env.objects.keys()]).toEqual(["2026/10/11111111-2222-4333-8444-555555555555-capa-da-campanha.webp"]);
    expect(env.audits).toEqual([expect.objectContaining({ event: "media.uploaded", resourceId: asset.id })]);
  });

  it("imagem informativa exige texto alternativo; decorativa não", async () => {
    const env = setup();
    await expect(
      uploadMedia(env.deps, env.actor("editor"), file(), { alt: "", decorative: false }),
    ).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      fieldErrors: { alt: [expect.stringMatching(/texto alternativo/)] },
    });
    const asset = await uploadMedia(env.deps, env.actor("editor"), file(), { alt: "", decorative: true });
    expect(asset).toMatchObject({ alt: "", decorative: true });
  });

  it("recusa arquivo cujo conteúdo não bate com o tipo (ex.: SVG/HTML renomeado)", async () => {
    const env = setup();
    const fake = file({ name: "x.png", type: "image/png", bytes: new TextEncoder().encode("<svg onload=alert(1)>") });
    await expect(
      uploadMedia(env.deps, env.actor("editor"), fake, { alt: "Imagem", decorative: false }),
    ).rejects.toMatchObject({
      code: "UNSUPPORTED_MEDIA_TYPE",
    });
    await expect(
      uploadMedia(env.deps, env.actor("editor"), file({ type: "image/svg+xml" }), { alt: "Imagem", decorative: false }),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_MEDIA_TYPE" });
    expect(env.objects.size).toBe(0);
  });

  it("remove do Storage um objeto assinado cuja assinatura real é inválida", async () => {
    const env = setup();
    const path = "2026/10/11111111-2222-4333-8444-555555555555-capa.webp";
    env.objects.set(path, 24);
    await expect(
      registerUploadedMedia(
        env.deps,
        env.actor("editor"),
        path,
        file({ bytes: new TextEncoder().encode("<script>fake</script>") }),
        { alt: "Imagem falsa", decorative: false },
      ),
    ).rejects.toMatchObject({ code: "UNSUPPORTED_MEDIA_TYPE" });
    expect(env.objects.has(path)).toBe(false);
  });

  it("registra o tamanho total usando apenas os bytes de cabeçalho baixados", async () => {
    const env = setup();
    const path = "2026/10/11111111-2222-4333-8444-555555555555-release.pdf";
    env.objects.set(path, 8 * 1024 * 1024);
    await registerUploadedMedia(
      env.deps,
      env.actor("editor"),
      path,
      { name: "release.pdf", type: "application/pdf", bytes: pdf, size: 8 * 1024 * 1024 },
      { alt: "", decorative: false },
    );
    expect(env.tables.media_assets[0]).toMatchObject({ path, size_bytes: 8 * 1024 * 1024 });
  });

  it("leitor não envia", async () => {
    const env = setup();
    await expect(
      uploadMedia(env.deps, env.actor("viewer"), file(), { alt: "Capa", decorative: false }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("se o registro falhar, o arquivo enviado é apagado do Storage", async () => {
    const env = setup({ failInsert: true });
    await expect(
      uploadMedia(env.deps, env.actor("editor"), file(), { alt: "Capa", decorative: false }),
    ).rejects.toThrow(/banco fora/);
    expect(env.objects.size).toBe(0);
    expect(env.audits).toEqual([]);
  });
});
