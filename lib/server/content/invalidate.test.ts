/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : invalidate.test.ts
 Descrição    : Testes do mapa de tags e dos mecanismos de invalidação.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-09).
 26/10/2026 Vinícius Nishimura Reis  Tags e invalidação de páginas do CMS (DB-03).
 26/10/2026 Vinícius Nishimura Reis  Aquecimento da página de detalhe após invalidar (INT-02).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterEach, describe, expect, it, vi } from "vitest";

const { updateTag, revalidateTag } = vi.hoisted(() => ({ updateTag: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/cache", () => ({ updateTag, revalidateTag }));
const { after } = vi.hoisted(() => ({ after: vi.fn() }));
vi.mock("next/server", () => ({ after }));

const { detailPathsForChange, invalidateContentFromAction, invalidateContentFromRoute, tagsForChange } =
  await import("./invalidate");

describe("tagsForChange", () => {
  it("case publicado invalida lista, detalhe e listas relacionadas", () => {
    expect(tagsForChange({ entity: "case", slug: "meridiano" }).sort()).toEqual(
      ["content:case:meridiano", "content:cases", "content:ctas", "content:services"].sort(),
    );
  });

  it("mudança de slug invalida a URL antiga e a nova", () => {
    const tags = tagsForChange({ entity: "service", slug: "audiovisual-e-foto", previousSlug: "audiovisual" });
    expect(tags).toContain("content:service:audiovisual");
    expect(tags).toContain("content:service:audiovisual-e-foto");
  });

  it("área afeta serviços (que exibem áreas) e CTAs (fallback)", () => {
    expect(tagsForChange({ entity: "area" })).toEqual(["content:areas", "content:services", "content:ctas"]);
  });

  it("página invalida a lista de páginas e o slug atual e anterior", () => {
    expect(tagsForChange({ entity: "page", slug: "sobre-nos", previousSlug: "sobre" }).sort()).toEqual(
      ["content:page:sobre", "content:page:sobre-nos", "content:pages"].sort(),
    );
  });

  it("configurações institucionais invalidam só settings", () => {
    expect(tagsForChange({ entity: "settings" })).toEqual(["content:settings"]);
  });
});

describe("invalidação", () => {
  afterEach(() => {
    updateTag.mockReset();
    revalidateTag.mockReset();
    vi.restoreAllMocks();
  });

  it("Server Action usa updateTag (read-your-writes)", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    invalidateContentFromAction({ entity: "cta" });
    expect(updateTag).toHaveBeenCalledWith("content:ctas");
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("Route Handler usa revalidateTag com expiração imediata", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    invalidateContentFromRoute({ entity: "category" });
    expect(revalidateTag).toHaveBeenCalledWith("content:categories", { expire: 0 });
    expect(updateTag).not.toHaveBeenCalled();
  });
});

describe("aquecimento das páginas de detalhe (INT-02)", () => {
  it("serviço e case com slug aquecem a página de detalhe; demais entidades não", () => {
    expect(detailPathsForChange({ entity: "service", slug: "audiovisual" })).toEqual(["/servicos/audiovisual"]);
    expect(detailPathsForChange({ entity: "case", slug: "meridiano" })).toEqual(["/cases/meridiano"]);
    expect(detailPathsForChange({ entity: "area", slug: "criacao" })).toEqual([]);
    expect(detailPathsForChange({ entity: "service" })).toEqual([]);
  });

  it("a requisição de aquecimento roda depois da resposta (after)", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    after.mockReset();
    invalidateContentFromAction({ entity: "case", slug: "meridiano" });
    expect(after).toHaveBeenCalledTimes(1);
    invalidateContentFromAction({ entity: "settings" });
    expect(after).toHaveBeenCalledTimes(1);
  });
});
