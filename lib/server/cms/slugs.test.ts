/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : slugs.test.ts
 Descrição    : Testes do CMS para troca de endereço com 301, endereços reservados e slug fixo (DB-08).

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 29/10/2026
 Modificado em: 29/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 29/10/2026 Vinicius Binda             Criação inicial (DB-08).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/domain/auth/rbac";
import type { AuditInput } from "../audit";
import type { ContentChange } from "../content/invalidate";
import { runContentCommand, saveContent, type CmsDeps } from "./content-service";
import { CATEGORY, SERVICE } from "./entities";
import { createMemoryCmsStore, type MemoryTables } from "./memory-store";

/*
 * O banco é a fonte das regras (trigger track_slug, testado no pgTAP slugs_e_urls); aqui o
 * store de memória imita o trigger e o teste cobre o que o painel decide antes de gravar:
 * aceitar a troca, avisar sobre endereço reservado, gerar slug livre e invalidar o antigo.
 */
const NOW = new Date("2026-10-29T15:00:00.000Z");
const control = { provisional: false, archived_at: null, updated_at: "2026-10-20T00:00:00.000Z" };
const live = { ...control, status: "published" as const, published_at: "2026-10-20T00:00:00.000Z" };
const AREA_ID = "8b4f6a52-6c43-4a8f-9d55-2f5a2f6f0c11";
const MEDIA_ID = "5d2f6c7e-1a2b-4c3d-8e9f-0a1b2c3d4e5f";

function setup(seed: Partial<MemoryTables> = {}) {
  const { store, tables } = createMemoryCmsStore({
    areas: [
      {
        ...live,
        id: AREA_ID,
        slug: "criacao",
        name: "Criação",
        summary: "s",
        description: "d",
        highlights: [],
        icon: null,
        sort_order: 1,
      },
    ],
    media_assets: [
      {
        id: MEDIA_ID,
        path: "/brand/cases/fecap.webp",
        mime_type: "image/webp",
        width: 1200,
        height: 750,
        alt_text: "Peça de campanha",
        decorative: false,
      },
    ],
    ...seed,
  });
  const changes: ContentChange[] = [];
  const audits: AuditInput[] = [];
  const deps: CmsDeps = {
    store,
    audit: async (input) => void audits.push(input),
    invalidate: (change) => void changes.push(change),
    now: () => NOW,
  };
  const actor = (role: Role) => ({ id: "u1", role });
  const version = (id: string) => tables.services.find((row) => row.id === id)!.updated_at as string;
  const ref = (id: string) => ({ id, expectedUpdatedAt: version(id) });
  return { deps, tables, changes, audits, actor, ref };
}

const service = {
  name: "Audiovisual",
  slug: "audiovisual",
  summary: "Vídeos, fotos e coberturas.",
  description: "Roteiro, captação e edição de vídeos institucionais e para redes.",
  examples: ["Vídeos institucionais"],
  areaIds: [AREA_ID],
  imageId: MEDIA_ID,
  featured: false,
  order: "1",
};

/** Serviço criado pelo painel e publicado. */
async function published(env: ReturnType<typeof setup>, input: Record<string, unknown> = service) {
  const { id } = await saveContent(env.deps, env.actor("editor"), SERVICE, input);
  await runContentCommand(env.deps, env.actor("editor"), SERVICE, env.ref(id), "publish");
  return id;
}

describe("troca de endereço de serviço e case (DB-08)", () => {
  it("serviço publicado troca de endereço: o antigo fica registrado, auditado e sai do cache", async () => {
    const env = setup();
    const id = await published(env);
    await saveContent(env.deps, env.actor("editor"), SERVICE, { ...service, slug: "audiovisual-e-foto" }, env.ref(id));

    expect(env.tables.services[0].slug).toBe("audiovisual-e-foto");
    expect(env.tables.slug_redirects).toEqual([{ entity_type: "service", old_slug: "audiovisual", entity_id: id }]);
    expect(env.changes.at(-1)).toMatchObject({
      entity: "service",
      slug: "audiovisual-e-foto",
      previousSlug: "audiovisual",
    });
    expect(env.audits.at(-1)).toMatchObject({
      event: "content.updated",
      metadata: { slug: "audiovisual-e-foto", previousSlug: "audiovisual" },
    });
  });

  it("rascunho que nunca foi ao ar troca de endereço sem registrar o antigo", async () => {
    const env = setup();
    const { id } = await saveContent(env.deps, env.actor("editor"), SERVICE, service);
    await saveContent(env.deps, env.actor("editor"), SERVICE, { ...service, slug: "audiovisual-novo" }, env.ref(id));
    expect(env.tables.slug_redirects).toEqual([]);
  });

  it("voltar ao endereço antigo é permitido e inverte o redirecionamento", async () => {
    const env = setup();
    const id = await published(env);
    await saveContent(env.deps, env.actor("editor"), SERVICE, { ...service, slug: "audiovisual-e-foto" }, env.ref(id));
    await saveContent(env.deps, env.actor("editor"), SERVICE, service, env.ref(id));
    expect(env.tables.services[0].slug).toBe("audiovisual");
    expect(env.tables.slug_redirects).toEqual([
      { entity_type: "service", old_slug: "audiovisual-e-foto", entity_id: id },
    ]);
  });

  it("outro serviço não usa o endereço antigo; o gerado pelo servidor o pula", async () => {
    const env = setup();
    const id = await published(env);
    await saveContent(env.deps, env.actor("editor"), SERVICE, { ...service, slug: "audiovisual-e-foto" }, env.ref(id));

    await expect(
      saveContent(env.deps, env.actor("editor"), SERVICE, { ...service, name: "Outro" }),
    ).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
      fieldErrors: { slug: [expect.stringMatching(/reservado/)] },
    });
    const generated = await saveContent(env.deps, env.actor("editor"), SERVICE, { ...service, slug: "" });
    expect(env.tables.services.find((row) => row.id === generated.id)?.slug).toBe("audiovisual-2");
  });

  it("excluir serviço já publicado deixa o endereço reservado", async () => {
    const env = setup();
    const id = await published(env);
    await runContentCommand(env.deps, env.actor("admin"), SERVICE, env.ref(id), "archive");
    await runContentCommand(env.deps, env.actor("admin"), SERVICE, env.ref(id), "delete");

    expect(env.tables.slug_redirects).toEqual([{ entity_type: "service", old_slug: "audiovisual", entity_id: null }]);
    await expect(saveContent(env.deps, env.actor("editor"), SERVICE, service)).rejects.toMatchObject({
      fieldErrors: { slug: [expect.stringMatching(/reservado/)] },
    });
  });

  it("categoria publicada continua com o endereço fixo (sem página própria)", async () => {
    const env = setup({
      case_categories: [
        { ...live, id: "c1", slug: "copywriting", name: "Copywriting", description: null, sort_order: 1 },
      ],
    });
    await expect(
      saveContent(
        env.deps,
        env.actor("admin"),
        CATEGORY,
        { name: "Copywriting", slug: "copy", order: "1" },
        { id: "c1", expectedUpdatedAt: control.updated_at },
      ),
    ).rejects.toMatchObject({ fieldErrors: { slug: [expect.stringMatching(/não muda/)] } });
  });
});
