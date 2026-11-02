/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : detalhe.test.ts
 Descrição    : Template do case com campos opcionais presentes e ausentes.

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
 01/11/2026 Vinícius Nishimura Reis  Testes de aceite do detalhe do case (CASE-02).
──────────────────────────────────────────────────────────────────────────────
*/

import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * Template do case com o conteúdo que existir: desafio, solução, resultados, galeria, links e
 * equipe são opcionais, e nenhum deles pode deixar título solto ou espaço vazio (CASE-02).
 */
const repository = vi.hoisted(() => ({ getCaseDetail: vi.fn(), listCases: vi.fn() }));
vi.mock("next/cache", () => ({ cacheTag: () => {}, cacheLife: () => {} }));
vi.mock("@/lib/server/content/repository", () => repository);

const { default: CasePage } = await import("./page");

const minimal = {
  id: "c1",
  slug: "meridiano",
  title: "Social media para a Meridiano",
  client: "Meridiano",
  summary: "Resumo do case.",
  status: "published",
  publishedAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  serviceIds: [],
  gallery: [],
  externalLinks: [],
  team: [],
  featured: false,
  order: 0,
};

const render = async (item: Record<string, unknown>, extra: Record<string, unknown> = {}) => {
  repository.getCaseDetail.mockResolvedValue({
    item: { ...minimal, ...item },
    category: null,
    services: [],
    areas: [],
    ...extra,
  });
  const page = (await CasePage({ params: Promise.resolve({ slug: "meridiano" }) } as never)) as ReactElement;
  return renderToStaticMarkup(page);
};

describe("detalhe do case (CASE-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repository.listCases.mockResolvedValue([]);
  });

  it("só com os campos obrigatórios, nada opcional aparece vazio", async () => {
    const markup = await render({});
    expect(markup).toContain("Social media para a Meridiano");
    expect(markup).toContain("Meridiano");
    expect(markup).toContain("Os detalhes deste case");
    for (const title of [
      "Desafio",
      "Solução",
      "Resultados",
      "Galeria",
      "Veja publicado",
      "Equipe",
      "Serviços",
      "Áreas",
    ]) {
      expect(markup, title).not.toContain(`>${title}<`);
    }
    // Sem capa, a área reservada a ela também não existe (os ícones da página são decorativos).
    expect(markup).not.toContain("aspect-[16/9]");
  });

  it("mostra só os blocos preenchidos, sem o aviso de conteúdo em preparação", async () => {
    const markup = await render({ results: "Alcance dobrou." });
    expect(markup).toContain(">Resultados<");
    expect(markup).toContain("Alcance dobrou.");
    expect(markup).not.toContain(">Desafio<");
    expect(markup).not.toContain(">Solução<");
    expect(markup).not.toContain("Os detalhes deste case");
  });

  it("com tudo preenchido, mostra capa, galeria, links, equipe e relações", async () => {
    const markup = await render(
      {
        challenge: "O desafio.",
        solution: "A solução.",
        results: "O resultado.",
        date: "2026-09",
        deliveryType: "Artigos",
        cover: { src: "/brand/capa.webp", alt: "Capa do case" },
        gallery: [{ src: "/brand/peca.webp", alt: "Peça do case" }],
        externalLinks: [
          { label: "Matéria", url: "https://exemplo.com/materia", source: "Estadão", date: "2026-09-15" },
        ],
        team: ["Pessoa Um", "Pessoa Dois"],
      },
      {
        category: { slug: "copywriting", name: "Copywriting" },
        services: [{ id: "s1", slug: "copywriting", name: "Redação" }],
        areas: [{ id: "a1", name: "Criação" }],
      },
    );
    for (const text of ["O desafio.", "A solução.", "O resultado.", "setembro de 2026", "Artigos"]) {
      expect(markup).toContain(text);
    }
    expect(markup).toContain('alt="Capa do case"');
    expect(markup).toContain('alt="Peça do case"');
    expect(markup).toContain('href="https://exemplo.com/materia"');
    expect(markup).toContain("Estadão · 15 de setembro de 2026");
    expect(markup).toContain("Pessoa Um, Pessoa Dois");
    expect(markup).toContain('href="/servicos/copywriting"');
    expect(markup).toContain("Criação");
  });

  it("link externo abre em nova aba e avisa o leitor de tela", async () => {
    const markup = await render({ externalLinks: [{ label: "Matéria", url: "https://exemplo.com/materia" }] });
    expect(markup).toContain('href="https://exemplo.com/materia" target="_blank" rel="noopener noreferrer"');
    expect(markup).toContain("(abre em nova aba)");
  });

  it("relacionados não repetem o próprio case, e somem quando não há outros", async () => {
    const category = { slug: "copywriting", name: "Copywriting" };
    repository.listCases.mockResolvedValue([{ ...minimal, categoryName: "Copywriting" }]);
    expect(await render({}, { category })).not.toContain("Mais cases de");

    repository.listCases.mockResolvedValue([
      { ...minimal, categoryName: "Copywriting" },
      { ...minimal, id: "c2", slug: "outro", title: "Outro case", categoryName: "Copywriting" },
    ]);
    const markup = await render({}, { category });
    expect(markup).toContain("Mais cases de Copywriting");
    expect(markup).toContain('href="/cases/outro"');
  });

  it("slug sem case publicado cai no 404, sem revelar se existe", async () => {
    repository.getCaseDetail.mockResolvedValue(null);
    await expect(CasePage({ params: Promise.resolve({ slug: "rascunho-secreto" }) } as never)).rejects.toThrow();
  });
});
