/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : cms-paginas.test.ts
 Descrição    : Páginas e blocos do CMS contra o Supabase local, com RLS real.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { BlockFormInput } from "@/lib/domain/content/block-input";
import { runContentCommand, saveContent } from "@/lib/server/cms/content-service";
import { PAGE } from "@/lib/server/cms/entities";
import { changeBlock, saveBlock } from "@/lib/server/cms/page-blocks";
import { createSupabaseCmsStore } from "@/lib/server/cms/supabase-store";
import { fetchPage } from "@/lib/server/content/supabase/queries";
import {
  anonClient,
  cmsDepsFor,
  createTestUser,
  deleteTestUsers,
  hasSupabaseTestEnv,
  serviceClient,
  supabaseTestEnv,
  testSuffix,
  type TestUser,
} from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

const form = (partial: Partial<BlockFormInput> = {}): BlockFormInput => ({
  fields: {},
  paragraphs: [],
  items: [],
  members: [],
  ...partial,
});

describe.runIf(hasSupabaseTestEnv)("CMS de páginas no Supabase (ADM-05)", () => {
  const suffix = testSuffix();
  const slug = `pagina-cms-${suffix}`;
  const users: { editor?: TestUser; viewer?: TestUser; admin?: TestUser } = {};
  let pageId = "";

  beforeAll(async () => {
    [users.editor, users.viewer, users.admin] = await Promise.all([
      createTestUser("editor", suffix),
      createTestUser("viewer", suffix),
      createTestUser("admin", suffix),
    ]);
  });

  afterAll(async () => {
    await serviceClient().from("pages").delete().eq("slug", slug);
    await deleteTestUsers(Object.values(users));
  });

  const editor = () => ({ id: users.editor!.id, role: "editor" as const });
  const ref = async () => ({
    id: pageId,
    expectedUpdatedAt: (await serviceClient().from("pages").select("updated_at").eq("id", pageId).single()).data!
      .updated_at as string,
  });

  it("editor cria rascunho com bloco, e o visitante não lê nenhum dos dois", async () => {
    const deps = cmsDepsFor(users.editor!.client);
    pageId = (await saveContent(deps, editor(), PAGE, { title: "Página de teste", slug, provisional: true })).id;
    await saveBlock(deps, editor(), await ref(), {
      type: "rich-text",
      input: form({ fields: { title: "Rascunho" }, paragraphs: ["Texto em preparação."] }),
    });
    expect(await fetchPage(anonClient(), slug)).toBeNull();
    const { data: pages } = await anonClient().from("pages").select("id").eq("id", pageId);
    const { data: blocks } = await anonClient().from("blocks").select("id").eq("page_id", pageId);
    expect(pages).toEqual([]);
    expect(blocks).toEqual([]);
  });

  it("o que o editor salvou reaparece na leitura do painel", async () => {
    const store = createSupabaseCmsStore(users.editor!.client, supabaseTestEnv.url!);
    const page = (await store.snapshot()).pages.find((item) => item.id === pageId);
    expect(page).toMatchObject({ slug, status: "draft", provisional: true });
    expect(page?.blocks[0]).toMatchObject({
      type: "rich-text",
      order: 0,
      content: { title: "Rascunho", paragraphs: ["Texto em preparação."] },
    });
  });

  it("leitor não altera nada, nem pelo serviço nem direto no banco", async () => {
    const deps = cmsDepsFor(users.viewer!.client);
    const viewer = { id: users.viewer!.id, role: "viewer" as const };
    await expect(
      saveBlock(deps, viewer, await ref(), { type: "rich-text", input: form({ paragraphs: ["Invasão."] }) }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const { error } = await users
      .viewer!.client.from("blocks")
      .insert({ page_id: pageId, type: "rich-text", content: { paragraphs: ["Invasão."] } });
    expect(error?.code).toBe("42501");
    const { data } = await users.viewer!.client.from("pages").update({ title: "Invadido" }).eq("id", pageId).select();
    expect(data).toEqual([]);
  });

  it("visitante não grava em páginas nem blocos", async () => {
    const { error: page } = await anonClient()
      .from("pages")
      .insert({ slug: `anon-${suffix}`, title: "Invasão" });
    const { error: block } = await anonClient()
      .from("blocks")
      .insert({ page_id: pageId, type: "rich-text", content: {} });
    expect(page?.code).toBe("42501");
    expect(block?.code).toBe("42501");
  });

  it("publicada, o visitante lê a página; a alteração seguinte aparece sem mudar código", async () => {
    const deps = cmsDepsFor(users.editor!.client);
    await runContentCommand(deps, editor(), PAGE, await ref(), "publish");
    const before = await fetchPage(anonClient(), slug);
    expect(before?.blocks[0].content).toMatchObject({ title: "Rascunho" });

    const blockId = before!.blocks[0].id;
    await saveBlock(deps, editor(), await ref(), {
      blockId,
      type: "rich-text",
      input: form({ fields: { title: "Publicado" }, paragraphs: ["Texto final."] }),
    });
    expect((await fetchPage(anonClient(), slug))?.blocks[0].content).toEqual({
      title: "Publicado",
      paragraphs: ["Texto final."],
    });
  });

  it("ordem e exclusão de blocos valem com a RLS do editor", async () => {
    const deps = cmsDepsFor(users.editor!.client);
    await saveBlock(deps, editor(), await ref(), {
      type: "cta",
      input: form({ fields: { title: "Vamos?", label: "Falar", href: "/contato" } }),
    });
    const inserted = (await fetchPage(anonClient(), slug))!.blocks;
    expect(inserted.map((block) => block.type)).toEqual(["rich-text", "cta"]);
    await changeBlock(deps, editor(), await ref(), inserted[1].id, "subir");
    expect((await fetchPage(anonClient(), slug))!.blocks.map((block) => block.type)).toEqual(["cta", "rich-text"]);
    await changeBlock(deps, editor(), await ref(), inserted[1].id, "excluir");
    expect((await fetchPage(anonClient(), slug))!.blocks.map((block) => block.type)).toEqual(["rich-text"]);
  });

  it("segunda aba com versão antiga recebe conflito", async () => {
    const deps = cmsDepsFor(users.editor!.client);
    const stale = await ref();
    await saveBlock(deps, editor(), stale, {
      type: "rich-text",
      input: form({ paragraphs: ["Primeira aba."] }),
    });
    await expect(
      saveBlock(deps, editor(), stale, { type: "rich-text", input: form({ paragraphs: ["Segunda aba."] }) }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("arquivada some para o visitante e só o administrador exclui", async () => {
    const deps = cmsDepsFor(users.editor!.client);
    await runContentCommand(deps, editor(), PAGE, await ref(), "archive");
    expect(await fetchPage(anonClient(), slug)).toBeNull();
    await expect(runContentCommand(deps, editor(), PAGE, await ref(), "delete")).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await runContentCommand(
      cmsDepsFor(users.admin!.client),
      { id: users.admin!.id, role: "admin" },
      PAGE,
      await ref(),
      "delete",
    );
    const { data } = await serviceClient().from("blocks").select("id").eq("page_id", pageId);
    expect(data).toEqual([]);
  });
});
