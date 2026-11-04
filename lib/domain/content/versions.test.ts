/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : versions.test.ts
 Descrição    : Testes da comparação entre versões.

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
import { changeLabel, diffSnapshots, hasSnapshot, historyPath, toSnapshot, versionResource } from "./versions";

describe("toSnapshot", () => {
  it("deixa de fora os campos de controle e o id dos blocos", () => {
    const snapshot = toSnapshot({
      id: "1",
      status: "published",
      publishedAt: "x",
      archivedAt: null,
      updatedAt: "y",
      title: "Título",
      blocks: [{ id: "b1", type: "rich-text", order: 0, content: { paragraphs: ["Oi"] } }],
    });
    expect(snapshot).toEqual({
      title: "Título",
      blocks: [{ type: "rich-text", content: { paragraphs: ["Oi"] } }],
    });
  });
});

describe("diffSnapshots", () => {
  it("só lista o que mudou", () => {
    expect(diffSnapshots({ title: "A", summary: "S" }, { title: "B", summary: "S" })).toEqual([
      { path: "title", before: "A", after: "B" },
    ]);
  });

  it("imagem e link contam como um valor só", () => {
    const changes = diffSnapshots(
      { image: { src: "/a.webp", alt: "Antes" }, botao: { label: "Ir", href: "/a" } },
      { image: { src: "/b.webp", alt: "Depois" }, botao: { label: "Ir", href: "/b" } },
    );
    expect(changes).toEqual([
      { path: "image", before: "Antes", after: "Depois" },
      { path: "botao", before: "Ir → /a", after: "Ir → /b" },
    ]);
  });

  it("campo novo aparece vazio do outro lado", () => {
    expect(diffSnapshots({}, { title: "Novo" })).toEqual([{ path: "title", before: "", after: "Novo" }]);
  });

  it("vazio e ausente são a mesma coisa", () => {
    expect(diffSnapshots({ description: "" }, { description: null })).toEqual([]);
    expect(diffSnapshots({ examples: [] }, {})).toEqual([]);
  });

  it("id vira o nome do item, e o que sumiu é dito com todas as letras", () => {
    const id = "00000000-0000-4000-8000-000000000001";
    const other = "00000000-0000-4000-8000-000000000002";
    const nameOf = (value: string) => (value === id ? "Social Media" : undefined);
    expect(diffSnapshots({ areaIds: [id] }, { areaIds: [other] }, nameOf)).toEqual([
      { path: "areaIds", before: "Social Media", after: "Item que não existe mais" },
    ]);
  });

  it("os campos do catálogo ficam com a chave inteira", () => {
    const changes = diffSnapshots(
      { fields: { values: { "areas.titulo": "A" }, hidden: [] } },
      { fields: { values: { "areas.titulo": "B" }, hidden: [] } },
    );
    expect(changes[0].path).toBe("fields.values.areas.titulo");
  });
});

describe("rótulos e caminhos", () => {
  it("usa o nome da tela e cai no caminho se não souber", () => {
    expect(changeLabel("title")).toBe("Título");
    expect(changeLabel("seo.ogImage")).toBe("Compartilhamento: imagem");
    expect(changeLabel("outro.campo")).toBe("outro.campo");
    expect(changeLabel("x", () => "Da tela")).toBe("Da tela");
  });

  it("mudança de estado não tem o que restaurar", () => {
    expect(hasSnapshot("published")).toBe(false);
    expect(hasSnapshot("deleted")).toBe(false);
    expect(hasSnapshot("updated")).toBe(true);
    expect(hasSnapshot("baseline")).toBe(true);
  });

  it("aparência e configurações respondem por settings", () => {
    expect(versionResource("theme")).toBe("settings");
    expect(versionResource("settings")).toBe("settings");
    expect(versionResource("page")).toBe("page");
    expect(historyPath("page", "1", 2)).toBe("/admin/historico/page/1/2");
  });
});
