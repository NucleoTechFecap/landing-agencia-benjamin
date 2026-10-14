/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Content
 Arquivo      : ctas.ts
 Descrição    : Chamadas para ação da Home (serviços, cases, sobre e contato).

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Cta } from "../lib/domain/content/types";

const published = {
  status: "published" as const,
  publishedAt: "2026-10-13T00:00:00.000Z",
  updatedAt: "2026-10-13T00:00:00.000Z",
};

/** Chamadas para ação da Home (PRJ §7.3): Serviços, Cases, Sobre e Contato. */
export const ctas: Cta[] = [
  { ...published, id: "cta-hero-projeto", label: "Quero um projeto", target: { kind: "contact" }, placement: "home-hero", order: 1 },
  {
    ...published,
    id: "cta-hero-servicos",
    label: "Conheça os serviços",
    target: { kind: "internal", path: "/servicos" },
    placement: "home-hero",
    order: 2,
  },
  {
    ...published,
    id: "cta-destaque-cases",
    label: "Ver cases",
    target: { kind: "internal", path: "/cases" },
    placement: "home-highlight",
    order: 1,
  },
  {
    ...published,
    id: "cta-destaque-sobre",
    label: "Sobre a Benjamin",
    target: { kind: "internal", path: "/sobre" },
    placement: "home-highlight",
    order: 2,
  },
  {
    ...published,
    id: "cta-destaque-contato",
    label: "Fale com a gente",
    target: { kind: "internal", path: "/contato" },
    placement: "home-highlight",
    order: 3,
  },
];
