/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : cta-schema.test.ts
 Descrição    : Testes da validação de destino e posição do CTA no CMS.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-11).
──────────────────────────────────────────────────────────────────────────────
*/

import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { seedSnapshot } from "@/content";
import {
  CTA_PAGE_LABELS,
  ctaInputSchema,
  ctaTargetOptions,
  describeCtaTarget,
  validateCtaForPublish,
} from "./cta-schema";
import { PUBLIC_ROUTE_PREFIXES } from "./integrity";
import type { Area, CaseStudy, Service } from "./types";

const ID = "8b4f6a52-6c43-4a8f-9d55-2f5a2f6f0c11";
const base = { label: "Fale com a gente", placement: "footer", order: "1" };
const parse = (values: Record<string, unknown>) => ctaInputSchema.safeParse({ ...base, ...values });
const errorsOn = (values: Record<string, unknown>, field: string) => {
  const result = parse(values);
  expect(result.success).toBe(false);
  return result.error!.issues.filter((issue) => issue.path[0] === field).map((issue) => issue.message);
};

describe("destino do CTA (ADM-11)", () => {
  it.each([
    [
      { targetKind: "internal", targetPath: "/servicos" },
      { kind: "internal", path: "/servicos" },
    ],
    [
      { targetKind: "external", targetUrl: "https://exemplo.com/a?b=1" },
      { kind: "external", url: "https://exemplo.com/a?b=1" },
    ],
    [
      { targetKind: "service", targetId: ID },
      { kind: "service", serviceId: ID },
    ],
    [
      { targetKind: "case", targetId: ID },
      { kind: "case", caseId: ID },
    ],
    [
      { targetKind: "area", targetId: ID },
      { kind: "area", areaId: ID },
    ],
    [{ targetKind: "contact" }, { kind: "contact" }],
    [
      { targetKind: "contact", targetId: ID },
      { kind: "contact", serviceId: ID },
    ],
  ])("aceita %j", (values, target) => {
    expect(parse(values).data).toMatchObject({ label: "Fale com a gente", placement: "footer", order: 1, target });
  });

  it("usa só o campo do tipo escolhido: sobra de outro tipo não vira destino", () => {
    const result = parse({
      targetKind: "internal",
      targetPath: "/sobre",
      targetUrl: "javascript:alert(1)",
      targetId: "qualquer",
    });
    expect(result.data?.target).toEqual({ kind: "internal", path: "/sobre" });
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://exemplo.com",
    "//exemplo.com",
    "exemplo.com",
    "HTTPS://exemplo.com",
    "https://",
    "https://exemplo.com/com espaço",
    "https://fecap.br@golpe.example",
    "https://usuario:senha@exemplo.com",
    `https://exemplo.com/${"a".repeat(500)}`,
    "",
  ])("recusa o link externo %j", (targetUrl) => {
    expect(errorsOn({ targetKind: "external", targetUrl }, "targetUrl")).toHaveLength(1);
  });

  it.each([
    "javascript:alert(1)",
    "//exemplo.com",
    "/\\exemplo.com",
    "https://exemplo.com",
    "/admin",
    "/api/v1/ctas",
    "/nao-existe",
    "/servicos/nao-existe",
    "/servicos/../admin",
    "/contato#formulario",
    "/sobre?x=1",
    "",
  ])("recusa a página %j: só vale a lista exata", (targetPath) => {
    expect(errorsOn({ targetKind: "internal", targetPath }, "targetPath")).toHaveLength(1);
  });

  it.each(["service", "case", "area"])("%s exige um item escolhido, com id válido", (targetKind) => {
    expect(errorsOn({ targetKind }, "targetId")).toHaveLength(1);
    expect(errorsOn({ targetKind, targetId: "1; drop table" }, "targetId")).toEqual(["Seleção inválida."]);
  });

  it("contato com serviço pré-selecionado também exige id válido", () => {
    expect(errorsOn({ targetKind: "contact", targetId: "abc" }, "targetId")).toEqual(["Seleção inválida."]);
  });

  it("tipo de destino desconhecido é recusado", () => {
    expect(errorsOn({ targetKind: "script", targetPath: "/sobre" }, "targetKind")).toHaveLength(1);
  });

  it("toda página oferecida é uma rota pública que existe no site", () => {
    expect(Object.keys(CTA_PAGE_LABELS).sort()).toEqual([...PUBLIC_ROUTE_PREFIXES].sort());
    for (const path of Object.keys(CTA_PAGE_LABELS)) {
      expect(existsSync(join(process.cwd(), "app", "(site)", path, "page.tsx")), path).toBe(true);
    }
  });
});

