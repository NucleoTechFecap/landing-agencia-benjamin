/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : versions.test.ts
 Descrição    : Testes do histórico: quem registra o quê, restauração e permissões.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
 04/11/2026 Vinícius Nishimura Reis  Restauração sem meio-termo, comparação estável e invalidação garantida.
──────────────────────────────────────────────────────────────────────────────
*/

import { beforeEach, describe, expect, it, vi } from "vitest";
import { MEMORY_AUTHOR, createMemoryCmsStore } from "./memory-store";
import { runContentCommand, saveContent, type CmsDeps } from "./content-service";
import { AREA, CATEGORY, PAGE, SERVICE } from "./entities";
import { saveItemSeo, savePageFields } from "./page-content";
import { changeBlock, saveBlock } from "./page-blocks";
import { saveThemeValues } from "./theme-service";
import { saveSiteSettings } from "./settings-service";
import { restoreVersion } from "./versions";
import { siteSettings } from "@/content";
import { editorSections } from "@/lib/domain/content/field-editor";

vi.mock("next/cache", () => ({
  cacheTag: () => {},
  cacheLife: () => {},
  updateTag: () => {},
  revalidateTag: () => {},
}));

const admin = { id: "a", role: "admin" as const };
const editor = { id: "e", role: "editor" as const };
const viewer = { id: "v", role: "viewer" as const };

function setup(seed: Parameters<typeof createMemoryCmsStore>[0] = {}) {
  const { store, tables } = createMemoryCmsStore(seed);
  const audit = vi.fn(async () => undefined);
  const invalidate = vi.fn();
  const deps: CmsDeps = { store, audit, invalidate, now: () => new Date("2026-11-04T12:00:00.000Z") };
  return { deps, store, tables, audit, invalidate };
}

const AREA_INPUT = {
  name: "Social Media",
  slug: "social-media",
  summary: "Resumo da área com tamanho suficiente",
  description: "Descrição da área com tamanho suficiente para publicar",
  highlights: ["Instagram"],
  order: 0,
};

const versionsOf = (tables: { content_versions: { entity: string; entityId: string; action: string }[] }, id: string) =>
  tables.content_versions.filter((version) => version.entityId === id).map((version) => version.action);

describe("registro das versões", () => {
  let context: ReturnType<typeof setup>;
  beforeEach(() => {
    context = setup();
  });

  it("criar gera uma versão; a primeira edição guarda antes como estava", async () => {
    const { deps, tables } = context;
    const created = await saveContent(deps, admin, AREA, AREA_INPUT);
    expect(versionsOf(tables, created.id)).toEqual(["created"]);
    await saveContent(
      deps,
      admin,
      AREA,
      { ...AREA_INPUT, name: "Redes" },
      {
        id: created.id,
        expectedUpdatedAt: created.updatedAt,
      },
    );
    expect(versionsOf(tables, created.id)).toEqual(["created", "updated"]);
  });

  it("item anterior ao histórico ganha o retrato de antes na primeira edição", async () => {
    const { deps, tables, store } = context;
    const { id, updatedAt } = await store.insert("areas", {
      slug: "antiga",
      name: "Antiga",
      summary: "s",
      description: "d",
      status: "draft",
    });
    await saveContent(
      deps,
      admin,
      AREA,
      { ...AREA_INPUT, slug: "antiga", name: "Nova" },
      { id, expectedUpdatedAt: updatedAt },
    );
    const [baseline, updated] = tables.content_versions;
    expect(baseline.action).toBe("baseline");
    expect(baseline.snapshot).toMatchObject({ name: "Antiga" });
    expect(updated.snapshot).toMatchObject({ name: "Nova" });
  });

  it("publicar entra na linha do tempo, sem conteúdo próprio", async () => {
    const { deps, tables, store } = context;
    const created = await saveContent(deps, admin, CATEGORY, { name: "Categoria", slug: "categoria", order: 0 });
    const current = (await store.snapshot()).categories[0];
    await runContentCommand(deps, admin, CATEGORY, { id: created.id, expectedUpdatedAt: current.updatedAt }, "publish");
    const last = tables.content_versions.at(-1)!;
    expect(last.action).toBe("published");
    expect(last.snapshot).toBeNull();
    expect(last.status).toBe("published");
  });

  it("registra quem alterou", async () => {
    const { deps, tables } = context;
    const created = await saveContent(deps, admin, AREA, AREA_INPUT);
    expect(tables.content_versions.find((version) => version.entityId === created.id)?.authorName).toBe(
      MEMORY_AUTHOR.name,
    );
  });

  it("falha ao gravar a versão não desfaz a edição", async () => {
    const { deps, store } = context;
    store.insertVersion = async () => {
      throw new Error("sem tabela");
    };
    await expect(saveContent(deps, admin, AREA, AREA_INPUT)).resolves.toMatchObject({ created: true });
    expect((await store.snapshot()).areas).toHaveLength(1);
  });
});

