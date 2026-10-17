/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : snapshot.ts
 Descrição    : Fixtures de conteúdo com a estrutura do MVP para os testes de domínio.

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

import type { Area, CaseCategory, CaseStudy, ContentSnapshot, Cta, Service } from "../types";

const base = {
  status: "published" as const,
  publishedAt: "2026-10-01T12:00:00.000Z",
  updatedAt: "2026-10-01T12:00:00.000Z",
};

export function area(id: string, overrides: Partial<Area> = {}): Area {
  return { ...base, id, slug: id, name: id, summary: "s", description: "d", highlights: [], order: 0, ...overrides };
}

export function service(id: string, areaIds: string[], overrides: Partial<Service> = {}): Service {
  return {
    ...base,
    id,
    slug: id,
    name: id,
    summary: "s",
    description: "d",
    areaIds,
    examples: [],
    featured: false,
    order: 0,
    ...overrides,
  };
}

export function category(id: string, overrides: Partial<CaseCategory> = {}): CaseCategory {
  return { ...base, id, slug: id, name: id, description: "d", order: 0, ...overrides };
}

export function caseStudy(
  id: string,
  categoryId: string,
  serviceIds: string[],
  overrides: Partial<CaseStudy> = {},
): CaseStudy {
  return {
    ...base,
    id,
    slug: id,
    title: id,
    client: "Cliente",
    categoryId,
    serviceIds,
    summary: "s",
    gallery: [],
    externalLinks: [],
    team: [],
    featured: false,
    order: 0,
    ...overrides,
  };
}

export function cta(id: string, target: Cta["target"], overrides: Partial<Cta> = {}): Cta {
  return { ...base, id, label: id, target, placement: "home-hero", order: 0, ...overrides };
}

/** Estrutura do MVP: 6 áreas, 9 serviços, 3 categorias e 3 cases (PRJ §9–§12). */
export function mvpSnapshot(): ContentSnapshot {
  const areas = [
    "eventos-e-parcerias",
    "social-media",
    "comunicacao-interna",
    "copywriting",
    "criacao",
    "assessoria-de-imprensa",
  ].map((id, order) => area(id, { order }));
  const services = [
    service("estrategia-digital", ["social-media"]),
    service("social-media-servico", ["social-media"]),
    service("eventos", ["eventos-e-parcerias"]),
    service("producao-de-conteudo", ["copywriting", "social-media"]),
    service("copywriting-servico", ["copywriting"]),
    service("design-e-identidade-visual", ["criacao"]),
    service("audiovisual", ["criacao"]),
    service("assessoria-de-imprensa-pr", ["assessoria-de-imprensa"]),
    service("comunicacao-interna-servico", ["comunicacao-interna"]),
  ];
  const categories = [category("copywriting-cat"), category("social-media-e-criacao"), category("assessoria-cat")];
  const cases = [
    caseStudy("aventura-de-construir", "copywriting-cat", ["copywriting-servico", "producao-de-conteudo"]),
    caseStudy("meridiano", "social-media-e-criacao", ["social-media-servico"]),
    caseStudy("fecap", "assessoria-cat", ["assessoria-de-imprensa-pr"]),
  ];
  const ctas = [
    cta("hero-servicos", { kind: "internal", path: "/servicos" }),
    cta("hero-contato", { kind: "contact" }),
    cta("destaque-case", { kind: "case", caseId: "meridiano" }),
  ];
  return { areas, services, categories, cases, ctas };
}
