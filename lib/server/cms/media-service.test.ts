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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
 02/11/2026 Vinícius Nishimura Reis  Testes dos passos de autorizar e conferir o envio (TECH-13, #313).
 04/11/2026 Vinícius Nishimura Reis  Registro do arquivo recusado que não sai do bucket (SEG-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import type { Role } from "@/lib/domain/auth/rbac";
import type { AuditInput } from "../audit";
import {
  deleteMedia,
  finalizeMediaUpload,
  prepareMediaUpload,
  updateMediaDetails,
  type MediaStorage,
  type StoredObject,
} from "./media-service";
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

  describe("arquivo recusado que não sai do bucket (SEG-05)", () => {
    const warnings = () => warn.mock.calls.map(([line]) => JSON.parse(String(line)));
    let warn: MockInstance<typeof console.warn>;
    beforeEach(() => {
      warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    });
    afterEach(() => warn.mockRestore());

    it("registra como achar o objeto, sem o nome do arquivo, e quem envia vê o motivo da recusa", async () => {
      const env = setup();
      env.deps.storage.remove = async () => Promise.reject(new Error("política do Storage recusou"));
      env.objects.set(PATH, stored(new TextEncoder().encode("<svg onload=alert(1)>"), "image/webp"));
      await expect(finalizeMediaUpload(env.deps, env.actor("editor"), upload())).rejects.toMatchObject({
        code: "UNSUPPORTED_MEDIA_TYPE",
      });
      expect(warnings()).toEqual([
        expect.objectContaining({
          level: "warn",
          event: "media.discard.failed",
          objectId: UUID,
          error: expect.objectContaining({ message: "política do Storage recusou" }),
        }),
      ]);
      expect(JSON.stringify(warnings())).not.toContain("capa-da-campanha");
    });

    it("falha ao gravar o registro: o erro original sobe e a limpeza que falhou é registrada", async () => {
      const env = setup({ failInsert: true });
      env.deps.storage.remove = async () => Promise.reject(new Error("Storage fora"));
      env.objects.set(PATH, stored(webp, "image/webp"));
      await expect(finalizeMediaUpload(env.deps, env.actor("editor"), upload())).rejects.toThrow("banco fora");
      expect(warnings()).toEqual([expect.objectContaining({ event: "media.discard.failed", objectId: UUID })]);
    });

    it("limpeza que funciona não registra nada", async () => {
      const env = setup();
      env.objects.set(PATH, stored(new TextEncoder().encode("<svg onload=alert(1)>"), "image/webp"));
      await expect(finalizeMediaUpload(env.deps, env.actor("editor"), upload())).rejects.toBeDefined();
      expect(env.objects.has(PATH)).toBe(false);
      expect(warn).not.toHaveBeenCalled();
    });
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

describe("biblioteca: exclusão e edição (ADM-09)", () => {
  const VERSION = "2026-10-26T15:00:00.000Z";
  const row = (id: string, over: Record<string, unknown> = {}) => ({
    id,
    path: `2026/10/${UUID}-${id}.webp`,
    mime_type: "image/webp",
    width: 100,
    height: 100,
    alt_text: "Texto original",
    decorative: false,
    updated_at: VERSION,
    ...over,
  });

  function library(seed: Parameters<typeof createMemoryCmsStore>[0] = {}) {
    const { store, tables } = createMemoryCmsStore({ media_assets: [row("livre")], ...seed });
    const removed: string[] = [];
    const invalidated: { entity: string; slug?: string }[] = [];
    const audits: AuditInput[] = [];
    const storage: MediaStorage = {
      createUploadToken: async (path) => path,
      readStart: async () => null,
      remove: async (path) => void removed.push(path),
    };
    const deps = {
      store,
      storage,
      audit: async (input: AuditInput) => void audits.push(input),
      invalidate: (change: { entity: string; slug?: string }) => void invalidated.push(change),
      now: () => new Date(VERSION),
    };
    return { deps, tables, removed, audits, invalidated };
  }
  const actor = (role: Role) => ({ id: "u1", role });
  const serviceUsing = (id: string, status = "draft") => ({
    id: "s1",
    slug: "social",
    name: "Social",
    summary: "",
    description: "",
    examples: [],
    icon: null,
    featured: false,
    sort_order: 0,
    image_media_id: id,
    status,
    provisional: false,
    published_at: status === "published" ? VERSION : null,
    archived_at: null,
    updated_at: VERSION,
  });
  const teamPage = (src: string, status = "draft") => ({
    pages: [
      {
        id: "p1",
        slug: "sobre",
        title: "Sobre",
        description: null,
        status,
        provisional: false,
        published_at: status === "published" ? VERSION : null,
        archived_at: null,
        updated_at: VERSION,
      },
    ],
    blocks: [
      {
        id: "b1",
        page_id: "p1",
        type: "team",
        sort_order: 0,
        content: { members: [{ name: "Ana", photo: { src, alt: "Ana sorrindo" } }] },
      },
    ],
  });
  const photoUrl = `https://projeto.supabase.co/storage/v1/object/public/media/2026/10/${UUID}-foto.webp`;

  describe("deleteMedia", () => {
    it("administrador exclui arquivo sem uso: sai do banco e do bucket, com auditoria crítica", async () => {
      const env = library();
      await expect(deleteMedia(env.deps, actor("admin"), "livre")).resolves.toEqual([]);
      expect(env.tables.media_assets).toEqual([]);
      expect(env.removed).toEqual([`2026/10/${UUID}-livre.webp`]);
      expect(env.audits).toMatchObject([{ event: "media.deleted", resourceId: "livre", outcome: "success" }]);
    });

    it.each(["editor", "viewer"] as const)("%s não exclui, nem toca no banco ou no bucket", async (role) => {
      const env = library();
      await expect(deleteMedia(env.deps, actor(role), "livre")).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(env.tables.media_assets).toHaveLength(1);
      expect(env.removed).toEqual([]);
      expect(env.audits).toEqual([]);
    });

    it("arquivo inexistente vira NOT_FOUND", async () => {
      await expect(deleteMedia(library().deps, actor("admin"), "nada")).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("arquivo em uso é recusado com a lista de usos, sem apagar nada", async () => {
      const env = library({ services: [serviceUsing("livre")] as never });
      await expect(deleteMedia(env.deps, actor("admin"), "livre")).rejects.toMatchObject({
        code: "CONFLICT",
        fieldErrors: { impacto: ['Serviço "Social": imagem (rascunho)'] },
      });
      expect(env.tables.media_assets).toHaveLength(1);
      expect(env.removed).toEqual([]);
      expect(env.audits).toEqual([]);
    });

    it("foto do bloco Nosso time segura a exclusão, mesmo sem FK no banco", async () => {
      const env = library({
        media_assets: [row("foto", { path: `2026/10/${UUID}-foto.webp` })],
        ...teamPage(photoUrl),
      } as never);
      await expect(deleteMedia(env.deps, actor("admin"), "foto")).rejects.toMatchObject({
        code: "CONFLICT",
        fieldErrors: { impacto: ['Página "Sobre": foto do time (rascunho)'] },
      });
      expect(env.removed).toEqual([]);
    });

    it("falha no banco: registra a falha na auditoria e não apaga o arquivo", async () => {
      const env = library();
      env.deps.store.removeMedia = async () => Promise.reject(new Error("banco fora"));
      await expect(deleteMedia(env.deps, actor("admin"), "livre")).rejects.toThrow("banco fora");
      expect(env.removed).toEqual([]);
      expect(env.audits.map((item) => item.outcome)).toEqual(["success", "failure"]);
    });

    it("falha no Storage: o registro já saiu, e o painel avisa do arquivo que sobrou", async () => {
      const env = library();
      env.deps.storage.remove = async () => Promise.reject(new Error("Storage fora"));
      await expect(deleteMedia(env.deps, actor("admin"), "livre")).resolves.toEqual(["media-file-left"]);
      expect(env.tables.media_assets).toEqual([]);
    });

    it("arquivo versionado em /public não passa pelo Storage", async () => {
      const env = library({ media_assets: [row("marca", { path: "/brand/cases/fecap.webp" })] });
      await expect(deleteMedia(env.deps, actor("admin"), "marca")).resolves.toEqual([]);
      expect(env.removed).toEqual([]);
    });
  });

  describe("updateMediaDetails", () => {
    const ref = { id: "livre", expectedUpdatedAt: VERSION };

    it("editor corrige o texto alternativo, sem espaços nas pontas", async () => {
      const env = library();
      await expect(
        updateMediaDetails(env.deps, actor("editor"), ref, { alt: "  Equipe no estúdio ", decorative: false }),
      ).resolves.toEqual([]);
      expect(env.tables.media_assets[0]).toMatchObject({ alt_text: "Equipe no estúdio", decorative: false });
      expect(env.tables.media_assets[0].updated_at).not.toBe(VERSION);
    });

    it("leitor não edita", async () => {
      const env = library();
      await expect(
        updateMediaDetails(env.deps, actor("viewer"), ref, { alt: "Novo texto", decorative: false }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(env.tables.media_assets[0].alt_text).toBe("Texto original");
    });

    it("imagem informativa continua exigindo texto de 3 a 160 caracteres", async () => {
      const env = library();
      for (const alt of ["", "ab", "x".repeat(161)]) {
        await expect(
          updateMediaDetails(env.deps, actor("editor"), ref, { alt, decorative: false }),
        ).rejects.toMatchObject({ code: "VALIDATION_FAILED", fieldErrors: { alt: expect.any(Array) } });
      }
      expect(env.tables.media_assets[0].alt_text).toBe("Texto original");
    });

    it("decorativa sem uso fica sem texto", async () => {
      const env = library();
      await updateMediaDetails(env.deps, actor("editor"), ref, { alt: "ignorado", decorative: true });
      expect(env.tables.media_assets[0]).toMatchObject({ alt_text: null, decorative: true });
    });

    it("rascunho pode usar imagem decorativa, e publicado não", async () => {
      const draft = library({ services: [serviceUsing("livre")] as never });
      await expect(
        updateMediaDetails(draft.deps, actor("editor"), ref, { alt: "", decorative: true }),
      ).resolves.toEqual([]);

      const live = library({ services: [serviceUsing("livre", "published")] as never });
      await expect(
        updateMediaDetails(live.deps, actor("editor"), ref, { alt: "", decorative: true }),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED", fieldErrors: { decorative: expect.any(Array) } });
      expect(live.tables.media_assets[0].decorative).toBe(false);
    });

    it("versão desatualizada é conflito e não sobrescreve", async () => {
      const env = library();
      await expect(
        updateMediaDetails(
          env.deps,
          actor("editor"),
          { id: "livre", expectedUpdatedAt: "2026-01-01T00:00:00.000Z" },
          { alt: "Texto novo", decorative: false },
        ),
      ).rejects.toMatchObject({ code: "CONFLICT" });
      expect(env.tables.media_assets[0].alt_text).toBe("Texto original");
    });

    it("invalida o que está publicado e nada mais", async () => {
      const live = library({ services: [serviceUsing("livre", "published")] as never });
      await updateMediaDetails(live.deps, actor("editor"), ref, { alt: "Texto novo", decorative: false });
      expect(live.invalidated).toEqual([{ entity: "service", slug: "social" }]);

      const draft = library({ services: [serviceUsing("livre")] as never });
      await updateMediaDetails(draft.deps, actor("editor"), ref, { alt: "Texto novo", decorative: false });
      expect(draft.invalidated).toEqual([]);
    });

    it("foto do time: avisa da cópia do texto só quando ele muda, e não vira decorativa", async () => {
      const seed = { media_assets: [row("foto", { path: `2026/10/${UUID}-foto.webp` })], ...teamPage(photoUrl) };
      const foto = { id: "foto", expectedUpdatedAt: VERSION };

      const changed = library(seed as never);
      await expect(
        updateMediaDetails(changed.deps, actor("editor"), foto, { alt: "Ana no estúdio", decorative: false }),
      ).resolves.toEqual(["media-alt-team"]);

      const same = library({ ...seed, media_assets: [row("foto", { path: `2026/10/${UUID}-foto.webp` })] } as never);
      await expect(
        updateMediaDetails(same.deps, actor("editor"), foto, { alt: "Texto original", decorative: false }),
      ).resolves.toEqual([]);

      const decorative = library({
        ...seed,
        media_assets: [row("foto", { path: `2026/10/${UUID}-foto.webp` })],
      } as never);
      await expect(
        updateMediaDetails(decorative.deps, actor("editor"), foto, { alt: "", decorative: true }),
      ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    });
  });
});
