/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Testes de integração
 Arquivo      : cms-midia-direta.test.ts
 Descrição    : Os três passos do envio direto de mídia contra o Storage real, com a RLS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinícius Nishimura Reis  Criação inicial (TECH-13, #313).
──────────────────────────────────────────────────────────────────────────────
*/

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MEDIA_BUCKET } from "@/lib/domain/media/policy";
import { finalizeMediaUpload, prepareMediaUpload } from "@/lib/server/cms/media-service";
import { createSupabaseMediaStorage } from "@/lib/server/cms/media-storage";
import {
  anonClient,
  cmsDepsFor,
  createTestUser,
  deleteTestUsers,
  hasSupabaseTestEnv,
  serviceClient,
  testSuffix,
  type TestUser,
} from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

const MB = 1024 * 1024;
const webp = new Uint8Array(readFileSync(join(process.cwd(), "public/brand/cases/meridiano.webp")));
const pdfOf = (size: number) => {
  const bytes = new Uint8Array(size);
  bytes.set(new TextEncoder().encode("%PDF-1.7\n"));
  return bytes;
};

describe.runIf(hasSupabaseTestEnv)("envio direto de mídia ao Storage (TECH-13, #313)", () => {
  const suffix = testSuffix();
  const users: { editor?: TestUser; viewer?: TestUser } = {};
  const sentPaths: string[] = [];

  beforeAll(async () => {
    [users.editor, users.viewer] = await Promise.all([
      createTestUser("editor", suffix),
      createTestUser("viewer", suffix),
    ]);
  });

  afterAll(async () => {
    const admin = serviceClient();
    if (sentPaths.length) {
      await admin.from("media_assets").delete().in("path", sentPaths);
      await admin.storage.from(MEDIA_BUCKET).remove(sentPaths);
    }
    await deleteTestUsers(Object.values(users));
  });

  const editor = () => ({ id: users.editor!.id, role: "editor" as const });
  const depsFor = (user: TestUser) => ({
    ...cmsDepsFor(user.client),
    storage: createSupabaseMediaStorage(user.client),
    newId: () => crypto.randomUUID(),
  });
  const inBucket = async (path: string) => {
    const [folder, file] = [path.slice(0, path.lastIndexOf("/")), path.slice(path.lastIndexOf("/") + 1)];
    const { data } = await serviceClient().storage.from(MEDIA_BUCKET).list(folder, { search: file });
    return (data ?? []).some((entry) => entry.name === file);
  };

  /** O navegador: pede a autorização e manda os bytes direto ao Storage, com o token. */
  async function send(name: string, type: string, bytes: Uint8Array, alt = "Texto alternativo") {
    const deps = depsFor(users.editor!);
    const meta = { alt, decorative: false };
    const ticket = await prepareMediaUpload(deps, editor(), { name, type, size: bytes.length, ...meta });
    sentPaths.push(ticket.path);
    const { error } = await anonClient()
      .storage.from(MEDIA_BUCKET)
      .uploadToSignedUrl(ticket.path, ticket.token, new Blob([bytes as BlobPart], { type }), { contentType: type });
    expect(error).toBeNull();
    return { deps, meta, path: ticket.path, name, type };
  }

  it("PDF de 8 MB: chega ao bucket e é registrado com o tamanho total", async () => {
    const sent = await send(`release-${suffix}.pdf`, "application/pdf", pdfOf(8 * MB), "");
    const asset = await finalizeMediaUpload(sent.deps, editor(), { ...sent, ...sent.meta });
    expect(asset.mimeType).toBe("application/pdf");
    const row = await serviceClient().from("media_assets").select("size_bytes, path").eq("id", asset.id).single();
    expect(row.data).toEqual({ size_bytes: 8 * MB, path: sent.path });
    expect(await inBucket(sent.path)).toBe(true);
  });

  it("imagem real: lê as dimensões do que chegou ao bucket", async () => {
    const sent = await send(`capa-${suffix}.webp`, "image/webp", webp);
    const asset = await finalizeMediaUpload(sent.deps, editor(), { ...sent, ...sent.meta });
    expect(asset).toMatchObject({ width: 1200, height: 750 });
    expect((await fetch(asset.src)).headers.get("content-type")).toBe("image/webp");
  });

  it("assinatura falsa: é recusada e não sobra no bucket, com a política de quem enviou", async () => {
    const fake = new TextEncoder().encode("<html><script>alert(1)</script></html>");
    const sent = await send(`falsa-${suffix}.webp`, "image/webp", fake);
    expect(await inBucket(sent.path)).toBe(true);
    await expect(finalizeMediaUpload(sent.deps, editor(), { ...sent, ...sent.meta })).rejects.toMatchObject({
      code: "UNSUPPORTED_MEDIA_TYPE",
    });
    expect(await inBucket(sent.path)).toBe(false);
    const rows = await serviceClient().from("media_assets").select("id").eq("path", sent.path);
    expect(rows.data).toEqual([]);
  });

  it("tamanho declarado menor que o real: o que chegou é medido e recusado", async () => {
    const deps = depsFor(users.editor!);
    const meta = { alt: "Imagem grande", decorative: false };
    const name = `grande-${suffix}.png`;
    const ticket = await prepareMediaUpload(deps, editor(), { name, type: "image/png", size: 100, ...meta });
    sentPaths.push(ticket.path);
    const big = new Uint8Array(6 * MB);
    big.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    await anonClient()
      .storage.from(MEDIA_BUCKET)
      .uploadToSignedUrl(ticket.path, ticket.token, new Blob([big], { type: "image/png" }), {
        contentType: "image/png",
      });
    await expect(
      finalizeMediaUpload(deps, editor(), { path: ticket.path, name, type: "image/png", ...meta }),
    ).rejects.toMatchObject({ code: "PAYLOAD_TOO_LARGE" });
    expect(await inBucket(ticket.path)).toBe(false);
  });

  it("o bucket recusa arquivo acima de 10 MB, mesmo com autorização", async () => {
    const deps = depsFor(users.editor!);
    const name = `enorme-${suffix}.pdf`;
    const ticket = await prepareMediaUpload(deps, editor(), {
      name,
      type: "application/pdf",
      size: 100,
      alt: "",
      decorative: false,
    });
    sentPaths.push(ticket.path);
    const { error } = await anonClient()
      .storage.from(MEDIA_BUCKET)
      .uploadToSignedUrl(
        ticket.path,
        ticket.token,
        new Blob([pdfOf(11 * MB) as BlobPart], { type: "application/pdf" }),
        {
          contentType: "application/pdf",
        },
      );
    expect(error).not.toBeNull();
    expect(await inBucket(ticket.path)).toBe(false);
  });

  it("o token vale uma vez e só para aquele caminho", async () => {
    const sent = await send(`uma-vez-${suffix}.webp`, "image/webp", webp);
    const again = await anonClient()
      .storage.from(MEDIA_BUCKET)
      .uploadToSignedUrl(sent.path, "token-invalido", new Blob([webp as BlobPart], { type: "image/webp" }), {
        contentType: "image/webp",
      });
    expect(again.error).not.toBeNull();
  });

  it("leitor: a política do Storage barra o pedido de token direto", async () => {
    const { error } = await users
      .viewer!.client.storage.from(MEDIA_BUCKET)
      .createSignedUploadUrl(`2026/11/00000000-0000-4000-8000-000000000000-invasao-${suffix}.webp`);
    expect(error).not.toBeNull();
  });
});
