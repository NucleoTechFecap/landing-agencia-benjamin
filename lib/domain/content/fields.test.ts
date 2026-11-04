/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : fields.test.ts
 Descrição    : Testes dos campos editáveis: destinos seguros, leitura de formulário e listas.

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
import {
  IMAGE_DEFAULT,
  IMAGE_NONE,
  fieldSchema,
  fillText,
  icon,
  isExternalHref,
  isValidLinkHref,
  link,
  list,
  optionalImage,
  optionalLink,
  optionalText,
  readFields,
  requiredImage,
  sameFieldValue,
  text,
} from "./fields";

const context = {
  media: (id: string) => (id === "foto" ? { src: "/brand/foto.webp", alt: "Foto" } : undefined),
};
const entries = (values: Record<string, string>) => new Map(Object.entries(values));

describe("destino de link", () => {
  it.each([
    "/contato",
    "/contato?tipo=contato#formulario",
    "/pagina-nova",
    "https://benjamin.com.br/x",
    "mailto:a@b.com",
    "tel:+551133333333",
  ])("aceita %s", (href) => expect(isValidLinkHref(href)).toBe(true));

  it.each([
    "javascript:alert(1)",
    "JAVASCRIPT:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "//golpe.com",
    "http://sem-https.com",
    "https://usuario:senha@golpe.com",
    "/com espaço",
    "vbscript:x",
  ])("recusa %s", (href) => expect(isValidLinkHref(href)).toBe(false));

  it("só o que sai do site abre em nova aba", () => {
    expect(isExternalHref("https://x.com")).toBe(true);
    expect(isExternalHref("/contato")).toBe(false);
    expect(isExternalHref("mailto:a@b.com")).toBe(false);
  });
});

describe("regra de cada campo", () => {
  it("texto obrigatório recusa o que fica em branco, e o opcional aceita", () => {
    expect(fieldSchema(text("T", "x")).safeParse("   ").success).toBe(false);
    expect(fieldSchema(optionalText("T", "x")).safeParse("   ").success).toBe(true);
  });

  it("texto respeita o limite", () => {
    expect(fieldSchema(text("T", "x", { max: 3 })).safeParse("abcd").success).toBe(false);
  });

  it("texto que é destino passa pela regra dos links", () => {
    const href = text("Destino", "", { format: "href" });
    expect(fieldSchema(href).safeParse("javascript:alert(1)").success).toBe(false);
    expect(fieldSchema(href).safeParse("/contato").success).toBe(true);
  });

  it("ícone só do catálogo da marca", () => {
    const field = icon("I", "raio");
    expect(fieldSchema(field).safeParse({ name: "raio", color: "lima" }).success).toBe(true);
    expect(fieldSchema(field).safeParse({ name: "../../etc", color: "lima" }).success).toBe(false);
    expect(fieldSchema(field).safeParse({ name: "raio", color: "preto" }).success).toBe(false);
  });

  it("imagem só de /public ou do bucket de mídia", () => {
    const field = requiredImage("I");
    expect(fieldSchema(field).safeParse({ src: "/brand/a.webp", alt: "" }).success).toBe(true);
    expect(fieldSchema(field).safeParse({ src: "https://golpe.com/a.webp", alt: "" }).success).toBe(false);
    expect(fieldSchema(field).safeParse(null).success).toBe(false);
  });

  it("imagem do mesmo endereço é a mesma imagem, mesmo com outro texto alternativo", () => {
    const field = optionalImage("I", null);
    expect(sameFieldValue(field, { src: "/a.webp", alt: "Um" }, { src: "/a.webp", alt: "Dois" })).toBe(true);
    expect(sameFieldValue(field, { src: "/a.webp", alt: "" }, { src: "/b.webp", alt: "" })).toBe(false);
  });
});

describe("leitura do formulário", () => {
  const read = (fields: Parameters<typeof readFields>[0], values: Record<string, string>) =>
    readFields(fields, entries(values), context, "secao");

  it("nomeia o erro pelo campo do formulário", () => {
    const { errors } = read({ titulo: text("Título", "x") }, { "secao.titulo": "" });
    expect(errors["secao.titulo"]).toEqual(["Preencha este campo."]);
  });

  it("link lê texto e destino, e o destino inválido fica no campo certo", () => {
    const { errors } = read(
      { botao: link("Botão", { label: "a", href: "/" }) },
      { "secao.botao.label": "Clique", "secao.botao.href": "javascript:alert(1)" },
    );
    expect(Object.keys(errors)).toEqual(["secao.botao.href"]);
  });

  it("link opcional em branco vira nenhum", () => {
    const { values } = read(
      { botao: optionalLink("Botão", null) },
      { "secao.botao.label": "", "secao.botao.href": "" },
    );
    expect(values.botao).toBeNull();
  });

  it("imagem: padrão, nenhuma, da biblioteca ou removida", () => {
    const field = { imagem: optionalImage("I", { src: "/padrao.webp", alt: "" }) };
    expect(read(field, { "secao.imagem": IMAGE_DEFAULT }).values.imagem).toEqual({ src: "/padrao.webp", alt: "" });
    expect(read(field, { "secao.imagem": IMAGE_NONE }).values.imagem).toBeNull();
    expect(read(field, { "secao.imagem": "foto" }).values.imagem).toEqual({ src: "/brand/foto.webp", alt: "Foto" });
    expect(read(field, { "secao.imagem": "apagada" }).errors["secao.imagem"]).toBeDefined();
  });

  it("lista lê as linhas pela ordem da tela, mesmo com buraco na numeração", () => {
    const field = {
      itens: list("Itens", { titulo: text("T", "") }, [], { itemLabel: "Item", minItems: 1, maxItems: 3 }),
    };
    const { values } = read(field, { "secao.itens.0.titulo": "Um", "secao.itens.5.titulo": "Dois" });
    expect(values.itens).toEqual([{ titulo: "Um" }, { titulo: "Dois" }]);
  });

  it("lista respeita o mínimo e o máximo", () => {
    const field = {
      itens: list("Itens", { titulo: text("T", "") }, [], { itemLabel: "Item", minItems: 1, maxItems: 1 }),
    };
    expect(read(field, {}).errors["secao.itens"]).toBeDefined();
    expect(
      read(field, { "secao.itens.0.titulo": "A", "secao.itens.1.titulo": "B" }).errors["secao.itens"],
    ).toBeDefined();
  });
});

describe("fillText", () => {
  it("troca as chaves conhecidas e deixa à vista as desconhecidas", () => {
    expect(fillText("{total} cases de {area}", { total: 3 })).toBe("3 cases de {area}");
  });
});
