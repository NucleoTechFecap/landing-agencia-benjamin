/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : slug.test.ts
 Descrição    : Testes de slug e de visibilidade pública.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { isValidSlug, slugify, uniqueSlug, validateSlug } from "./slug";
import { isPubliclyVisible, visibleSorted } from "./visibility";

describe("slug", () => {
  it("remove acentos, símbolos e espaços", () => {
    expect(slugify("Assessoria de Imprensa / PR")).toBe("assessoria-de-imprensa-pr");
    expect(slugify("Design & Identidade Visual")).toBe("design-e-identidade-visual");
    expect(slugify("  Comunicação   Interna  ")).toBe("comunicacao-interna");
  });

  it("valida formato, tamanho e palavras reservadas", () => {
    expect(isValidSlug("social-media")).toBe(true);
    expect(validateSlug("Social-Media")).toBe("format");
    expect(validateSlug("a")).toBe("length");
    expect(validateSlug("admin")).toBe("reserved");
    expect(validateSlug("duplo--hifen")).toBe("format");
  });

  it("gera slug único com sufixo", () => {
    expect(uniqueSlug("Audiovisual", ["audiovisual", "audiovisual-2"])).toBe("audiovisual-3");
    expect(uniqueSlug("Admin", [])).toBe("admin-2");
  });
});

describe("visibilidade pública", () => {
  const now = new Date("2026-10-13T12:00:00.000Z");

  it("só exibe publicados com data já alcançada", () => {
    expect(isPubliclyVisible({ status: "published", publishedAt: "2026-10-01T00:00:00Z" }, now)).toBe(true);
    expect(isPubliclyVisible({ status: "published", publishedAt: "2026-12-01T00:00:00Z" }, now)).toBe(false);
    expect(isPubliclyVisible({ status: "published", publishedAt: null }, now)).toBe(false);
    expect(isPubliclyVisible({ status: "draft", publishedAt: "2026-10-01T00:00:00Z" }, now)).toBe(false);
    expect(isPubliclyVisible({ status: "archived", publishedAt: "2026-10-01T00:00:00Z" }, now)).toBe(false);
  });

  it("ordena por ordem e depois por nome", () => {
    const items = [
      { name: "B", order: 1, status: "published" as const, publishedAt: "2026-10-01T00:00:00Z" },
      { name: "A", order: 1, status: "published" as const, publishedAt: "2026-10-01T00:00:00Z" },
      { name: "C", order: 0, status: "published" as const, publishedAt: "2026-10-01T00:00:00Z" },
      { name: "D", order: 0, status: "draft" as const, publishedAt: null },
    ];
    expect(visibleSorted(items, (item) => item.name, now).map((item) => item.name)).toEqual(["C", "A", "B"]);
  });
});