const seedPage = (overrides: Record<string, unknown> = {}) => ({
  pages: [
    {
      id: "p1",
      slug: "home",
      title: "Home",
      description: null,
      status: "published" as const,
      provisional: false,
      published_at: "2026-11-01T00:00:00.000Z",
      archived_at: null,
      updated_at: "2026-11-01T00:00:00.000Z",
      fields: {},
      seo: {},
      ...overrides,
    },
  ],
});

/** Formulário inteiro da Home com os valores atuais, como o painel envia, trocando só o título. */
function homeForm(titulo: string) {
  const entries = new Map<string, string>();
  for (const section of editorSections("home", { fields: undefined }, siteSettings)) {
    for (const { name, def, value } of section.fields) {
      if (def.kind === "link") {
        const link = value as { label: string; href: string };
        entries.set(`${name}.label`, link.label);
        entries.set(`${name}.href`, link.href);
      } else if (def.kind === "icon") {
        const icon = value as { name: string; color: string };
        entries.set(`${name}.name`, icon.name);
        entries.set(`${name}.color`, icon.color);
      } else if (def.kind === "image") entries.set(name, "");
      else if (def.kind === "lines") entries.set(name, (value as string[]).join("\n"));
      else entries.set(name, String(value));
    }
  }
  entries.set("abertura.titulo", titulo);
  return entries;
}

