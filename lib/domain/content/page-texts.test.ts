/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : page-texts.test.ts
 Descrição    : Testes da prioridade dos textos publicados em página.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Site lê páginas e blocos publicados no CMS (INT-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it } from "vitest";
import { withPublishedTexts } from "./page-texts";
import type { Page, SiteSettings } from "./types";

const settings = {
  name: "Agência Benjamin",
  manifesto: { title: "Manifesto de referência", paragraphs: ["Referência."], provisional: true },
  about: {
    title: "Sobre de referência",
    intro: "i",
    valueProposition: "v",
    howWeWork: "h",
    fecapRelation: "f",
    provisional: true,
  },
} as SiteSettings;

const page = (blocks: Page["blocks"], provisional = false): Page => ({
  id: "p1",
  slug: "home",
  title: "Home",
  status: "published",
  publishedAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  provisional,
  blocks,
});

describe("textos publicados em página (INT-03)", () => {
  it("sem página publicada, mantém a configuração", () => {
    expect(withPublishedTexts(settings, [])).toEqual(settings);
  });

  it("manifesto publicado substitui só o manifesto", () => {
    const content = { title: "Manifesto novo", paragraphs: ["Texto novo."] };
    const result = withPublishedTexts(settings, [page([{ id: "b", type: "manifesto", content, order: 0 }])]);
    expect(result.manifesto).toEqual({ ...content, provisional: false });
    expect(result.about).toEqual(settings.about);
  });

  it("o selo de provisório acompanha a página, não o valor antigo", () => {
    const content = { title: "Sobre novo", intro: "i", valueProposition: "v", howWeWork: "h", fecapRelation: "f" };
    const block = { id: "b", type: "about" as const, content, order: 0 };
    expect(withPublishedTexts(settings, [page([block], true)]).about.provisional).toBe(true);
    expect(withPublishedTexts(settings, [page([block], false)]).about.provisional).toBe(false);
  });

  it("ignora os demais tipos de bloco e não altera o objeto recebido", () => {
    const before = structuredClone(settings);
    const result = withPublishedTexts(settings, [
      page([{ id: "b", type: "rich-text", content: { paragraphs: ["Texto."] }, order: 0 }]),
    ]);
    expect(result).toEqual(before);
    expect(settings).toEqual(before);
  });
});
