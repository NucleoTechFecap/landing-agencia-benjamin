/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : integrity.test.ts
 Descrição    : Testes das regras de integridade, fallback de CTAs e impacto de remoção.

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
import { area, caseStudy, cta, mvpSnapshot, service } from "./__fixtures__/snapshot";
import { assessRemovalImpact, findIntegrityIssues, isValidInternalPath, resolveCtaHref } from "./integrity";

const NOW = new Date("2026-10-13T12:00:00.000Z");
const codes = (snapshot = mvpSnapshot()) => findIntegrityIssues(snapshot, NOW).map((issue) => issue.code);

describe("findIntegrityIssues", () => {
  it("aceita a estrutura do MVP (6 áreas, 9 serviços, 3 cases) sem problemas", () => {
    const snapshot = mvpSnapshot();
    expect(snapshot.areas).toHaveLength(6);
    expect(snapshot.services).toHaveLength(9);
    expect(findIntegrityIssues(snapshot, NOW)).toEqual([]);
  });

  it("R01/R02 — rejeita slug inválido e duplicado", () => {
    const snapshot = mvpSnapshot();
    snapshot.services.push(service("dup", ["criacao"], { slug: "audiovisual" }));
    snapshot.areas.push(area("Inválida", { slug: "Área Inválida" }));
    expect(codes(snapshot)).toEqual(expect.arrayContaining(["R01", "R02"]));
  });

  it("R03/R04 — serviço precisa de área existente", () => {
    const snapshot = mvpSnapshot();
    snapshot.services.push(service("sem-area", []), service("area-fantasma", ["nao-existe"]));
    expect(codes(snapshot)).toEqual(expect.arrayContaining(["R03", "R04"]));
  });

  it("R06 — case publicado não pode usar categoria em rascunho", () => {
    const snapshot = mvpSnapshot();
    snapshot.categories[0].status = "draft";
    expect(codes(snapshot)).toContain("R06");
  });

  it("R07 — case publicado precisa de ao menos um serviço publicado", () => {
    const snapshot = mvpSnapshot();
    snapshot.services.find((item) => item.id === "social-media-servico")!.status = "archived";
    expect(codes(snapshot)).toContain("R07");
  });

  it("R08 — CTA para case arquivado gera aviso e usa fallback", () => {
    const snapshot = mvpSnapshot();
    snapshot.cases.find((item) => item.id === "meridiano")!.status = "archived";
    const issues = findIntegrityIssues(snapshot, NOW);
    expect(issues.find((issue) => issue.code === "R08")?.severity).toBe("warning");
    expect(resolveCtaHref({ kind: "case", caseId: "meridiano" }, snapshot, NOW)).toEqual({
      href: "/cases",
      external: false,
      isTargetVisible: false,
    });
  });

  it("R09/R10 — valida links externos (https) e rotas internas conhecidas", () => {
    const snapshot = mvpSnapshot();
    snapshot.ctas.push(cta("http", { kind: "external", url: "http://exemplo.com" }));
    snapshot.ctas.push(cta("rota", { kind: "internal", path: "/rota-que-nao-existe" }));
    expect(codes(snapshot)).toEqual(expect.arrayContaining(["R09", "R10"]));
  });

  it("R12 — imagem publicada exige texto alternativo", () => {
    const snapshot = mvpSnapshot();
    snapshot.cases[0].cover = { src: "/capa.webp", alt: " " };
    expect(codes(snapshot)).toContain("R12");
  });

  it("ignora problemas de publicação em itens que ainda são rascunho", () => {
    const snapshot = mvpSnapshot();
    snapshot.cases.push(caseStudy("case-em-rascunho", "copywriting-cat", [], { status: "draft", publishedAt: null }));
    expect(codes(snapshot)).toEqual([]);
  });
});

describe("resolveCtaHref", () => {
  const snapshot = mvpSnapshot();

  it("leva ao detalhe do serviço publicado", () => {
    expect(resolveCtaHref({ kind: "service", serviceId: "audiovisual" }, snapshot, NOW).href).toBe(
      "/servicos/audiovisual",
    );
  });

  it("pré-seleciona o serviço no formulário de contato", () => {
    expect(resolveCtaHref({ kind: "contact", serviceId: "audiovisual" }, snapshot, NOW).href).toBe(
      "/contato?servico=audiovisual#formulario",
    );
  });

  it("aponta área para a âncora na página de áreas", () => {
    expect(resolveCtaHref({ kind: "area", areaId: "criacao" }, snapshot, NOW).href).toBe("/areas#criacao");
  });

  it("valida caminhos internos", () => {
    expect(isValidInternalPath("/servicos/audiovisual")).toBe(true);
    expect(isValidInternalPath("//evil.com")).toBe(false);
    expect(isValidInternalPath("/admin")).toBe(false);
  });
});

describe("assessRemovalImpact", () => {
  it("bloqueia arquivar categoria usada por case publicado", () => {
    expect(assessRemovalImpact("category", "copywriting-cat", mvpSnapshot(), NOW).blockers).toHaveLength(1);
  });

  it("bloqueia arquivar a única área de um serviço publicado", () => {
    expect(assessRemovalImpact("area", "criacao", mvpSnapshot(), NOW).blockers[0]).toMatch(/Design|audiovisual/i);
  });

  it("não conta como órfão o serviço que mantém outra área publicada", () => {
    expect(assessRemovalImpact("area", "copywriting", mvpSnapshot(), NOW).blockers).toHaveLength(1);
    expect(assessRemovalImpact("area", "social-media", mvpSnapshot(), NOW).blockers[0]).not.toMatch(/producao/);
  });

  it("bloqueia arquivar o único serviço de um case publicado", () => {
    expect(assessRemovalImpact("service", "social-media-servico", mvpSnapshot(), NOW).blockers).toHaveLength(1);
  });

  it("apenas avisa quando o case mantém outro serviço publicado", () => {
    const report = assessRemovalImpact("service", "producao-de-conteudo", mvpSnapshot(), NOW);
    expect(report.blockers).toEqual([]);
    expect(report.warnings).toEqual(["case-services-hidden"]);
  });

  it("avisa quando CTAs publicados apontam para o item", () => {
    expect(assessRemovalImpact("case", "meridiano", mvpSnapshot(), NOW).warnings).toEqual(["ctas-fallback"]);
  });
});
