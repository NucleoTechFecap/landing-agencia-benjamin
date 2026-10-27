/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : cms-servicos.test.ts
 Descrição    : Integração: CRUD e publicação de serviços pelo CMS com áreas, imagem e RLS.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-06).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { runContentCommand, saveContent } from "@/lib/server/cms/content-service";
import { SERVICE } from "@/lib/server/cms/entities";
import { createSupabaseCmsStore } from "@/lib/server/cms/supabase-store";
import { fetchAreasAndServices } from "@/lib/server/content/supabase/queries";
import {
  anonClient,
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

describe.runIf(hasSupabaseTestEnv)("CMS de serviços no Supabase (ADM-06)", () => {
  const suffix = testSuffix();
  const slug = `servico-cms-${suffix}`;
  const users: { editor?: TestUser; viewer?: TestUser } = {};
  const ids = { area: "", draftArea: "", media: "", service: "" };
  const past = new Date(Date.now() - 86_400_000).toISOString();

  beforeAll(async () => {
    [users.editor, users.viewer] = await Promise.all([
      createTestUser("editor", suffix),
      createTestUser("viewer", suffix),
    ]);
    const admin = serviceClient();
    const areas = await must(
      admin
        .from("areas")
        .insert([
          {
            slug: `area-pub-${suffix}`,
            name: "Área publicada",
            summary: "s",
            description: "d",
            status: "published",
            published_at: past,
          },
          {
            slug: `area-rasc-${suffix}`,
            name: "Área rascunho",
            summary: null,
            description: null,
            status: "draft",
            published_at: null,
          },
        ])
        .select("id"),
    );
    [ids.area, ids.draftArea] = areas.map((area) => area.id);
    const [media] = await must(
      admin
        .from("media_assets")
        .insert({ path: `/brand/servico-${suffix}.webp`, mime_type: "image/webp", alt_text: "Imagem do serviço" })
        .select("id"),
    );
    ids.media = media.id;
  });

  afterAll(async () => {
    const admin = serviceClient();
    await admin.from("services").delete().eq("slug", slug);
    await admin.from("areas").delete().in("id", [ids.area, ids.draftArea]);
    await admin.from("media_assets").delete().eq("id", ids.media);
    await deleteTestUsers(Object.values(users));
  });

  const editor = () => ({ id: users.editor!.id, role: "editor" as const });
  const version = async () =>
    (await serviceClient().from("services").select("updated_at").eq("id", ids.service).single()).data!
      .updated_at as string;
  const publicService = async () =>
    (await fetchAreasAndServices(anonClient(), supabaseTestEnv.url!)).services.find((service) => service.slug === slug);

  it("editor cria o serviço com áreas e imagem; vínculo gravado pela RLS do editor", async () => {
    const saved = await saveContent(cmsDepsFor(users.editor!.client), editor(), SERVICE, {
      name: "Serviço de teste",
      slug,
      summary: "Resumo do serviço de teste.",
      description: "Descrição completa do serviço de teste do CMS.",
      examples: ["Exemplo"],
      areaIds: [ids.area, ids.draftArea],
      imageId: ids.media,
      featured: false,
      order: "3",
    });
    ids.service = saved.id;
    const { data } = await serviceClient().from("service_areas").select("area_id").eq("service_id", ids.service);
    expect(data?.map((link) => link.area_id).sort()).toEqual([ids.area, ids.draftArea].sort());
    expect(await publicService()).toBeUndefined();
  });

  it("publicado, o visitante vê o serviço com imagem e só a área publicada", async () => {
    await runContentCommand(
      cmsDepsFor(users.editor!.client),
      editor(),
      SERVICE,
      { id: ids.service, expectedUpdatedAt: await version() },
      "publish",
    );
    const service = await publicService();
    expect(service?.areaIds).toEqual([ids.area]);
    expect(service?.image).toMatchObject({ src: `/brand/servico-${suffix}.webp`, alt: "Imagem do serviço" });
  });

  it("editor remove uma área do serviço publicado sem tirar o serviço do ar", async () => {
    await saveContent(
      cmsDepsFor(users.editor!.client),
      editor(),
      SERVICE,
      {
        name: "Serviço de teste",
        slug,
        summary: "Resumo do serviço de teste.",
        description: "Descrição completa do serviço de teste do CMS.",
        areaIds: [ids.area],
        imageId: ids.media,
        order: "3",
      },
      { id: ids.service, expectedUpdatedAt: await version() },
    );
    const { data } = await serviceClient().from("service_areas").select("area_id").eq("service_id", ids.service);
    expect(data).toEqual([{ area_id: ids.area }]);
    expect((await publicService())?.areaIds).toEqual([ids.area]);
  });

  it("leitor não consegue vincular áreas nem editar (RLS)", async () => {
    const { error } = await users
      .viewer!.client.from("service_areas")
      .insert({ service_id: ids.service, area_id: ids.draftArea });
    expect(error).not.toBeNull();
    const store = createSupabaseCmsStore(users.viewer!.client, supabaseTestEnv.url!);
    await expect(store.update("services", ids.service, { featured: true }, await version())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