describe("posição do CTA (ADM-11)", () => {
  it.each(["home-hero", "home-highlight", "footer", "service-detail", "case-detail"])("aceita %s", (placement) => {
    expect(parse({ placement, targetKind: "internal", targetPath: "/sobre" }).success).toBe(true);
  });

  it.each(["sidebar", "", undefined])("recusa %j", (placement) => {
    expect(errorsOn({ placement, targetKind: "contact" }, "placement")).toHaveLength(1);
  });

  it.each(["home-hero", "home-highlight"])("botão em %s não pode levar à própria Home", (placement) => {
    expect(errorsOn({ placement, targetKind: "internal", targetPath: "/" }, "targetPath")).toEqual([
      "Este botão já fica na Home e levaria para ela mesma. Escolha outra página.",
    ]);
  });

  it.each(["footer", "service-detail", "case-detail"])("em %s, levar à Home não é circular", (placement) => {
    expect(parse({ placement, targetKind: "internal", targetPath: "/" }).success).toBe(true);
  });
});

describe("texto e ordem do CTA (ADM-11)", () => {
  const destination = { targetKind: "contact" };

  it("texto vai de 2 a 40 caracteres, sem contar espaços nas pontas", () => {
    expect(parse({ ...destination, label: "  Ir  " }).data?.label).toBe("Ir");
    expect(parse({ ...destination, label: "a".repeat(40) }).success).toBe(true);
    expect(errorsOn({ ...destination, label: " a " }, "label")).toHaveLength(1);
    expect(errorsOn({ ...destination, label: "a".repeat(41) }, "label")).toHaveLength(1);
  });

  it("ordem em branco vira 0; negativa ou quebrada é recusada", () => {
    expect(parse({ ...destination, order: "" }).data?.order).toBe(0);
    expect(errorsOn({ ...destination, order: "-1" }, "order")).toHaveLength(1);
    expect(errorsOn({ ...destination, order: "1.5" }, "order")).toHaveLength(1);
  });
});

describe("validateCtaForPublish (ADM-11)", () => {
  const cta = { label: "Fale com a gente", placement: "footer" as const, order: 1 };

  it("os CTAs do conteúdo versionado seguem válidos", () => {
    expect(seedSnapshot.ctas.flatMap(validateCtaForPublish)).toEqual([]);
  });

  it("destino excluído (coluna nula) impede publicar, com o nome do campo", () => {
    expect(validateCtaForPublish({ ...cta, target: { kind: "service", serviceId: "" } })).toEqual([
      "Destino: Escolha o serviço de destino.",
    ]);
  });

  it("linha gravada fora do painel passa pelas mesmas regras", () => {
    expect(validateCtaForPublish({ ...cta, target: { kind: "internal", path: "/servicos/nao-existe" } })).toEqual([
      "Página: Escolha uma página da lista: este destino não existe no site.",
    ]);
    expect(validateCtaForPublish({ ...cta, placement: "home-hero", target: { kind: "internal", path: "/" } })).toEqual([
      "Página: Este botão já fica na Home e levaria para ela mesma. Escolha outra página.",
    ]);
  });
});

describe("opções e descrição do destino (ADM-11)", () => {
  const control = { publishedAt: null, updatedAt: "" };
  const service = (id: string, name: string, status: Service["status"]) =>
    ({ ...control, id, name, status }) as Service;
  const snapshot = {
    services: [service("s1", "Vídeo", "published"), service("s2", "Áudio", "draft"), service("s3", "Foto", "archived")],
    cases: [{ ...control, id: "c1", title: "Case Um", status: "published" } as CaseStudy],
    areas: [{ ...control, id: "a1", name: "Criação", status: "published" } as Area],
  };

  it("oferece publicados e rascunhos, marcados, em ordem alfabética; arquivado fica de fora", () => {
    expect(ctaTargetOptions(snapshot).services).toEqual([
      { value: "s2", label: "Áudio (rascunho)" },
      { value: "s1", label: "Vídeo" },
    ]);
  });

  it("arquivado só aparece quando já é o destino atual", () => {
    const options = ctaTargetOptions(snapshot, { kind: "service", serviceId: "s3" }).services;
    expect(options).toContainEqual({ value: "s3", label: "Foto (arquivado)" });
  });

  it.each([
    [{ kind: "internal", path: "/sobre" }, "Página: Sobre"],
    [{ kind: "external", url: "https://exemplo.com" }, "Link: https://exemplo.com"],
    [{ kind: "service", serviceId: "s1" }, "Serviço: Vídeo"],
    [{ kind: "service", serviceId: "" }, "Serviço: excluído"],
    [{ kind: "case", caseId: "c1" }, "Case: Case Um"],
    [{ kind: "area", areaId: "a1" }, "Área: Criação"],
    [{ kind: "contact" }, "Formulário de contato"],
    [{ kind: "contact", serviceId: "s1" }, "Contato, com Vídeo pré-selecionado"],
  ] as const)("descreve %j", (target, text) => {
    expect(describeCtaTarget(target, snapshot)).toBe(text);
  });
});
