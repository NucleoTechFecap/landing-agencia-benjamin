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
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-09).
 26/10/2026 Vinícius Nishimura Reis  Tags e invalidação de páginas do CMS (DB-03).
 26/10/2026 Vinícius Nishimura Reis  Aquecimento da página de detalhe após invalidar (INT-02).
 27/10/2026 Vinícius Nishimura Reis  Correções da revisão de segurança (TECH-13).
 01/11/2026 Vinícius Nishimura Reis  Segunda expiração contra regeneração em andamento (INT-03).
 04/11/2026 Vinícius Nishimura Reis  Segunda expiração em requisição própria, antes de aquecer (TECH-13, #369).
 12/11/2026 Codex                     Testa invalidação do blog (FUT-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { updateTag, revalidateTag } = vi.hoisted(() => ({ updateTag: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/cache", () => ({ updateTag, revalidateTag }));
const { after } = vi.hoisted(() => ({ after: vi.fn() }));
vi.mock("next/server", () => ({ after }));
const serverEnv = vi.hoisted(() => ({ CONTENT_REVALIDATE_SECRET: undefined as string | undefined }));
vi.mock("@/lib/config/server-env", () => ({ getServerEnv: () => serverEnv }));

const {
  detailPathsForChange,
  expireSecondPass,
  invalidateContentFromAction,
  invalidateContentFromRoute,
  MAX_WARMED_PATHS,
  SECOND_EXPIRATION_DELAY_MS,
  tagsForChange,
} = await import("./invalidate");

describe("tagsForChange", () => {
  it("artigo invalida a listagem e aquece o detalhe do blog", () => {
    expect(tagsForChange({ entity: "blog", slug: "artigo" })).toEqual(["content:blog"]);
    expect(detailPathsForChange({ entity: "blog", slug: "artigo" })).toEqual(["/blog/artigo"]);
  });
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

  it("inclui as páginas relacionadas, sem repetir e com teto (TECH-13)", () => {
    expect(
      detailPathsForChange({
        entity: "case",
        slug: "meridiano",
        relatedPaths: ["/servicos/social-media", "/cases/meridiano"],
      }),
    ).toEqual(["/cases/meridiano", "/servicos/social-media"]);
    expect(detailPathsForChange({ entity: "area", slug: "criacao", relatedPaths: ["/servicos/audiovisual"] })).toEqual([
      "/servicos/audiovisual",
    ]);
    const many = Array.from({ length: 30 }, (_, index) => `/cases/case-${index}`);
    expect(detailPathsForChange({ entity: "category", relatedPaths: many })).toHaveLength(MAX_WARMED_PATHS);
  });

  it("a requisição de aquecimento roda depois da resposta (after)", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    after.mockReset();
    invalidateContentFromAction({ entity: "case", slug: "meridiano" });
    // Aquecimento e segunda expiração.
    expect(after).toHaveBeenCalledTimes(2);
    after.mockReset();
    invalidateContentFromAction({ entity: "settings" });
    // Sem página de detalhe para aquecer: só a segunda expiração.
    expect(after).toHaveBeenCalledTimes(1);
  });
});

describe("segunda expiração (ADR-0006)", () => {
  const fetchMock = vi.fn(async () => new Response());
  const secondPass = () => (after.mock.calls.at(-1)![0] as () => Promise<void>)();

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.useFakeTimers();
    vi.stubGlobal("fetch", fetchMock);
    [after, updateTag, revalidateTag, fetchMock].forEach((mock) => mock.mockClear());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    revalidateTag.mockReset();
  });

  it("depois do prazo, expira de novo as mesmas tags, para descartar regeneração em andamento", async () => {
    invalidateContentFromAction({ entity: "page", slug: "sobre" });
    const pass = secondPass();
    await vi.advanceTimersByTimeAsync(SECOND_EXPIRATION_DELAY_MS - 1);
    expect(revalidateTag).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await pass;
    expect(revalidateTag).toHaveBeenCalledWith("content:pages", { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith("content:page:sobre", { expire: 0 });
  });

  it("vale também para o que vem de fora do painel", async () => {
    invalidateContentFromRoute({ entity: "category" });
    const pass = secondPass();
    await vi.advanceTimersByTimeAsync(SECOND_EXPIRATION_DELAY_MS);
    await pass;
    expect(revalidateTag.mock.calls.filter(([tag]) => tag === "content:categories")).toHaveLength(2);
  });

  it("reaquece as páginas de detalhe depois de expirar", async () => {
    invalidateContentFromAction({ entity: "case", slug: "meridiano" });
    const pass = secondPass();
    await vi.advanceTimersByTimeAsync(SECOND_EXPIRATION_DELAY_MS);
    await pass;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toMatch(/\/cases\/meridiano$/);
  });

  it("falha aqui não afeta a operação já concluída e não aquece versão velha", async () => {
    revalidateTag.mockImplementation(() => {
      throw new Error("indisponível");
    });
    invalidateContentFromAction({ entity: "case", slug: "meridiano" });
    const pass = secondPass();
    await vi.advanceTimersByTimeAsync(SECOND_EXPIRATION_DELAY_MS);
    await expect(pass).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe("em requisição própria (TECH-13, #369)", () => {
    const SECRET = "x".repeat(32);
    const lastCall = () => fetchMock.mock.calls.at(-1) as unknown as [string, RequestInit];

    beforeEach(() => {
      serverEnv.CONTENT_REVALIDATE_SECRET = SECRET;
      fetchMock.mockImplementation(async () => new Response());
    });

    afterEach(() => {
      serverEnv.CONTENT_REVALIDATE_SECRET = undefined;
      fetchMock.mockImplementation(async () => new Response());
    });

    it("com o segredo, pede a expiração à rota interna, com o que ela precisa para aquecer", async () => {
      invalidateContentFromAction({
        entity: "case",
        slug: "meridiano",
        previousSlug: "antigo",
        relatedPaths: ["/servicos/social"],
      });
      const pass = secondPass();
      await vi.advanceTimersByTimeAsync(SECOND_EXPIRATION_DELAY_MS);
      await pass;
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = lastCall();
      expect(url).toMatch(/\/api\/internal\/revalidate$/);
      expect(init.method).toBe("POST");
      expect((init.headers as Record<string, string>).authorization).toBe(`Bearer ${SECRET}`);
      expect(JSON.parse(init.body as string)).toEqual({
        entity: "case",
        slug: "meridiano",
        previousSlug: "antigo",
        relatedPaths: ["/cases/meridiano", "/servicos/social"],
        secondPass: true,
      });
      expect(revalidateTag).not.toHaveBeenCalled();
    });

    it.each([
      ["recusa", async () => new Response(null, { status: 401 })],
      ["fora do ar", async () => Promise.reject(new Error("rede fora"))],
    ])("rota interna %s: expira aqui mesmo e aquece, sem afetar a operação", async (_label, reply) => {
      fetchMock.mockImplementationOnce(reply);
      invalidateContentFromAction({ entity: "case", slug: "meridiano" });
      const pass = secondPass();
      await vi.advanceTimersByTimeAsync(SECOND_EXPIRATION_DELAY_MS);
      await expect(pass).resolves.toBeUndefined();
      expect(revalidateTag).toHaveBeenCalledWith("content:cases", { expire: 0 });
      expect(String(lastCall()[0])).toMatch(/\/cases\/meridiano$/);
    });

    it("expireSecondPass expira e aquece, mas não agenda uma terceira expiração", () => {
      const tags = expireSecondPass({ entity: "case", slug: "meridiano" });
      expect(tags).toContain("content:case:meridiano");
      expect(revalidateTag).toHaveBeenCalledWith("content:case:meridiano", { expire: 0 });
      expect(after).toHaveBeenCalledTimes(1);
    });
  });

  it("cabe na meta de refletir no site em até 5 s", () => {
    expect(SECOND_EXPIRATION_DELAY_MS).toBeLessThan(5_000);
  });
});
