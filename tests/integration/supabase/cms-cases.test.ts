/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : cms-cases.test.ts
 Descrição    : Integração: mídia, gravação atômica e CRUD de cases/categorias sob RLS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 28/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
 28/10/2026 Vinícius Nishimura Reis  Verifica rollback com FK inválida na gravação do case (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { MEDIA_BUCKET } from "@/lib/domain/media/policy";
import { runContentCommand, saveContent } from "@/lib/server/cms/content-service";
import { CASE, CATEGORY } from "@/lib/server/cms/entities";
import { uploadMedia, type MediaStorage } from "@/lib/server/cms/media-service";
import { fetchCasesAndCategories } from "@/lib/server/content/supabase/queries";
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

const cover = new Uint8Array(readFileSync(join(process.cwd(), "public/brand/cases/meridiano.webp")));

describe.runIf(hasSupabaseTestEnv)("CMS de cases, categorias e mídia no Supabase (ADM-08)", () => {
  const suffix = testSuffix();
  const users: { editor?: TestUser; viewer?: TestUser } = {};
  const ids = { service: "", category: "", case: "", media: "" };
  const paths: string[] = [];

  const storageFor = (user: TestUser): MediaStorage => ({
    async upload(path, bytes, contentType) {
      const { error } = await user.client.storage.from(MEDIA_BUCKET).upload(path, bytes, { contentType });
      if (error) throw new Error(error.message);
      paths.push(path);
    },
    async remove(path) {
      await user.client.storage.from(MEDIA_BUCKET).remove([path]);
    },
  });

  beforeAll(async () => {
    [users.editor, users.viewer] = await Promise.all([
      createTestUser("editor", suffix),
      createTestUser("viewer", suffix),
    ]);
    const [service] = await must(
      serviceClient()
        .from("services")
        .insert({
          slug: `servico-case-${suffix}`,
          name: "Serviço",
          summary: "s",
          description: "d",
          status: "published",
          published_at: new Date(Date.now() - 86_400_000).toISOString(),
        })
        .select("id"),
    );
    ids.service = service.id;
  });

  afterAll(async () => {
    const admin = serviceClient();
    await admin.from("cases").delete().eq("id", ids.case);
    await admin.from("case_categories").delete().eq("id", ids.category);
    await admin.from("services").delete().eq("id", ids.service);
    await admin.from("media_assets").delete().eq("id", ids.media);
    if (paths.length) await admin.storage.from(MEDIA_BUCKET).remove(paths);
    await deleteTestUsers(Object.values(users));
  });

  const editor = () => ({ id: users.editor!.id, role: "editor" as const });
  const version = async (table: "cases" | "case_categories", id: string) =>
    (await serviceClient().from(table).select("updated_at").eq("id", id).single()).data!.updated_at as string;

  it("editor envia a capa: arquivo no bucket público e registro na biblioteca", async () => {
    const asset = await uploadMedia(
      { ...cmsDepsFor(users.editor!.client), storage: storageFor(users.editor!), newId: () => crypto.randomUUID() },
      editor(),
      { name: `capa-${suffix}.webp`, type: "image/webp", bytes: cover },
      { alt: "Capa do case de teste", decorative: false },
    );
    ids.media = asset.id;
    expect(asset).toMatchObject({ width: 1200, height: 750, alt: "Capa do case de teste" });
    const response = await fetch(asset.src);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
  });

  it("leitor não envia arquivo ao bucket (política do Storage)", async () => {
    const { error } = await users
      .viewer!.client.storage.from(MEDIA_BUCKET)
      .upload(`2026/10/invasao-${suffix}.webp`, cover, { contentType: "image/webp" });
    expect(error).not.toBeNull();
  });

  it("editor cria e publica categoria e case com capa; o visitante vê o case", async () => {
    const deps = cmsDepsFor(users.editor!.client);
    const category = await saveContent(deps, editor(), CATEGORY, {
      name: "Categoria de teste",
      slug: `categoria-${suffix}`,
    });
    ids.category = category.id;
    await runContentCommand(
      deps,
      editor(),
      CATEGORY,
      { id: ids.category, expectedUpdatedAt: category.updatedAt },
      "publish",
    );
    const saved = await saveContent(deps, editor(), CASE, {
      title: "Case de teste",
      slug: `case-${suffix}`,
      client: "Cliente de teste",
      categoryId: ids.category,
      serviceIds: [ids.service],
      summary: "Resumo do case de teste com mais de trinta caracteres.",
      coverId: ids.media,
      galleryIds: [ids.media],
      externalLinks: [{ label: "Matéria", url: "https://exemplo.com.br/materia" }],
      date: "2026-08",
    });
    ids.case = saved.id;
    await runContentCommand(
      deps,
      editor(),
      CASE,
      { id: ids.case, expectedUpdatedAt: await version("cases", ids.case) },
      "publish",
    );
    const { cases } = await fetchCasesAndCategories(anonClient(), supabaseTestEnv.url!);
    const item = cases.find((entry) => entry.id === ids.case);
    expect(item).toMatchObject({ categoryId: ids.category, serviceIds: [ids.service], date: "2026-08" });
    expect(item?.cover?.alt).toBe("Capa do case de teste");
    expect(item?.gallery).toHaveLength(1);
  });

  it("arquivar a categoria de um case publicado é bloqueado (TECH-05)", async () => {
    const deps = cmsDepsFor(users.editor!.client);
    await expect(
      runContentCommand(
        deps,
        editor(),
        CATEGORY,
        { id: ids.category, expectedUpdatedAt: await version("case_categories", ids.category) },
        "archive",
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("FK inválida em vínculo reverte item, serviços e galeria na mesma transação (TECH-13)", async () => {
    const deps = cmsDepsFor(users.editor!.client);
    const beforeCaseQuery = await serviceClient().from("cases").select("title, updated_at").eq("id", ids.case).single();
    if (beforeCaseQuery.error || !beforeCaseQuery.data)
      throw new Error("Case de teste não encontrado antes da gravação atômica.");
    const beforeCase = beforeCaseQuery.data;
    const beforeServices = await must(
      serviceClient().from("case_services").select("service_id").eq("case_id", ids.case),
    );
    const beforeGallery = await must(
      serviceClient().from("case_media").select("media_id, sort_order").eq("case_id", ids.case),
    );

    await expect(
      saveContent(
        deps,
        editor(),
        CASE,
        {
          title: "Título alterado que deve ser revertido",
          slug: `case-${suffix}`,
          client: "Cliente de teste",
          categoryId: ids.category,
          serviceIds: [crypto.randomUUID()],
          summary: "Resumo do case de teste com mais de trinta caracteres.",
          coverId: ids.media,
          galleryIds: [ids.media],
          externalLinks: [{ label: "Matéria", url: "https://exemplo.com.br/materia" }],
          date: "2026-08",
        },
        { id: ids.case, expectedUpdatedAt: beforeCase.updated_at },
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    expect(await must(serviceClient().from("cases").select("title, updated_at").eq("id", ids.case).single())).toEqual(
      beforeCase,
    );
    expect(await must(serviceClient().from("case_services").select("service_id").eq("case_id", ids.case))).toEqual(
      beforeServices,
    );
    expect(
      await must(serviceClient().from("case_media").select("media_id, sort_order").eq("case_id", ids.case)),
    ).toEqual(beforeGallery);
  });
});
