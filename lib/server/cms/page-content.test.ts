/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : page-content.test.ts
 Descrição    : O formulário de cada página do catálogo, enviado sem mudanças, não dá erro nem grava nada.

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

import { describe, expect, it, vi } from "vitest";
import { siteSettings } from "@/content";
import { CATALOG_SLUGS, PAGE_CATALOG, diffFromDefaults, type CatalogPage } from "@/lib/domain/content/catalog";
import { editorSections } from "@/lib/domain/content/field-editor";
import type { FieldDef } from "@/lib/domain/content/fields";
import { readPageForm } from "./page-content";

vi.mock("next/cache", () => ({
  cacheTag: () => {},
  cacheLife: () => {},
  updateTag: () => {},
  revalidateTag: () => {},
}));

/** O que o navegador manda com o campo sem mudança: a mesma lógica dos controles de field-editor.tsx. */
function toEntries(def: FieldDef, name: string, value: unknown, entries: Map<string, string>) {
  switch (def.kind) {
    case "link": {
      const link = value as { label: string; href: string } | null;
      entries.set(`${name}.label`, link?.label ?? "");
      entries.set(`${name}.href`, link?.href ?? "");
      break;
    }
    case "icon": {
      const icon = value as { name: string; color: string } | null;
      entries.set(`${name}.name`, icon?.name ?? "");
      entries.set(`${name}.color`, icon?.color ?? "verde");
      break;
    }
    case "image":
      entries.set(name, "");
      break;
    case "lines":
      entries.set(name, (value as string[]).join("\n"));
      break;
    case "list":
      (value as Record<string, unknown>[]).forEach((row, index) => {
        for (const [key, item] of Object.entries(def.item))
          toEntries(item, `${name}.${index}.${key}`, row[key], entries);
      });
      break;
    default:
      entries.set(name, String(value ?? ""));
  }
}

describe.each(CATALOG_SLUGS)("formulário de %s", (slug) => {
  const catalog = PAGE_CATALOG[slug] as CatalogPage;
  const sections = editorSections(slug, {}, siteSettings);
  const entries = new Map<string, string>();
  for (const section of sections) {
    for (const { name, def, value } of section.fields) toEntries(def, name, value, entries);
  }
  const { values, errors } = readPageForm(catalog, entries, [], {}, siteSettings);

  it("enviado sem mudanças, não tem erro", () => {
    expect(errors).toEqual({});
  });

  it("enviado sem mudanças, nada difere do padrão", () => {
    expect(diffFromDefaults(slug, values, siteSettings)).toEqual({});
  });
});
