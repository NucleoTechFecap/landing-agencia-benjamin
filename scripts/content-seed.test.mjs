/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : content-seed.test.mjs
 Descrição    : Garante que supabase/seed.sql está em dia, tem a trava de produção e dados fictícios consistentes.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 28/10/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 28/10/2026 Vinicius Binda             Criação inicial (DBX-02).
 02/11/2026 Vinicius Binda             Trava por tabela, transação e consistência dos dados fictícios (ARC-11).
──────────────────────────────────────────────────────────────────────────────
*/

import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BLOCK_SCHEMAS, pagePath } from "@/lib/domain/content/blocks";
import { validateCaseForPublish } from "@/lib/domain/content/case-schema";
import { findIntegrityIssues } from "@/lib/domain/content/integrity";
import { isValidSlug } from "@/lib/domain/content/slug";
import { isPubliclyVisible } from "@/lib/domain/content/visibility";
import { seedSnapshot, siteSettings } from "../content/index";
import { buildContentSeed, SEED_PATH, seedDataset } from "./content-seed.mjs";

const seed = readFileSync(SEED_PATH, "utf8");
const dataset = seedDataset(seedSnapshot);

describe("supabase/seed.sql (DBX-02)", () => {
  it("está em dia com content/ (senão: npm run seed:write)", () => {
    expect(seed).toBe(buildContentSeed(seedSnapshot, siteSettings));
  });

  it("recusa banco marcado como produção antes de qualquer insert", () => {
    const guard = seed.indexOf("if exists (select 1 from public.ambiente_banco) then");
    expect(guard).toBeGreaterThan(0);
    expect(guard).toBeLessThan(seed.indexOf("insert into"));
  });

  it("roda numa transação: uma falha no meio não deixa dados pela metade", () => {
    expect(seed.indexOf("\nbegin;\n")).toBeGreaterThan(0);
    expect(seed.indexOf("\nbegin;\n")).toBeLessThan(seed.indexOf("if exists (select 1 from public.ambiente_banco)"));
    expect(seed.trimEnd().endsWith("commit;")).toBe(true);
  });

  it("pode rodar de novo sem duplicar: todo insert ignora o que já existe", () => {
    const inserts = seed.match(/^insert into /gm) ?? [];
    const ignored = seed.match(/^on conflict .+ do nothing;$/gm) ?? [];
    expect(inserts.length).toBeGreaterThan(0);
    expect(ignored).toHaveLength(inserts.length);
  });

  it("não cria contas, senhas nem dados pessoais", () => {
    expect(seed).not.toMatch(/auth\.users|profiles|form_submissions|encrypted_password/);
  });
});

describe("dados fictícios do seed (ARC-11)", () => {
  const now = new Date("2026-11-02T12:00:00.000Z");
  const snapshot = { ...seedSnapshot, services: dataset.services, cases: dataset.cases };

  it("nenhum case usa cliente real: os de content/ dependem de autorização (CON-06 a CON-08)", () => {
    const clients = dataset.cases.map((item) => item.client);
    expect(clients.every((client) => /fict[ií]ci/i.test(client))).toBe(true);
    // A configuração institucional cita a FECAP como casa da agência; o que não pode é virar cliente.
    const fictional = JSON.stringify({ cases: dataset.cases, pages: dataset.pages });
    for (const item of seedSnapshot.cases) {
      expect(fictional).not.toContain(item.client);
      expect(dataset.cases.map((entry) => entry.slug)).not.toContain(item.slug);
    }
  });

  it("links externos usam só domínio reservado para exemplos", () => {
    const links = dataset.cases.flatMap((item) => item.externalLinks);
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((link) => new URL(link.url).hostname === "example.com")).toBe(true);
  });

  it("exercita os estados: publicado, agendado, rascunho e arquivado", () => {
    const visible = dataset.cases.filter((item) => isPubliclyVisible(item, now)).map((item) => item.slug);
    expect(visible).toEqual(["editora-exemplo", "cafeteria-exemplo", "instituto-exemplo"]);
    expect(dataset.cases.map((item) => item.slug)).toEqual(
      expect.arrayContaining(["case-ficticio-agendado", "case-ficticio-em-rascunho"]),
    );
    expect(dataset.services.some((service) => service.status === "archived")).toBe(true);
    expect(dataset.pages.map((page) => page.status).sort()).toEqual(["draft", "published"]);
    expect(dataset.cases.some((item) => item.gallery.length > 0)).toBe(true);
  });

  it("todo case publicado ou agendado passa na validação de publicação", () => {
    for (const item of dataset.cases.filter((entry) => entry.status === "published")) {
      expect(validateCaseForPublish(item, now), item.slug).toEqual([]);
    }
  });

  it("não tem erro de integridade entre os conteúdos", () => {
    expect(findIntegrityIssues(snapshot, now).filter((issue) => issue.severity === "error")).toEqual([]);
  });

  it("slugs válidos e únicos por tipo", () => {
    for (const items of [dataset.services, dataset.cases, dataset.pages]) {
      const slugs = items.map((item) => item.slug);
      expect(slugs.every(isValidSlug)).toBe(true);
      expect(new Set(slugs).size).toBe(slugs.length);
    }
  });

  it("blocos seguem o catálogo; a página publicada tem rota no site", () => {
    for (const page of dataset.pages) {
      for (const block of page.blocks) {
        expect(BLOCK_SCHEMAS[block.type].safeParse(block.content).success, block.type).toBe(true);
      }
    }
    expect(pagePath(dataset.pages.find((page) => page.status === "published").slug)).toBe("/areas");
  });

  it("toda mídia aponta para um arquivo versionado em public/, com texto alternativo", () => {
    for (const ref of dataset.media) {
      expect(existsSync(new URL(`../public${ref.src}`, import.meta.url)), ref.src).toBe(true);
      expect(ref.alt.length).toBeGreaterThan(0);
    }
  });
});