describe("campos das seções fixas", () => {
  it("salvar sem mudar nada não apaga o que já estava editado", async () => {
    const { deps, tables } = setup(seedPage({ fields: { values: { "abertura.titulo": "Editado" }, hidden: [] } }));
    const changed = await savePageFields(
      deps,
      admin,
      { id: "p1", expectedUpdatedAt: "2026-11-01T00:00:00.000Z" },
      { entries: homeForm("Editado"), hidden: [], settings: siteSettings },
    );
    expect(changed).toBe(false);
    expect((tables.pages[0].fields as { values: object }).values).toEqual({ "abertura.titulo": "Editado" });
  });

  it("grava só o que difere do padrão e recusa o inválido", async () => {
    const { deps, tables, invalidate } = setup(seedPage());
    const ref = { id: "p1", expectedUpdatedAt: "2026-11-01T00:00:00.000Z" };
    await expect(
      savePageFields(deps, admin, ref, { entries: homeForm(""), hidden: [], settings: siteSettings }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });

    const changed = await savePageFields(deps, admin, ref, {
      entries: homeForm("Título novo"),
      hidden: ["cases", "abertura"],
      settings: siteSettings,
    });
    expect(changed).toBe(true);
    const stored = tables.pages[0].fields as { values: Record<string, unknown>; hidden: string[] };
    expect(stored.values["abertura.titulo"]).toBe("Título novo");
    expect(Object.keys(stored.values)).not.toContain("abertura.etiqueta");
    // Só seção marcada como escondível entra na lista.
    expect(stored.hidden).toEqual(["cases"]);
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ entity: "page", slug: "home" }));
  });

  it("leitor não grava", async () => {
    const { deps } = setup(seedPage());
    await expect(
      savePageFields(
        deps,
        viewer,
        { id: "p1", expectedUpdatedAt: "2026-11-01T00:00:00.000Z" },
        {
          entries: homeForm("x"),
          hidden: [],
          settings: siteSettings,
        },
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("quem abriu a tela antes recebe conflito", async () => {
    const { deps } = setup(seedPage());
    await expect(
      savePageFields(
        deps,
        admin,
        { id: "p1", expectedUpdatedAt: "2020-01-01T00:00:00.000Z" },
        {
          entries: homeForm("x"),
          hidden: [],
          settings: siteSettings,
        },
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

const seoInput = {
  title: "SEO novo",
  description: "",
  keywords: "a, b",
  noindex: true,
  ogTitle: "",
  ogDescription: "",
  ogImageId: "",
};

describe("SEO", () => {
  it("grava na página e invalida o site", async () => {
    const { deps, tables, invalidate } = setup(seedPage());
    await saveItemSeo(
      deps,
      editor,
      PAGE,
      "page",
      { id: "p1", expectedUpdatedAt: "2026-11-01T00:00:00.000Z" },
      seoInput,
    );
    expect(tables.pages[0].seo).toEqual({ title: "SEO novo", keywords: ["a", "b"], noindex: true });
    expect(invalidate).toHaveBeenCalled();
  });

  it("imagem que saiu da biblioteca é recusada", async () => {
    const { deps } = setup(seedPage());
    await expect(
      saveItemSeo(
        deps,
        editor,
        PAGE,
        "page",
        { id: "p1", expectedUpdatedAt: "2026-11-01T00:00:00.000Z" },
        {
          ...seoInput,
          ogImageId: "sumiu",
        },
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("nada mudou, nada grava", async () => {
    const { deps, tables } = setup(seedPage({ seo: { title: "Igual" } }));
    const changed = await saveItemSeo(
      deps,
      editor,
      PAGE,
      "page",
      { id: "p1", expectedUpdatedAt: "2026-11-01T00:00:00.000Z" },
      { ...seoInput, title: "Igual", keywords: "", noindex: false },
    );
    expect(changed).toBe(false);
    expect(tables.content_versions).toHaveLength(0);
  });
});

describe("restauração", () => {
  it("volta o conteúdo do item, mantém o endereço e vira versão nova", async () => {
    const { deps, tables, audit, store } = setup();
    const created = await saveContent(deps, admin, AREA, AREA_INPUT);
    const saved = await saveContent(
      deps,
      admin,
      AREA,
      { ...AREA_INPUT, name: "Trocado", slug: "trocado" },
      {
        id: created.id,
        expectedUpdatedAt: created.updatedAt,
      },
    );
    await restoreVersion(deps, admin, {
      entity: "area",
      entityId: created.id,
      version: 1,
      expectedUpdatedAt: saved.updatedAt,
    });
    const area = (await store.snapshot()).areas[0];
    expect(area.name).toBe("Social Media");
    expect(area.slug).toBe("trocado");
    const last = tables.content_versions.at(-1)!;
    expect(last.action).toBe("version_restored");
    expect(last.restoredFrom).toBe(1);
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ event: "content.version_restored" }));
  });

  it("restaura os blocos, os campos e o SEO da página", async () => {
    const { deps, store } = setup(seedPage({ status: "published" }));
    const page = (await store.readPage("p1"))!;
    await saveBlock(
      deps,
      admin,
      { id: "p1", expectedUpdatedAt: page.updatedAt },
      {
        type: "rich-text",
        input: { fields: { title: "" }, paragraphs: ["Primeiro"], items: [], members: [] },
      },
    );
    const withBlock = (await store.readPage("p1"))!;
    const [block] = withBlock.blocks;
    await saveBlock(
      deps,
      admin,
      { id: "p1", expectedUpdatedAt: withBlock.updatedAt },
      {
        blockId: block.id,
        type: "rich-text",
        input: { fields: { title: "" }, paragraphs: ["Segundo"], items: [], members: [] },
      },
    );
    const edited = (await store.readPage("p1"))!;
    await restoreVersion(deps, admin, {
      entity: "page",
      entityId: "p1",
      version: 2,
      expectedUpdatedAt: edited.updatedAt,
    });
    const restored = (await store.readPage("p1"))!;
    expect(restored.blocks[0].content).toMatchObject({ paragraphs: ["Primeiro"] });
  });

  it("página do site volta ao texto original, sem nada gravado", async () => {
    const { deps, store } = setup(seedPage());
    const ref = { id: "p1", expectedUpdatedAt: "2026-11-01T00:00:00.000Z" };
    await savePageFields(deps, admin, ref, { entries: homeForm("Título novo"), hidden: [], settings: siteSettings });
    const edited = (await store.readPage("p1"))!;
    await restoreVersion(deps, admin, {
      entity: "page",
      entityId: "p1",
      version: 1,
      expectedUpdatedAt: edited.updatedAt,
    });
    expect((await store.readPage("p1"))!.fields?.values).toEqual({});
  });

  it("página nova publicada não volta a uma versão sem conteúdo", async () => {
    const { deps, store } = setup(seedPage({ slug: "pagina-nova" }));
    const page = (await store.readPage("p1"))!;
    await saveBlock(
      deps,
      admin,
      { id: "p1", expectedUpdatedAt: page.updatedAt },
      {
        type: "rich-text",
        input: { fields: {}, paragraphs: ["Um"], items: [], members: [] },
      },
    );
    const withBlock = (await store.readPage("p1"))!;
    await expect(
      restoreVersion(deps, admin, {
        entity: "page",
        entityId: "p1",
        version: 1,
        expectedUpdatedAt: withBlock.updatedAt,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("não restaura com a versão desatualizada", async () => {
    const { deps } = setup();
    const created = await saveContent(deps, admin, AREA, AREA_INPUT);
    await expect(
      restoreVersion(deps, admin, {
        entity: "area",
        entityId: created.id,
        version: 1,
        expectedUpdatedAt: "2000-01-01T00:00:00.000Z",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("linha só de mudança de estado não restaura", async () => {
    const { deps, store } = setup();
    const created = await saveContent(deps, admin, CATEGORY, { name: "Categoria", slug: "categoria", order: 0 });
    const current = (await store.snapshot()).categories[0];
    await runContentCommand(deps, admin, CATEGORY, { id: created.id, expectedUpdatedAt: current.updatedAt }, "publish");
    await expect(
      restoreVersion(deps, admin, {
        entity: "category",
        entityId: created.id,
        version: 2,
        expectedUpdatedAt: (await store.snapshot()).categories[0].updatedAt,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  /** Página publicada com duas versões de conteúdo: a 2 é a que traz o bloco "Primeiro". */
  async function pageWithHistory() {
    const context = setup(seedPage({ status: "published" }));
    const { deps, store } = context;
    const page = (await store.readPage("p1"))!;
    await saveBlock(
      deps,
      admin,
      { id: "p1", expectedUpdatedAt: page.updatedAt },
      {
        type: "rich-text",
        input: { fields: { title: "" }, paragraphs: ["Primeiro"], items: [], members: [] },
      },
    );
    const withBlock = (await store.readPage("p1"))!;
    await saveBlock(
      deps,
      admin,
      { id: "p1", expectedUpdatedAt: withBlock.updatedAt },
      {
        blockId: withBlock.blocks[0].id,
        type: "rich-text",
        input: { fields: { title: "" }, paragraphs: ["Segundo"], items: [], members: [] },
      },
    );
    return { ...context, edited: (await store.readPage("p1"))! };
  }

  it("falha ao gravar a página fica registrada como falha na auditoria", async () => {
    const { deps, store, audit, edited } = await pageWithHistory();
    store.savePageDocument = vi.fn().mockRejectedValue(new Error("banco fora"));
    await expect(
      restoreVersion(deps, admin, { entity: "page", entityId: "p1", version: 2, expectedUpdatedAt: edited.updatedAt }),
    ).rejects.toThrow("banco fora");
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ event: "content.version_restored", outcome: "failure" }),
    );
  });

  it("SEO da versão fora das regras atuais é recusado, em vez de virar vazio", async () => {
    const { deps, store, tables, edited } = await pageWithHistory();
    const version = tables.content_versions.find((entry) => entry.entity === "page" && entry.version === 2)!;
    version.snapshot = { ...version.snapshot, seo: { title: 123 } };
    await expect(
      restoreVersion(deps, admin, { entity: "page", entityId: "p1", version: 2, expectedUpdatedAt: edited.updatedAt }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect((await store.readPage("p1"))!.updatedAt).toBe(edited.updatedAt);
  });

  it("leitor vê, mas não restaura", async () => {
    const { deps } = setup();
    const created = await saveContent(deps, admin, AREA, AREA_INPUT);
    await expect(
      restoreVersion(deps, viewer, {
        entity: "area",
        entityId: created.id,
        version: 1,
        expectedUpdatedAt: created.updatedAt,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("editor não restaura a aparência", async () => {
    const { deps } = setup();
    await expect(
      restoreVersion(deps, editor, { entity: "theme", entityId: "site", version: 1, expectedUpdatedAt: null }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("aparência", () => {
  it("grava, registra a versão anterior e volta atrás", async () => {
    const { deps, tables, audit, invalidate, store } = setup();
    await saveThemeValues(deps, admin, { colors: { laranja: "#ff0000" } }, null);
    expect(audit).toHaveBeenCalledWith(expect.objectContaining({ event: "settings.updated" }));
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ entity: "settings" }));
    expect(tables.content_versions.map((version) => version.action)).toEqual(["baseline", "updated"]);

    const first = (await store.readSettings())!;
    expect(first.settings.theme).toEqual({ colors: { laranja: "#ff0000" } });
    await saveThemeValues(deps, admin, { colors: { laranja: "#ff8800" } }, first.updatedAt);

    const second = (await store.readSettings())!;
    await restoreVersion(deps, admin, {
      entity: "theme",
      entityId: "site",
      version: 2,
      expectedUpdatedAt: second.updatedAt,
    });
    expect((await store.readSettings())!.settings.theme).toEqual({ colors: { laranja: "#ff0000" } });
  });

  it("versão fora das regras atuais é recusada, sem apagar a aparência de hoje", async () => {
    const { deps, tables, store } = setup();
    await saveThemeValues(deps, admin, { colors: { laranja: "#ff0000" } }, null);
    const first = (await store.readSettings())!;
    await saveThemeValues(deps, admin, { colors: { laranja: "#ff8800" } }, first.updatedAt);
    const version = tables.content_versions.find((entry) => entry.entity === "theme" && entry.version === 2)!;
    version.snapshot = { colors: { laranja: "não é uma cor" } };
    const second = (await store.readSettings())!;
    await expect(
      restoreVersion(deps, admin, {
        entity: "theme",
        entityId: "site",
        version: 2,
        expectedUpdatedAt: second.updatedAt,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect((await store.readSettings())!.settings.theme).toEqual({ colors: { laranja: "#ff8800" } });
  });

  it("a mesma aparência com as chaves em outra ordem não vira versão nova", async () => {
    const { deps, tables, store } = setup();
    await saveThemeValues(deps, admin, { colors: { laranja: "#ff0000", azul: "#0000aa" } }, null);
    const saved = (await store.readSettings())!;
    const before = tables.content_versions.length;
    const changed = await saveThemeValues(
      deps,
      admin,
      { colors: { azul: "#0000aa", laranja: "#ff0000" } },
      saved.updatedAt,
    );
    expect(changed).toBe(false);
    expect(tables.content_versions).toHaveLength(before);
  });

  it("leitura que falha depois de gravar não impede a invalidação do cache", async () => {
    const { deps, store, invalidate } = setup();
    store.snapshot = vi.fn().mockRejectedValue(new Error("banco fora"));
    await expect(saveThemeValues(deps, admin, { colors: { laranja: "#ff0000" } }, null)).resolves.toBe(true);
    expect(invalidate).toHaveBeenCalledWith(expect.objectContaining({ entity: "settings", relatedPaths: [] }));
  });

  it("recusa contraste ilegível, inclusive ao restaurar", async () => {
    const { deps } = setup();
    await expect(saveThemeValues(deps, admin, { colors: { verde: "#f1fcd0" } }, null)).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
  });

  it("editor não muda a aparência", async () => {
    const { deps } = setup();
    await expect(saveThemeValues(deps, editor, {}, null)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("configurações", () => {
  it("guarda a versão anterior e restaura", async () => {
    const { deps, store } = setup();
    const raw = {
      tagline: "Novo slogan",
      description: "Descrição institucional nova com pelo menos cinquenta caracteres de texto.",
      email: "",
      phone: "",
      address: "",
      mapsUrl: "",
      instagram: "",
      tiktok: "",
      linkedin: "",
    };
    await saveSiteSettings(deps, admin, raw, null);
    const stored = (await store.readSettings())!;
    expect(stored.settings.tagline).toBe("Novo slogan");
    await restoreVersion(deps, admin, {
      entity: "settings",
      entityId: "site",
      version: 1,
      expectedUpdatedAt: stored.updatedAt,
    });
    expect((await store.readSettings())!.settings.tagline).toBe(siteSettings.tagline);
  });
});

describe("blocos descritos por campos", () => {
  it("valida, grava e versiona", async () => {
    const { deps, store, tables } = setup(seedPage({ slug: "pagina-nova", title: "Nova" }));
    const page = (await store.readPage("p1"))!;
    await expect(
      saveBlock(
        deps,
        admin,
        { id: "p1", expectedUpdatedAt: page.updatedAt },
        {
          type: "buttons",
          input: { fields: {}, paragraphs: [], items: [], members: [] },
          entries: new Map([
            ["bloco.titulo", ""],
            ["bloco.texto", ""],
            ["bloco.fundo", "lima"],
            ["bloco.itens.0.label", "Ir"],
            ["bloco.itens.0.href", "javascript:alert(1)"],
          ]),
        },
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });

    await saveBlock(
      deps,
      admin,
      { id: "p1", expectedUpdatedAt: page.updatedAt },
      {
        type: "buttons",
        input: { fields: {}, paragraphs: [], items: [], members: [] },
        entries: new Map([
          ["bloco.titulo", "Vamos"],
          ["bloco.texto", ""],
          ["bloco.fundo", "lima"],
          ["bloco.itens.0.label", "Ir"],
          ["bloco.itens.0.href", "/contato"],
        ]),
      },
    );
    expect((await store.readPage("p1"))!.blocks[0]).toMatchObject({ type: "buttons" });
    expect(tables.content_versions.at(-1)?.summary).toContain("Bloco adicionado");
  });

  it("abertura só nas páginas novas", async () => {
    const { deps, store } = setup(seedPage());
    const page = (await store.readPage("p1"))!;
    await expect(
      saveBlock(
        deps,
        admin,
        { id: "p1", expectedUpdatedAt: page.updatedAt },
        {
          type: "hero",
          input: { fields: {}, paragraphs: [], items: [], members: [] },
          entries: new Map([
            ["bloco.titulo", "T"],
            ["bloco.fundo", "verde"],
          ]),
        },
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
  });

  it("excluir bloco fica no histórico e dá para voltar", async () => {
    const { deps, store } = setup(seedPage({ slug: "pagina-nova" }));
    const page = (await store.readPage("p1"))!;
    await saveBlock(
      deps,
      admin,
      { id: "p1", expectedUpdatedAt: page.updatedAt },
      {
        type: "rich-text",
        input: { fields: {}, paragraphs: ["Um"], items: [], members: [] },
      },
    );
    await saveBlock(
      deps,
      admin,
      { id: "p1", expectedUpdatedAt: (await store.readPage("p1"))!.updatedAt },
      {
        type: "rich-text",
        input: { fields: {}, paragraphs: ["Dois"], items: [], members: [] },
      },
    );
    const two = (await store.readPage("p1"))!;
    await changeBlock(deps, admin, { id: "p1", expectedUpdatedAt: two.updatedAt }, two.blocks[1].id, "excluir");
    const one = (await store.readPage("p1"))!;
    expect(one.blocks).toHaveLength(1);
    await restoreVersion(deps, admin, { entity: "page", entityId: "p1", version: 3, expectedUpdatedAt: one.updatedAt });
    expect((await store.readPage("p1"))!.blocks).toHaveLength(2);
  });
});

describe("serviço", () => {
  async function serviceWithSeo() {
    const context = setup({
      areas: [
        {
          id: "00000000-0000-4000-8000-0000000000a1",
          slug: "area-um",
          name: "Área",
          summary: null,
          description: null,
          highlights: [],
          icon: null,
          sort_order: 0,
          status: "draft",
          provisional: false,
          published_at: null,
          archived_at: null,
          updated_at: "2026-11-01T00:00:00.000Z",
        },
      ],
    });
    const { deps, store } = context;
    const created = await saveContent(deps, admin, SERVICE, {
      name: "Serviço",
      slug: "servico-um",
      areaIds: ["00000000-0000-4000-8000-0000000000a1"],
      order: 0,
    });
    await saveItemSeo(
      deps,
      admin,
      SERVICE,
      "service",
      { id: created.id, expectedUpdatedAt: created.updatedAt },
      seoInput,
    );
    const withSeo = (await store.snapshot()).services[0];
    expect(withSeo.seo?.title).toBe("SEO novo");
    return { ...context, created, withSeo };
  }

  it("falha ao gravar devolve o SEO e fica registrada como falha na auditoria", async () => {
    const { deps, store, audit, created, withSeo } = await serviceWithSeo();
    store.saveWithRelations = vi.fn().mockRejectedValue(new Error("banco fora"));
    await expect(
      restoreVersion(deps, admin, {
        entity: "service",
        entityId: created.id,
        version: 1,
        expectedUpdatedAt: withSeo.updatedAt,
      }),
    ).rejects.toThrow("banco fora");
    expect((await store.snapshot()).services[0].seo?.title).toBe("SEO novo");
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ event: "content.version_restored", outcome: "failure" }),
    );
  });

  it("item arquivado não é restaurado, nem em parte", async () => {
    const { deps, store, tables, created } = await serviceWithSeo();
    const row = tables.services.find((entry) => entry.id === created.id)!;
    row.status = "archived";
    const archived = (await store.snapshot()).services[0];
    await expect(
      restoreVersion(deps, admin, {
        entity: "service",
        entityId: created.id,
        version: 1,
        expectedUpdatedAt: archived.updatedAt,
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_FAILED" });
    expect((await store.snapshot()).services[0].seo?.title).toBe("SEO novo");
  });

  it("restaurar volta as áreas e o SEO", async () => {
    const { deps, store, created, withSeo } = await serviceWithSeo();
    const version = await store.listVersions({ entity: "service", entityId: created.id, limit: 10 });
    expect(version.map((item) => item.action)).toEqual(["updated", "created"]);
    await restoreVersion(deps, admin, {
      entity: "service",
      entityId: created.id,
      version: 1,
      expectedUpdatedAt: withSeo.updatedAt,
    });
    const restored = (await store.snapshot()).services[0];
    expect(restored.seo).toBeUndefined();
    expect(restored.areaIds).toEqual(["00000000-0000-4000-8000-0000000000a1"]);
  });
});
