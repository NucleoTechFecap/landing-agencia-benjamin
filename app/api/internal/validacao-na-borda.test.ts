/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : validacao-na-borda.test.ts
 Descrição    : Rotas internas: sem o segredo ou com corpo inválido, respondem o envelope padronizado e não fazem nada.

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

const env = vi.hoisted(() => ({ CONTENT_REVALIDATE_SECRET: "segredo-de-revalidar", CRON_SECRET: "segredo-do-cron" }));
const invalidate = vi.hoisted(() => vi.fn());
const retry = vi.hoisted(() => vi.fn());

vi.mock("@/lib/config/server-env", () => ({ getServerEnv: () => env }));
vi.mock("@/lib/server/content/invalidate", () => ({ invalidateContentFromRoute: invalidate }));
vi.mock("@/lib/server/forms/deps", () => ({ getSubmissionDeps: () => ({}) }));
vi.mock("@/lib/server/forms/submission-service", () => ({ retryPendingNotifications: retry }));

const { POST: revalidate } = await import("./revalidate/route");
const { GET: runJob } = await import("./jobs/notificacoes/route");

const REVALIDATE = "https://site.test/api/internal/revalidate";
const JOB = "https://site.test/api/internal/jobs/notificacoes";
const AUTH = { authorization: "Bearer segredo-de-revalidar" };

const post = (body: string, headers: Record<string, string> = AUTH) =>
  revalidate(new Request(REVALIDATE, { method: "POST", body, headers }), undefined as never);

async function expectEnvelope(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  const body = await response.json();
  expect(body.error).toMatchObject({ code, message: expect.any(String), requestId: expect.any(String) });
}

beforeEach(() => {
  vi.resetAllMocks();
  env.CONTENT_REVALIDATE_SECRET = "segredo-de-revalidar";
  env.CRON_SECRET = "segredo-do-cron";
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("POST /api/internal/revalidate", () => {
  it.each([
    ["sem cabeçalho", {}],
    ["segredo errado", { authorization: "Bearer outro-segredo-qualquer" }],
    ["outro esquema", { authorization: "Basic segredo-de-revalidar" }],
    ["segredo de outra rota", { authorization: "Bearer segredo-do-cron" }],
  ])("%s: 401, sem invalidar nada", async (_label, headers) => {
    await expectEnvelope(await post('{"entity":"case"}', headers as Record<string, string>), 401, "UNAUTHENTICATED");
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("sem o segredo configurado no ambiente, recusa até cabeçalho vazio", async () => {
    env.CONTENT_REVALIDATE_SECRET = "";
    await expectEnvelope(await post('{"entity":"case"}', { authorization: "Bearer " }), 401, "UNAUTHENTICATED");
    expect(invalidate).not.toHaveBeenCalled();
  });

  it.each([
    ["JSON quebrado", "{"],
    ["corpo vazio", ""],
    ["lista no lugar de objeto", "[]"],
    ["nulo", "null"],
    ["sem entidade", "{}"],
    ["entidade desconhecida", '{"entity":"lead"}'],
    ["entidade de outro tipo", '{"entity":1}'],
    ["slug fora do formato", '{"entity":"case","slug":"NAO VALE"}'],
    ["slug grande demais", JSON.stringify({ entity: "case", slug: "x".repeat(81) })],
    ["slug anterior fora do formato", '{"entity":"case","slug":"novo-nome","previousSlug":"../x"}'],
  ])("%s: 400 padronizado, sem invalidar nada", async (_label, body) => {
    await expectEnvelope(await post(body), 400, "BAD_REQUEST");
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("corpo válido invalida só os campos do contrato", async () => {
    invalidate.mockReturnValue(["content:cases"]);
    const response = await post('{"entity":"case","slug":"meridiano","campoExtra":"ignorado"}');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { invalidated: ["content:cases"] } });
    expect(invalidate).toHaveBeenCalledWith({ entity: "case", slug: "meridiano" });
  });
});

describe("GET /api/internal/jobs/notificacoes", () => {
  it.each([
    ["sem cabeçalho", {}],
    ["segredo errado", { authorization: "Bearer outro" }],
    ["segredo de outra rota", AUTH],
  ])("%s: 401, sem reenviar nada", async (_label, headers) => {
    const response = await runJob(new Request(JOB, { headers: headers as Record<string, string> }), undefined as never);
    await expectEnvelope(response, 401, "UNAUTHENTICATED");
    expect(retry).not.toHaveBeenCalled();
  });

  it("sem o segredo configurado no ambiente, recusa", async () => {
    env.CRON_SECRET = "";
    const response = await runJob(new Request(JOB, { headers: { authorization: "Bearer " } }), undefined as never);
    await expectEnvelope(response, 401, "UNAUTHENTICATED");
    expect(retry).not.toHaveBeenCalled();
  });

  it("com o segredo, executa e devolve o resultado", async () => {
    retry.mockResolvedValue({ sent: 1, failed: 0 });
    const response = await runJob(
      new Request(JOB, { headers: { authorization: "Bearer segredo-do-cron" } }),
      undefined as never,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { sent: 1, failed: 0 } });
  });
});
