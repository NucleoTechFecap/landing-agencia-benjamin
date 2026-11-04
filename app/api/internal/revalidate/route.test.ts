/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : route.test.ts
 Descrição    : Segunda expiração do cache em requisição própria, pela rota interna de invalidação.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (TECH-13, #369).
──────────────────────────────────────────────────────────────────────────────
*/

import { beforeEach, describe, expect, it, vi } from "vitest";

const expireSecondPass = vi.hoisted(() => vi.fn(() => ["content:cases"]));
const invalidateContentFromRoute = vi.hoisted(() => vi.fn(() => ["content:cases"]));

vi.mock("@/lib/config/server-env", () => ({
  getServerEnv: () => ({ CONTENT_REVALIDATE_SECRET: "segredo-de-revalidar" }),
}));
vi.mock("@/lib/server/content/invalidate", () => ({
  MAX_WARMED_PATHS: 12,
  expireSecondPass,
  invalidateContentFromRoute,
}));

const { POST } = await import("./route");

const post = (body: unknown) =>
  POST(
    new Request("https://site.test/api/internal/revalidate", {
      method: "POST",
      headers: { authorization: "Bearer segredo-de-revalidar" },
      body: JSON.stringify(body),
    }),
    undefined as never,
  );

beforeEach(() => vi.clearAllMocks());

describe("POST /api/internal/revalidate: segunda expiração", () => {
  it("segunda expiração não agenda outra", async () => {
    const response = await post({
      entity: "case",
      slug: "meridiano",
      relatedPaths: ["/servicos/social"],
      secondPass: true,
    });
    expect(response.status).toBe(200);
    expect(expireSecondPass).toHaveBeenCalledWith({
      entity: "case",
      slug: "meridiano",
      relatedPaths: ["/servicos/social"],
    });
    expect(invalidateContentFromRoute).not.toHaveBeenCalled();
  });

  it("sem a marca, segue o caminho normal, que agenda a segunda expiração", async () => {
    expect((await post({ entity: "case", slug: "meridiano" })).status).toBe(200);
    expect(invalidateContentFromRoute).toHaveBeenCalledWith({ entity: "case", slug: "meridiano" });
    expect(expireSecondPass).not.toHaveBeenCalled();
  });

  it.each([
    ["host de fora", ["https://evil.test/x"]],
    ["fora de serviços e cases", ["/admin/usuarios"]],
    ["com sair da pasta", ["/cases/../admin"]],
    ["com protocolo relativo", ["//evil.test/cases/x"]],
    ["lista grande demais", Array.from({ length: 13 }, (_, index) => `/cases/caso-${index}`)],
  ])("relatedPaths %s: 400, sem expirar nada", async (_label, relatedPaths) => {
    expect((await post({ entity: "case", relatedPaths })).status).toBe(400);
    expect(expireSecondPass).not.toHaveBeenCalled();
    expect(invalidateContentFromRoute).not.toHaveBeenCalled();
  });

  it("a marca só aceita true", async () => {
    expect((await post({ entity: "case", secondPass: false })).status).toBe(400);
    expect(invalidateContentFromRoute).not.toHaveBeenCalled();
  });
});
