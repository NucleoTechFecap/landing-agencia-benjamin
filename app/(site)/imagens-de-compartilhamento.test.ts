/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : imagens-de-compartilhamento.test.ts
 Descrição    : Imagens de compartilhamento: slug fora do formato não alcança o cache do conteúdo.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (DB-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { beforeEach, describe, expect, it, vi } from "vitest";

const repo = vi.hoisted(() => ({ getCaseDetail: vi.fn(), getServiceDetail: vi.fn() }));

vi.mock("@/lib/server/content/repository", () => repo);
vi.mock("@/lib/server/og", () => ({
  OG_SIZE: { width: 1200, height: 630 },
  ogFonts: async () => [],
  ogLogoDataUrl: async () => "data:image/png;base64,",
}));
vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(public element: { props: Record<string, unknown> }) {}
  },
}));

const { default: caseImage } = await import("./cases/[slug]/opengraph-image");
const { default: serviceImage } = await import("./servicos/[slug]/opengraph-image");

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });
const titleOf = (image: unknown) => (image as { element: { props: { title: string } } }).element.props.title;

beforeEach(() => vi.resetAllMocks());

describe.each([
  { name: "case", image: caseImage, read: repo.getCaseDetail, fallback: "Cases da Agência Benjamin" },
  { name: "serviço", image: serviceImage, read: repo.getServiceDetail, fallback: "Serviços" },
])("imagem de $name", ({ image, read, fallback }) => {
  it.each(["a", "tem espaço", "MAIUSCULA", "novo", "x".repeat(81)])(
    "%s: imagem genérica, sem ler o repositório",
    async (slug) => {
      expect(titleOf(await image(params(slug)))).toBe(fallback);
      expect(read).not.toHaveBeenCalled();
    },
  );

  it("slug bem formado consulta o repositório", async () => {
    read.mockResolvedValue(null);
    expect(titleOf(await image(params("nao-existe")))).toBe(fallback);
    expect(read).toHaveBeenCalledWith("nao-existe");
  });
});
