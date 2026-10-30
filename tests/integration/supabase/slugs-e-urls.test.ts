/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : slugs-e-urls.test.ts
 Descrição    : Integração: troca de endereço pelo painel, 301 do antigo e endereço reservado sobre a RLS real (DB-08).

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

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { runContentCommand, saveContent } from "@/lib/server/cms/content-service";
import { SERVICE } from "@/lib/server/cms/entities";
import { resolvePublicSlug } from "@/lib/server/content/supabase/queries";
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

/*
 * Caminho completo de uma troca de endereço: o editor publica e renomeia pelo painel (RLS do
 * editor, trigger track_slug no banco), o visitante resolve o endereço antigo para o novo com
 * a chave anônima (o que o proxy e a API fazem) e, depois da exclusão, o endereço fica
 * reservado: não resolve e não pode ser reaproveitado.
 */
describe.runIf(hasSupabaseTestEnv)("slugs e URLs no Supabase (DB-08)", () => {
  const suffix = testSuffix();
  const slug = (name: string) => `${name}-${suffix}`;
  const users: { editor?: TestUser; admin?: TestUser } = {};
  const ids = { area: "", media: "", service: "" };
  const past = new Date(Date.now() - 86_400_000).toISOString();

  const input = (overrides: Record<string, unknown> = {}) => ({
    name: "Serviço de teste",
    slug: slug("servico"),
    summary: "Resumo do serviço de teste.",
    description: "Descrição completa do serviço de teste do CMS.",
    areaIds: [ids.area],
    imageId: ids.media,
    order: "3",
    ...overrides,
  });
  const actor = (role: "editor" | "admin") => ({ id: users[role]!.id, role });
  const ref = async () => ({
    id: ids.service,
    expectedUpdatedAt: (await serviceClient().from("services").select("updated_at").eq("id", ids.service).single())
      .data!.updated_at as string,
  });
  const resolve = (value: string) => resolvePublicSlug(anonClient(), "service", value);

  beforeAll(async () => {
    [users.editor, users.admin] = await Promise.all([
      createTestUser("editor", suffix),
      createTestUser("admin", suffix),
    ]);
    const admin = serviceClient();
    const [area] = await must(
      admin
        .from("areas")
        .insert({
          slug: slug("area"),
          name: "Área",
          summary: "s",
          description: "d",
          status: "published",
          published_at: past,
        })
        .select("id"),
    );
    ids.area = area.id;
    const [media] = await must(
      admin
        .from("media_assets")
        .insert({ path: `/brand/slug-${suffix}.webp`, mime_type: "image/webp", alt_text: "Imagem" })
        .select("id"),
    );
    ids.media = media.id;
  });

  afterAll(async () => {
    const admin = serviceClient();
    await admin.from("services").delete().like("slug", `%-${suffix}`);
    await admin.from("slug_redirects").delete().like("old_slug", `%-${suffix}`);
    await admin.from("areas").delete().eq("id", ids.area);
    await admin.from("media_assets").delete().eq("id", ids.media);
    await deleteTestUsers(Object.values(users));
  });

  it("editor publica e troca o endereço; o antigo leva ao novo", async () => {
    const deps = cmsDepsFor(users.editor!.client);
    ids.service = (await saveContent(deps, actor("editor"), SERVICE, input())).id;
    await runContentCommand(deps, actor("editor"), SERVICE, await ref(), "publish");
    await saveContent(deps, actor("editor"), SERVICE, input({ slug: slug("servico-novo") }), await ref());

    expect(await resolve(slug("servico"))).toBe(slug("servico-novo"));
    expect(await resolve(slug("servico-novo"))).toBe(slug("servico-novo"));
  });

  it("outro serviço não assume o endereço antigo, nem pelo painel nem direto no banco", async () => {
    await expect(
      saveContent(cmsDepsFor(users.editor!.client), actor("editor"), SERVICE, input({ name: "Outro serviço" })),
    ).rejects.toMatchObject({ fieldErrors: { slug: [expect.stringMatching(/reservado/)] } });
    const { error } = await serviceClient()
      .from("services")
      .insert({ slug: slug("servico"), name: "Outro" });
    expect(error?.code).toBe("23505");
  });

  it("despublicado, o endereço antigo deixa de resolver e some para o visitante", async () => {
    const deps = cmsDepsFor(users.editor!.client);
    await runContentCommand(deps, actor("editor"), SERVICE, await ref(), "unpublish");
    expect(await resolve(slug("servico"))).toBeNull();
    const { data } = await anonClient().from("slug_redirects").select("old_slug").eq("old_slug", slug("servico"));
    expect(data).toEqual([]);
  });

  it("excluído, os endereços ficam reservados e respondem 404", async () => {
    const deps = cmsDepsFor(users.admin!.client);
    await runContentCommand(deps, actor("admin"), SERVICE, await ref(), "archive");
    await runContentCommand(deps, actor("admin"), SERVICE, await ref(), "delete");

    const { data } = await serviceClient()
      .from("slug_redirects")
      .select("old_slug, entity_id")
      .in("old_slug", [slug("servico"), slug("servico-novo")])
      .order("old_slug");
    expect(data).toEqual([
      { old_slug: slug("servico"), entity_id: null },
      { old_slug: slug("servico-novo"), entity_id: null },
    ]);
    expect(await resolve(slug("servico-novo"))).toBeNull();
    await expect(
      saveContent(cmsDepsFor(users.editor!.client), actor("editor"), SERVICE, input({ slug: slug("servico-novo") })),
    ).rejects.toMatchObject({ fieldErrors: { slug: [expect.stringMatching(/reservado/)] } });
  });
});
