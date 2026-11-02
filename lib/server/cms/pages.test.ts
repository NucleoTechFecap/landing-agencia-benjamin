/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : pages.test.ts
 Descrição    : Testes das regras de páginas e blocos com o store em memória.

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

import { describe, expect, it } from "vitest";
import type { BlockFormInput } from "@/lib/domain/content/block-input";
import type { Role } from "@/lib/domain/auth/rbac";
import type { AuditInput } from "../audit";
import type { ContentChange } from "../content/invalidate";
import { runContentCommand, saveContent, type CmsDeps } from "./content-service";
import { PAGE } from "./entities";
import { createMemoryCmsStore, type MemoryTables } from "./memory-store";
import { changeBlock, saveBlock } from "./page-blocks";

const NOW = new Date("2026-11-01T15:00:00.000Z");

function setup(seed: Partial<MemoryTables> = {}) {
  const { store, tables } = createMemoryCmsStore(seed);
  const audits: AuditInput[] = [];
  const changes: ContentChange[] = [];
  const deps: CmsDeps = {
    store,
    audit: async (input) => void audits.push(input),
    invalidate: (change) => void changes.push(change),
    now: () => NOW,
  };
  const actor = (role: Role) => ({ id: "user-1", role });
  const page = (id: string) => tables.pages.find((row) => row.id === id)!;
  const ref = (id: string) => ({ id, expectedUpdatedAt: page(id).updated_at });
  return { deps, tables, audits, changes, actor, page, ref };
}

type Env = ReturnType<typeof setup>;

const form = (partial: Partial<BlockFormInput> = {}): BlockFormInput => ({
  fields: {},
  paragraphs: [],
  items: [],
  members: [],
  ...partial,
});

const textBlock = (...paragraphs: string[]) => ({ type: "rich-text", input: form({ paragraphs }) });

const createPage = async (env: Env, slug = "sobre") =>
  (await saveContent(env.deps, env.actor("editor"), PAGE, { title: "Sobre", slug, provisional: true })).id;

async function publishedPage(env: Env, slug = "sobre") {
  const id = await createPage(env, slug);
  await saveBlock(env.deps, env.actor("editor"), env.ref(id), textBlock("Primeiro parágrafo."));
  await runContentCommand(env.deps, env.actor("editor"), PAGE, env.ref(id), "publish");
  env.audits.length = 0;
  env.changes.length = 0;
  return id;
}

const blocksOf = (env: Env, id: string) =>
  env.tables.blocks.filter((block) => block.page_id === id).sort((a, b) => a.sort_order - b.sort_order);

