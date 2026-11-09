/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : integridade-publicacao.test.ts
 Descrição    : Integração: regras de publicação no commit real pela API, concorrência e ciclo de vida (DBX-04).

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinicius Binda             Criação inicial (DBX-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { runContentCommand, saveContent } from "@/lib/server/cms/content-service";
import { SERVICE } from "@/lib/server/cms/entities";
import { createSupabaseCmsStore } from "@/lib/server/cms/supabase-store";
import {
  cmsDepsFor,
  createTestUser,
  deleteTestUsers,
  hasSupabaseTestEnv,
  must,
  serviceClient,
  supabaseTestEnv,
  testSuffix,
  type TestUser,
} from "./helpers";

vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

/*
 * O pgTAP roda numa transação desfeita, então só aqui as verificações adiadas passam pelo commit de
 * verdade, como acontece com o painel: o erro chega pela API e nada fica gravado. A corrida entre
 * duas pessoas também só existe com duas conexões.
 */
describe.runIf(hasSupabaseTestEnv)("integridade de publicação no Supabase (DBX-04)", () => {
  const suffix = testSuffix();
  const slug = (name: string) => `${name}-${suffix}`;
  const users: { editor?: TestUser; other?: TestUser } = {};
  const ids = {
    area: "",
    category: "",
    media: "",
    service: "",
    archived: "",
    item: "",
    raceCase: "",
    raceCategory: "",
  };
  const past = new Date(Date.now() - 86_400_000).toISOString();
  const published = { status: "published", published_at: past };
  const caseFields = {
    title: "Case de teste",
    client_name: "Cliente fictício",
    summary: "Resumo do case com tamanho suficiente para publicar.",
  };

  const store = (user: TestUser) => createSupabaseCmsStore(user.client, supabaseTestEnv.url!);
  const versionOf = async (table: string, id: string) =>
    (await must(serviceClient().from(table).select("updated_at").eq("id", id).single<{ updated_at: string }>()))
      .updated_at;
  const serviceValues = (name: string) => ({
    slug: slug("servico"),
    name,
    summary: "Resumo do serviço.",
    description: "Descrição do serviço.",
    examples: [],
    icon: null,
    image_media_id: null,
    featured: false,
    sort_order: 0,
  });

  beforeAll(async () => {
    [users.editor, users.other] = await Promise.all([
      createTestUser("editor", suffix),
      createTestUser("editor", `${suffix}b`),
    ]);
    const admin = serviceClient();
    const one = async (table: string, row: Record<string, unknown>) =>
      (await must(admin.from(table).insert(row).select("id").single<{ id: string }>())).id;

    ids.area = await one("areas", { slug: slug("area"), name: "Área", summary: "s", description: "d", ...published });
    ids.category = await one("case_categories", { slug: slug("categoria"), name: "Categoria", ...published });
    ids.raceCategory = await one("case_categories", { slug: slug("categoria-corrida"), name: "Corrida", ...published });
    ids.media = await one("media_assets", {
      path: `/brand/dbx04-${suffix}.webp`,
      mime_type: "image/webp",
      alt_text: "Imagem",
    });
    ids.service = await one("services", {
      ...serviceValues("Serviço publicado"),
      ...published,
    });
    ids.archived = await one("services", {
      slug: slug("servico-arquivado"),
      name: "Serviço arquivado",
      summary: "s",
      description: "d",
      status: "archived",
      archived_at: past,
    });
    ids.item = await one("cases", {
      slug: slug("case"),
      category_id: ids.category,
      cover_media_id: ids.media,
      ...caseFields,
      ...published,
    });
    ids.raceCase = await one("cases", {
      slug: slug("case-corrida"),
      category_id: ids.raceCategory,
      cover_media_id: ids.media,
      ...caseFields,
      status: "draft",
      published_at: past,
    });
    await must(admin.from("service_areas").insert({ service_id: ids.service, area_id: ids.area }));
    await must(
      admin.from("case_services").insert([
        { case_id: ids.item, service_id: ids.service },
        { case_id: ids.raceCase, service_id: ids.service },
      ]),
    );
  });

  afterAll(async () => {
    const admin = serviceClient();
    await admin.from("cases").delete().like("slug", `%-${suffix}`);
    await admin.from("services").delete().like("slug", `%-${suffix}`);
    await admin.from("slug_redirects").delete().like("old_slug", `%-${suffix}`);
    await admin.from("case_categories").delete().like("slug", `%-${suffix}`);
    await admin.from("areas").delete().eq("id", ids.area);
    await admin.from("media_assets").delete().eq("id", ids.media);
    await deleteTestUsers(Object.values(users));
  });

  it("o erro da verificação adiada chega pela API no commit e nada fica gravado", async () => {
    const { error } = await users.editor!.client.from("case_services").delete().eq("case_id", ids.item);
    expect(error?.code).toBe("BJ003");
    const links = await must(serviceClient().from("case_services").select("service_id").eq("case_id", ids.item));
    expect(links).toEqual([{ service_id: ids.service }]);
  });

  it("o painel recebe conflito ao zerar as áreas de serviço publicado, e o texto não muda", async () => {
    const version = await versionOf("services", ids.service);
    await expect(
      store(users.editor!).saveWithRelations({ table: "services", areaIds: [] }, serviceValues("Não deve ficar"), {
        id: ids.service,
        expectedUpdatedAt: version,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringMatching(/conteúdo publicado/) });
    const row = await must(serviceClient().from("services").select("name, updated_at").eq("id", ids.service).single());
    expect(row).toEqual({ name: "Serviço publicado", updated_at: version });
  });

  it("trocar a área de serviço publicado na mesma transação continua funcionando", async () => {
    const saved = await store(users.editor!).saveWithRelations(
      { table: "services", areaIds: [ids.area] },
      serviceValues("Serviço publicado"),
      { id: ids.service, expectedUpdatedAt: await versionOf("services", ids.service) },
    );
    expect(saved.id).toBe(ids.service);
  });

  it("o painel recebe transição inválida ao publicar item arquivado", async () => {
    await expect(
      store(users.editor!).update(
        "services",
        ids.archived,
        { status: "published", published_at: past, archived_at: null },
        await versionOf("services", ids.archived),
      ),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });
  });

  it("a data da primeira publicação não muda nem com a chave de serviço", async () => {
    const { error } = await serviceClient().from("cases").update({ published_at: null }).eq("id", ids.item);
    expect(error?.code).toBe("BJ001");
  });

  it("a chave de serviço fica fora das regras entre tabelas: é o caminho de manutenção", async () => {
    const admin = serviceClient();
    await must(admin.from("case_services").delete().eq("case_id", ids.item));
    await must(admin.from("case_services").insert({ case_id: ids.item, service_id: ids.service }));
  });

  it("duas pessoas salvando a mesma versão: uma grava e a outra recebe conflito", async () => {
    const version = await versionOf("areas", ids.area);
    const results = await Promise.allSettled(
      [users.editor!, users.other!].map((user, index) =>
        store(user).update("areas", ids.area, { name: `Versão ${index}` }, version),
      ),
    );
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const failed = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(failed.reason).toMatchObject({ code: "CONFLICT" });
  });

  it("duas pessoas salvando serviço e áreas na mesma versão: a segunda recebe conflito na hora", async () => {
    const version = await versionOf("services", ids.service);
    const results = await Promise.allSettled(
      [users.editor!, users.other!].map((user) =>
        store(user).saveWithRelations({ table: "services", areaIds: [ids.area] }, serviceValues("Serviço publicado"), {
          id: ids.service,
          expectedUpdatedAt: version,
        }),
      ),
    );
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const failed = results.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(failed.reason).toMatchObject({ code: "CONFLICT" });
  });

  it("publicar case enquanto outra pessoa despublica a categoria nunca deixa os dois gravados", async () => {
    const admin = serviceClient();
    for (let round = 0; round < 15; round += 1) {
      await must(admin.from("cases").update({ status: "draft" }).eq("id", ids.raceCase));
      await must(admin.from("case_categories").update({ status: "published" }).eq("id", ids.raceCategory));

      const [publishCase, unpublishCategory] = await Promise.all([
        users.editor!.client.from("cases").update({ status: "published" }).eq("id", ids.raceCase),
        users.other!.client.from("case_categories").update({ status: "draft" }).eq("id", ids.raceCategory),
      ]);

      // Exatamente uma das duas grava; a outra recebe o erro da regra R06.
      expect([publishCase.error?.code, unpublishCategory.error?.code].filter(Boolean)).toEqual(["BJ003"]);
      const item = await must(admin.from("cases").select("status").eq("id", ids.raceCase).single<{ status: string }>());
      const category = await must(
        admin.from("case_categories").select("status").eq("id", ids.raceCategory).single<{ status: string }>(),
      );
      expect(item.status === "published" && category.status !== "published").toBe(false);
    }
  });

  it("o ciclo criar, editar, publicar, arquivar e restaurar passa pelas regras", async () => {
    const deps = cmsDepsFor(users.editor!.client);
    const actor = { id: users.editor!.id, role: "editor" as const };
    const input = (name: string) => ({
      name,
      slug: slug("servico-ciclo"),
      summary: "Resumo do serviço de teste.",
      description: "Descrição completa do serviço de teste do CMS.",
      areaIds: [ids.area],
      imageId: ids.media,
      order: "3",
    });
    const ref = async (id: string) => ({ id, expectedUpdatedAt: await versionOf("services", id) });
    const publishedAt = async (id: string) =>
      (
        await must(
          serviceClient().from("services").select("published_at").eq("id", id).single<{ published_at: string }>(),
        )
      ).published_at;

    const { id } = await saveContent(deps, actor, SERVICE, input("Serviço do ciclo"));
    await saveContent(deps, actor, SERVICE, input("Serviço do ciclo editado"), await ref(id));
    await expect(runContentCommand(deps, actor, SERVICE, await ref(id), "publish")).resolves.toMatchObject({
      status: "published",
    });
    const first = await publishedAt(id);

    await saveContent(deps, actor, SERVICE, input("Serviço do ciclo publicado"), await ref(id));
    await expect(runContentCommand(deps, actor, SERVICE, await ref(id), "archive")).resolves.toMatchObject({
      status: "archived",
    });
    await expect(runContentCommand(deps, actor, SERVICE, await ref(id), "restore")).resolves.toMatchObject({
      status: "draft",
    });
    await expect(runContentCommand(deps, actor, SERVICE, await ref(id), "publish")).resolves.toMatchObject({
      status: "published",
    });
    expect(await publishedAt(id)).toBe(first);
  });
});
