/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : cms-midia-gestao.test.ts
 Descrição    : Exclusão e edição da biblioteca de mídia contra RLS, FK e Storage reais.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MEDIA_BUCKET } from "@/lib/domain/media/policy";
import { deleteMedia, updateMediaDetails } from "@/lib/server/cms/media-service";
import { createSupabaseMediaStorage } from "@/lib/server/cms/media-storage";
import {
  anonClient,
  cmsDepsFor,
  createTestUser,
  deleteTestUsers,
  hasSupabaseTestEnv,
  must,
  serviceClient,
  testSuffix,
  type TestUser,
} from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

const webp = new Uint8Array(readFileSync(join(process.cwd(), "public/brand/cases/meridiano.webp")));

describe.runIf(hasSupabaseTestEnv)("gestão da biblioteca de mídia (ADM-09)", () => {
  const suffix = testSuffix();
  const users: { admin?: TestUser; editor?: TestUser; viewer?: TestUser } = {};
  const paths: string[] = [];
  const services: string[] = [];
  const pages: string[] = [];

  beforeAll(async () => {
    [users.admin, users.editor, users.viewer] = await Promise.all([
      createTestUser("admin", suffix),
      createTestUser("editor", suffix),
      createTestUser("viewer", suffix),
    ]);
  });

  afterAll(async () => {
    const admin = serviceClient();
    if (services.length) await admin.from("services").delete().in("id", services);
    if (pages.length) await admin.from("pages").delete().in("id", pages);
    if (paths.length) {
      await admin.from("media_assets").delete().in("path", paths);
      await admin.storage.from(MEDIA_BUCKET).remove(paths);
    }
    await deleteTestUsers(Object.values(users));
  });

  const actor = (user: TestUser, role: "admin" | "editor" | "viewer") => ({ id: user.id, role });
  const depsFor = (user: TestUser) => ({
    ...cmsDepsFor(user.client),
    storage: createSupabaseMediaStorage(user.client),
  });
  const inBucket = async (path: string) => {
    const [folder, file] = [path.slice(0, path.lastIndexOf("/")), path.slice(path.lastIndexOf("/") + 1)];
    const { data } = await serviceClient().storage.from(MEDIA_BUCKET).list(folder, { search: file });
    return (data ?? []).some((entry) => entry.name === file);
  };

  async function asset() {
    const path = `2026/11/${crypto.randomUUID()}-gestao-${suffix}.webp`;
    paths.push(path);
    const admin = serviceClient();
    const { error } = await admin.storage.from(MEDIA_BUCKET).upload(path, webp, { contentType: "image/webp" });
    expect(error).toBeNull();
    const row = await must<{ id: string; updated_at: string }>(
      admin
        .from("media_assets")
        .insert({
          path,
          mime_type: "image/webp",
          size_bytes: webp.length,
          width: 1200,
          height: 750,
          alt_text: "Texto original",
          decorative: false,
        })
        .select("id, updated_at")
        .single(),
    );
    return { id: row.id, updatedAt: row.updated_at, path };
  }

  const rowOf = async (id: string) =>
    (await serviceClient().from("media_assets").select("alt_text, decorative").eq("id", id).maybeSingle()).data;

  it("administrador exclui arquivo sem uso: some do banco e do bucket, com auditoria", async () => {
    const file = await asset();
    expect(await inBucket(file.path)).toBe(true);
    await expect(deleteMedia(depsFor(users.admin!), actor(users.admin!, "admin"), file.id)).resolves.toEqual([]);
    expect(await rowOf(file.id)).toBeNull();
    expect(await inBucket(file.path)).toBe(false);
    const events = await must(serviceClient().from("audit_log").select("event, outcome").eq("resource_id", file.id));
    expect(events).toEqual([{ event: "media.deleted", outcome: "success" }]);
  });

  it("editor é barrado no serviço e, indo direto ao banco e ao bucket, pela RLS", async () => {
    const file = await asset();
    const editor = users.editor!;
    await expect(deleteMedia(depsFor(editor), actor(editor, "editor"), file.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(cmsDepsFor(editor.client).store.removeMedia(file.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await editor.client.storage.from(MEDIA_BUCKET).remove([file.path]);
    expect(await rowOf(file.id)).not.toBeNull();
    expect(await inBucket(file.path)).toBe(true);
  });

  it("anônimo não apaga nem altera", async () => {
    const file = await asset();
    const anon = anonClient();
    await anon.from("media_assets").delete().eq("id", file.id);
    await anon.from("media_assets").update({ alt_text: "Invadido" }).eq("id", file.id);
    await anon.storage.from(MEDIA_BUCKET).remove([file.path]);
    expect(await rowOf(file.id)).toMatchObject({ alt_text: "Texto original" });
    expect(await inBucket(file.path)).toBe(true);
  });

  it("arquivo em uso por serviço: o serviço recusa com a lista e a FK segura quem for direto", async () => {
    const file = await asset();
    const service = (await must(
      serviceClient()
        .from("services")
        .insert({ slug: `gestao-${suffix}`, name: "Serviço da gestão", image_media_id: file.id })
        .select("id")
        .single(),
    )) as { id: string };
    services.push(service.id);
    const admin = users.admin!;
    await expect(deleteMedia(depsFor(admin), actor(admin, "admin"), file.id)).rejects.toMatchObject({
      code: "CONFLICT",
      fieldErrors: { impacto: ['Serviço "Serviço da gestão": imagem (rascunho)'] },
    });
    await expect(cmsDepsFor(admin.client).store.removeMedia(file.id)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await rowOf(file.id)).not.toBeNull();
    expect(await inBucket(file.path)).toBe(true);
  });

  it("foto no bloco Nosso time segura a exclusão, mesmo sem FK", async () => {
    const file = await asset();
    const src = serviceClient().storage.from(MEDIA_BUCKET).getPublicUrl(file.path).data.publicUrl;
    const page = (await must(
      serviceClient()
        .from("pages")
        .insert({ slug: `gestao-${suffix}`, title: "Página da gestão" })
        .select("id")
        .single(),
    )) as { id: string };
    pages.push(page.id);
    await must(
      serviceClient()
        .from("blocks")
        .insert({
          page_id: page.id,
          type: "team",
          sort_order: 0,
          content: { members: [{ name: "Ana", photo: { src, alt: "Ana sorrindo" } }] },
        })
        .select("id")
        .single(),
    );
    const admin = users.admin!;
    await expect(deleteMedia(depsFor(admin), actor(admin, "admin"), file.id)).rejects.toMatchObject({
      code: "CONFLICT",
      fieldErrors: { impacto: ['Página "Página da gestão": foto do time (rascunho)'] },
    });
    expect(await inBucket(file.path)).toBe(true);
  });

  it("editor edita o texto; versão desatualizada é conflito; leitor é barrado pela RLS", async () => {
    const file = await asset();
    const editor = users.editor!;
    const ref = { id: file.id, expectedUpdatedAt: file.updatedAt };
    await expect(
      updateMediaDetails(cmsDepsFor(editor.client), actor(editor, "editor"), ref, {
        alt: "Texto corrigido",
        decorative: false,
      }),
    ).resolves.toEqual([]);
    expect(await rowOf(file.id)).toMatchObject({ alt_text: "Texto corrigido" });

    await expect(
      updateMediaDetails(cmsDepsFor(editor.client), actor(editor, "editor"), ref, {
        alt: "Sobrescreveria",
        decorative: false,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(await rowOf(file.id)).toMatchObject({ alt_text: "Texto corrigido" });

    const [current] = (await cmsDepsFor(users.viewer!.client).store.listMedia()).filter((item) => item.id === file.id);
    await expect(
      cmsDepsFor(users.viewer!.client).store.updateMedia(
        file.id,
        { alt_text: "Leitor", decorative: false },
        current.updatedAt,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await rowOf(file.id)).toMatchObject({ alt_text: "Texto corrigido" });
  });
});