describe("CMS de páginas — dados e publicação (ADM-05)", () => {
  it("cria como rascunho, guarda a marca de provisório e não mexe no cache público", async () => {
    const env = setup();
    const id = await createPage(env);
    expect(env.page(id)).toMatchObject({ slug: "sobre", status: "draft", provisional: true });
    expect(env.audits[0]).toMatchObject({ event: "content.created", metadata: { entity: "page", slug: "sobre" } });
    expect(env.changes).toEqual([]);
  });

  it("não publica página sem blocos e publica depois de ter conteúdo, invalidando o cache", async () => {
    const env = setup();
    const id = await createPage(env);
    await expect(runContentCommand(env.deps, env.actor("editor"), PAGE, env.ref(id), "publish")).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      fieldErrors: { publicacao: ["Inclua ao menos um bloco de conteúdo."] },
    });
    await saveBlock(env.deps, env.actor("editor"), env.ref(id), textBlock("Texto."));
    await runContentCommand(env.deps, env.actor("editor"), PAGE, env.ref(id), "publish");
    expect(env.page(id).status).toBe("published");
    expect(env.changes).toEqual([{ entity: "page", slug: "sobre" }]);
  });

  it("leitor não cria nem edita", async () => {
    const env = setup();
    await expect(
      saveContent(env.deps, env.actor("viewer"), PAGE, { title: "Sobre", slug: "sobre" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const id = await createPage(env);
    await expect(saveBlock(env.deps, env.actor("viewer"), env.ref(id), textBlock("Invasão."))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(env.tables.blocks).toEqual([]);
  });

  it("o endereço fica fixo depois da primeira publicação", async () => {
    const env = setup();
    const id = await publishedPage(env);
    await expect(
      saveContent(env.deps, env.actor("editor"), PAGE, { title: "Sobre", slug: "outro-endereco" }, env.ref(id)),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED", fieldErrors: { slug: expect.any(Array) } });
  });

  it("slug em branco na edição mantém o endereço atual", async () => {
    const env = setup();
    const id = await createPage(env);
    await saveContent(env.deps, env.actor("editor"), PAGE, { title: "Novo título", slug: "" }, env.ref(id));
    expect(env.page(id)).toMatchObject({ slug: "sobre", title: "Novo título" });
  });

  it("excluir a página leva os blocos junto", async () => {
    const env = setup();
    const id = await publishedPage(env);
    await runContentCommand(env.deps, env.actor("admin"), PAGE, env.ref(id), "archive");
    await runContentCommand(env.deps, env.actor("admin"), PAGE, env.ref(id), "delete");
    expect(env.tables.pages).toEqual([]);
    expect(env.tables.blocks).toEqual([]);
  });
});

describe("CMS de páginas — blocos (ADM-05)", () => {
  it("adiciona ao fim e o que foi salvo reaparece na leitura", async () => {
    const env = setup();
    const id = await publishedPage(env);
    await saveBlock(env.deps, env.actor("editor"), env.ref(id), {
      type: "list",
      input: form({ fields: { title: "Diferenciais" }, items: ["Estratégia | Do briefing à entrega"] }),
    });
    const { pages } = await env.deps.store.snapshot();
    expect(pages[0].blocks.map((block) => block.type)).toEqual(["rich-text", "list"]);
    expect(pages[0].blocks[1].content).toEqual({
      title: "Diferenciais",
      items: [{ title: "Estratégia", text: "Do briefing à entrega" }],
    });
  });

  it("edita um bloco de página publicada: audita e invalida o cache da página", async () => {
    const env = setup();
    const id = await publishedPage(env);
    const [block] = blocksOf(env, id);
    await saveBlock(env.deps, env.actor("editor"), env.ref(id), { blockId: block.id, ...textBlock("Novo texto.") });
    expect(blocksOf(env, id)[0].content).toEqual({ paragraphs: ["Novo texto."] });
    expect(env.audits).toEqual([
      expect.objectContaining({
        event: "content.updated",
        resourceId: id,
        metadata: expect.objectContaining({
          entity: "page",
          slug: "sobre",
          action: "bloco-editado",
          kind: "rich-text",
        }),
      }),
    ]);
    expect(env.changes).toEqual([{ entity: "page", slug: "sobre" }]);
  });

  it("em rascunho não invalida o cache público", async () => {
    const env = setup();
    const id = await createPage(env);
    await saveBlock(env.deps, env.actor("editor"), env.ref(id), textBlock("Texto."));
    expect(env.changes).toEqual([]);
  });

  it("devolve erro por campo e não grava conteúdo inválido", async () => {
    const env = setup();
    const id = await createPage(env);
    await expect(
      saveBlock(env.deps, env.actor("editor"), env.ref(id), {
        type: "cta",
        input: form({ fields: { title: "Vamos?", label: "Falar", href: "javascript:alert(1)" } }),
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED", fieldErrors: { href: expect.any(Array) } });
    expect(env.tables.blocks).toEqual([]);
  });

  it("recusa tipo desconhecido e bloco de outra página", async () => {
    const env = setup();
    const id = await createPage(env);
    await expect(
      saveBlock(env.deps, env.actor("editor"), env.ref(id), { type: "hero", input: form() }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      saveBlock(env.deps, env.actor("editor"), env.ref(id), { blockId: "outro", ...textBlock("X.") }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("versão desatualizada dá conflito: cada alteração de bloco avança a versão da página", async () => {
    const env = setup();
    const id = await createPage(env);
    const stale = env.ref(id);
    await saveBlock(env.deps, env.actor("editor"), stale, textBlock("Primeiro."));
    await expect(saveBlock(env.deps, env.actor("editor"), stale, textBlock("Segundo."))).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(blocksOf(env, id)).toHaveLength(1);
  });

  it("página arquivada não aceita alteração de bloco", async () => {
    const env = setup();
    const id = await createPage(env);
    await saveBlock(env.deps, env.actor("editor"), env.ref(id), textBlock("Texto."));
    await runContentCommand(env.deps, env.actor("editor"), PAGE, env.ref(id), "archive");
    await expect(saveBlock(env.deps, env.actor("editor"), env.ref(id), textBlock("Outro."))).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
    await expect(
      changeBlock(env.deps, env.actor("editor"), env.ref(id), blocksOf(env, id)[0].id, "excluir"),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  it("move mudando a ordem e ignora mover além das pontas", async () => {
    const env = setup();
    const id = await createPage(env);
    for (const text of ["A", "B", "C"]) {
      await saveBlock(env.deps, env.actor("editor"), env.ref(id), textBlock(text));
    }
    const contents = () => blocksOf(env, id).map((block) => (block.content as { paragraphs: string[] }).paragraphs[0]);
    await changeBlock(env.deps, env.actor("editor"), env.ref(id), blocksOf(env, id)[2].id, "subir");
    expect(contents()).toEqual(["A", "C", "B"]);
    await changeBlock(env.deps, env.actor("editor"), env.ref(id), blocksOf(env, id)[0].id, "subir");
    expect(contents()).toEqual(["A", "C", "B"]);
  });

  it("não deixa publicada sem bloco: a última exclusão é recusada", async () => {
    const env = setup();
    const id = await publishedPage(env);
    await expect(
      changeBlock(env.deps, env.actor("editor"), env.ref(id), blocksOf(env, id)[0].id, "excluir"),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect(blocksOf(env, id)).toHaveLength(1);
  });

  it("em rascunho exclui o último bloco", async () => {
    const env = setup();
    const id = await createPage(env);
    await saveBlock(env.deps, env.actor("editor"), env.ref(id), textBlock("Texto."));
    await changeBlock(env.deps, env.actor("editor"), env.ref(id), blocksOf(env, id)[0].id, "excluir");
    expect(blocksOf(env, id)).toEqual([]);
  });

  it("manifesto só na Home e uma vez", async () => {
    const env = setup();
    const sobre = await createPage(env);
    const manifesto = {
      type: "manifesto",
      input: form({ fields: { title: "Comunicação que soma." }, paragraphs: ["Texto."] }),
    };
    await expect(saveBlock(env.deps, env.actor("editor"), env.ref(sobre), manifesto)).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      message: expect.stringContaining("só existe na página Home"),
    });
    const home = await createPage(env, "home");
    await saveBlock(env.deps, env.actor("editor"), env.ref(home), manifesto);
    await expect(saveBlock(env.deps, env.actor("editor"), env.ref(home), manifesto)).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      message: expect.stringContaining("já tem o bloco"),
    });
  });
});

describe("CMS de páginas — Nosso time (ADM-05)", () => {
  const media = (id: string, alt: string | null) => ({
    id,
    path: `imagens/${id}.jpg`,
    mime_type: "image/jpeg",
    size_bytes: 1000,
    width: 800,
    height: 800,
    alt_text: alt,
    decorative: false,
  });
  const team = (photoId: string) => ({
    type: "team",
    input: form({ members: [{ name: "Ana Souza", role: "Direção", photoId }] }),
  });

  it("guarda endereço e texto alternativo da foto escolhida na biblioteca", async () => {
    const env = setup({ media_assets: [media("foto-1", "Ana Souza sorrindo")] });
    const id = await createPage(env);
    await saveBlock(env.deps, env.actor("editor"), env.ref(id), team("foto-1"));
    expect(blocksOf(env, id)[0].content).toEqual({
      members: [
        {
          name: "Ana Souza",
          role: "Direção",
          photo: { src: expect.stringContaining("imagens/foto-1.jpg"), alt: "Ana Souza sorrindo" },
        },
      ],
    });
  });

  it("recusa foto fora da biblioteca ou sem texto alternativo", async () => {
    const env = setup({ media_assets: [media("sem-alt", null)] });
    const id = await createPage(env);
    for (const photoId of ["nao-existe", "sem-alt"]) {
      await expect(saveBlock(env.deps, env.actor("editor"), env.ref(id), team(photoId))).rejects.toMatchObject({
        code: "VALIDATION_FAILED",
        fieldErrors: { members: [expect.stringContaining("Ana Souza")] },
      });
    }
    expect(env.tables.blocks).toEqual([]);
  });
});
