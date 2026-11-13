/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : catalog.test.ts
 Descrição    : Testes do catálogo de campos editáveis: padrões válidos, nomes e leitura do banco.

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
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { siteSettings } from "@/content";
import { fieldDefault, fieldSchema, type FieldDef } from "../fields";
import { CATALOG_SLUGS, PAGE_CATALOG, parsePageFields, type CatalogPage } from ".";

interface CatalogEntry {
  slug: string;
  sectionId: string;
  fieldId: string;
  key: string;
  field: FieldDef;
}

const SAFE_ID = /^[a-zA-Z0-9]+$/;

const pageOf = (slug: string) => PAGE_CATALOG[slug as keyof typeof PAGE_CATALOG] as CatalogPage;

const entries: CatalogEntry[] = CATALOG_SLUGS.flatMap((slug) =>
  Object.entries(pageOf(slug).sections).flatMap(([sectionId, section]) =>
    Object.entries(section.fields).map(([fieldId, field]) => ({
      slug,
      sectionId,
      fieldId,
      key: `${sectionId}.${fieldId}`,
      field,
    })),
  ),
);

/** Padrão do campo; o que vem da configuração institucional sai de content/site.ts. */
const defaultOf = (field: FieldDef) => fieldDefault(field, siteSettings);

const issuesOf = (field: FieldDef, value: unknown) => {
  const parsed = fieldSchema(field).safeParse(value);
  return parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
};

describe("catálogo de campos editáveis", () => {
  it("todo campo tem nome e padrão aceitos pela própria regra", () => {
    const invalid = entries.flatMap(({ slug, key, field }) =>
      issuesOf(field, defaultOf(field)).map((issue) => `${slug} ${key} ${issue}`),
    );
    expect(invalid).toEqual([]);
  });

  it("campo que vem da configuração institucional não guarda texto próprio no código", () => {
    const fromSettings = entries.filter(
      ({ field }) => (field.kind === "text" || field.kind === "lines") && field.fromSettings,
    );
    expect(fromSettings.length).toBeGreaterThan(0);
    for (const { field } of fromSettings) expect(defaultOf(field)).not.toEqual(field.default);
  });

  it("seções e campos têm nomes seguros: a chave gravada é `secao.campo`", () => {
    const invalid = entries.filter(({ sectionId, fieldId }) => !SAFE_ID.test(sectionId) || !SAFE_ID.test(fieldId));
    expect(invalid.map(({ slug, key }) => `${slug} ${key}`)).toEqual([]);
  });

  it("os campos de uma lista também têm nomes seguros", () => {
    const invalid = entries.flatMap(({ slug, key, field }) =>
      field.kind === "list"
        ? Object.keys(field.item)
            .filter((itemId) => !SAFE_ID.test(itemId))
            .map((itemId) => `${slug} ${key}.${itemId}`)
        : [],
    );
    expect(invalid).toEqual([]);
  });

  it("rota tem endereço e SEO próprios; geral e modelo não são páginas", () => {
    for (const slug of CATALOG_SLUGS) {
      const page = pageOf(slug);
      if (page.kind === "rota") {
        expect(page.path, slug).toMatch(/^\//);
        expect(page.seo?.title, slug).toBeTruthy();
      } else {
        expect(page.path, slug).toBeNull();
        expect(page.seo, slug).toBeUndefined();
      }
    }
  });
});

describe("valor gravado no banco (parsePageFields)", () => {
  it.each(entries.map((entry) => [`${entry.slug} ${entry.key}`, entry] as const))(
    "%s: guarda o valor válido e descarta o inválido",
    (_name, { slug, key, field }) => {
      const value = defaultOf(field);
      const valid = parsePageFields(slug, { values: { [key]: value } });
      expect(valid.fields.values[key]).toEqual(value);
      expect(valid.problems).toEqual([]);

      // Um objeto qualquer não é texto, linhas, link, imagem, ícone, cor, opção nem lista.
      const invalid = parsePageFields(slug, { values: { [key]: { invalido: true } } });
      expect(invalid.fields.values).toEqual({});
      expect(invalid.problems).toHaveLength(1);
      expect(invalid.problems[0]).toContain(key);
    },
  );

  it.each(CATALOG_SLUGS)("%s: campo desconhecido sai e é apontado, sem derrubar a página", (slug) => {
    const { fields, problems } = parsePageFields(slug, { values: { "secaoInexistente.campo": "texto" } });
    expect(fields.values).toEqual({});
    expect(problems).toEqual(["secaoInexistente.campo: campo desconhecido"]);
  });

  it("só seção que aceita ser escondida entra na lista de escondidas", () => {
    for (const slug of CATALOG_SLUGS) {
      const sections = Object.entries(pageOf(slug).sections);
      const hideable = sections.filter(([, section]) => section.hideable).map(([id]) => id);
      const { fields } = parsePageFields(slug, { hidden: sections.map(([id]) => id) });
      expect(fields.hidden, slug).toEqual(hideable);
    }
  });
});
