/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Testes de integração
 Arquivo      : cms-gravacao-atomica.test.ts
 Descrição    : Gravação atômica do CMS, do serviço de conteúdo até o banco real com RLS.

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
 02/11/2026 Vinícius Nishimura Reis  Criação inicial (TECH-13, #314).
──────────────────────────────────────────────────────────────────────────────
*/

import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { saveContent } from "@/lib/server/cms/content-service";
import { CASE, SERVICE } from "@/lib/server/cms/entities";
import {
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

describe.runIf(hasSupabaseTestEnv)("gravação atômica do CMS (TECH-13, #314)", () => {
  const suffix = testSuffix();
  const users: { editor?: TestUser; viewer?: TestUser } = {};
  const ids = { area: "", areaOther: "", service: "", serviceOther: "", media: "", case: "" };

  beforeAll(async () => {
    [users.editor, users.viewer] = await Promise.all([
      createTestUser("editor", suffix),
      createTestUser("viewer", suffix),
    ]);
    const admin = serviceClient();
    const [area, areaOther] = await must(
      admin
        .from("areas")
        .insert([
          { slug: `area-a-${suffix}`, name: "Área A" },
          { slug: `area-b-${suffix}`, name: "Área B" },
        ])
        .select("id"),
    );
    const [service, serviceOther] = await must(
      admin
        .from("services")
        .insert([
          { slug: `servico-a-${suffix}`, name: "Serviço A" },
          { slug: `servico-b-${suffix}`, name: "Serviço B" },
        ])
        .select("id"),
    );
    const [media] = await must(
      admin
        .from("media_assets")
        .insert({
          path: `atomica/${suffix}.webp`,
          mime_type: "image/webp",
          size_bytes: 10,
          width: 10,
          height: 10,
          alt_text: "Imagem",
        })
        .select("id"),
    );
    Object.assign(ids, {
      area: area.id,
      areaOther: areaOther.id,
      service: service.id,
      serviceOther: serviceOther.id,
      media: media.id,
    });
    await must(admin.from("service_areas").insert({ service_id: ids.service, area_id: ids.area }).select());
  });

  afterAll(async () => {
    const admin = serviceClient();
    await admin.from("cases").delete().like("slug", `%-${suffix}`);
    await admin.from("services").delete().like("slug", `%-${suffix}`);
    await admin.from("areas").delete().like("slug", `%-${suffix}`);
    await admin.from("media_assets").delete().eq("id", ids.media);
    await deleteTestUsers(Object.values(users));
  });

  const editor = () => ({ id: users.editor!.id, role: "editor" as const });
  const editorDeps = () => cmsDepsFor(users.editor!.client);
  const version = async (table: "services" | "cases", id: string) =>
    (await serviceClient().from(table).select("updated_at").eq("id", id).single()).data!.updated_at as string;
  const serviceInput = (areaIds: string[], name = "Serviço A") => ({
    slug: `servico-a-${suffix}`,
    name,
    areaIds,
    order: "1",
  });
  const caseInput = (serviceIds: string[], galleryIds: string[], title = "Case A") => ({
    slug: `case-a-${suffix}`,
    title,
    serviceIds,
    galleryIds,
    order: "1",
  });

  it("serviço: área inexistente desfaz o texto e mantém os vínculos", async () => {
    const before = await version("services", ids.service);
    await expect(
      saveContent(editorDeps(), editor(), SERVICE, serviceInput([ids.areaOther, randomUUID()], "Não deve ficar"), {
        id: ids.service,
        expectedUpdatedAt: before,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT", message: expect.stringContaining("Nada foi salvo") });

    const admin = serviceClient();
    const service = await admin.from("services").select("name, updated_at").eq("id", ids.service).single();
    expect(service.data).toEqual({ name: "Serviço A", updated_at: before });
    const links = await admin.from("service_areas").select("area_id").eq("service_id", ids.service);
    expect(links.data).toEqual([{ area_id: ids.area }]);
  });

  it("case novo: serviço inexistente não deixa rascunho para trás", async () => {
    await expect(saveContent(editorDeps(), editor(), CASE, caseInput([randomUUID()], []))).rejects.toMatchObject({
      code: "CONFLICT",
    });
    const rows = await serviceClient().from("cases").select("id").eq("slug", `case-a-${suffix}`);
    expect(rows.data).toEqual([]);
  });

  it("case: grava item, serviços e galeria; a versão devolvida vale para o próximo save", async () => {
    const created = await saveContent(editorDeps(), editor(), CASE, caseInput([ids.service], [ids.media]));
    ids.case = created.id;
    expect(created).toMatchObject({ created: true, status: "draft" });
    expect(created.updatedAt).toBe(await version("cases", ids.case));

    const edited = await saveContent(
      editorDeps(),
      editor(),
      CASE,
      caseInput([ids.serviceOther], [], "Case A editado"),
      { id: ids.case, expectedUpdatedAt: created.updatedAt },
    );
    expect(edited).toMatchObject({ created: false, id: ids.case });

    const admin = serviceClient();
    expect((await admin.from("cases").select("title").eq("id", ids.case).single()).data?.title).toBe("Case A editado");
    expect((await admin.from("case_services").select("service_id").eq("case_id", ids.case)).data).toEqual([
      { service_id: ids.serviceOther },
    ]);
    expect((await admin.from("case_media").select("media_id").eq("case_id", ids.case)).data).toEqual([]);
  });

  it("case: imagem inexistente, a última etapa, desfaz o texto e os serviços", async () => {
    const before = await version("cases", ids.case);
    await expect(
      saveContent(editorDeps(), editor(), CASE, caseInput([ids.service], [randomUUID()], "Não deve ficar"), {
        id: ids.case,
        expectedUpdatedAt: before,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const admin = serviceClient();
    const item = await admin.from("cases").select("title, updated_at").eq("id", ids.case).single();
    expect(item.data).toEqual({ title: "Case A editado", updated_at: before });
    expect((await admin.from("case_services").select("service_id").eq("case_id", ids.case)).data).toEqual([
      { service_id: ids.serviceOther },
    ]);
  });

  it("versão desatualizada: o banco recusa mesmo que o serviço de conteúdo já tenha conferido", async () => {
    await expect(
      users.editor!.client.rpc("save_service", {
        p_id: ids.service,
        p_expected_updated_at: "2000-01-01T00:00:00Z",
        p_values: SERVICE.toValues(SERVICE.inputSchema.parse(serviceInput([ids.area]))),
        p_area_ids: [ids.area],
      }),
    ).resolves.toMatchObject({ error: { code: "40001" } });
  });

  it("leitor: a RLS e a função barram a chamada direta, sem passar pelo serviço", async () => {
    const { error } = await users.viewer!.client.rpc("save_service", {
      p_id: ids.service,
      p_expected_updated_at: await version("services", ids.service),
      p_values: SERVICE.toValues(SERVICE.inputSchema.parse(serviceInput([ids.area], "Do leitor"))),
      p_area_ids: [ids.area],
    });
    expect(error?.code).toBe("42501");
    const service = await serviceClient().from("services").select("name").eq("id", ids.service).single();
    expect(service.data?.name).toBe("Serviço A");
  });
});
