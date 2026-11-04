/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : validacao-na-borda.test.ts
 Descrição    : Rotas públicas da API: entrada inválida responde no envelope padronizado e não alcança o cache.

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
import { area, caseStudy, category, service } from "@/lib/domain/content/__fixtures__/snapshot";

const repo = vi.hoisted(() => ({
  getAreaDetail: vi.fn(),
  getCaseDetail: vi.fn(),
  getPage: vi.fn(),
  getServiceDetail: vi.fn(),
  listAreas: vi.fn(),
  listCases: vi.fn(),
  listCtas: vi.fn(),
  listServices: vi.fn(),
}));
const currentSlug = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/content/repository", () => repo);
vi.mock("@/lib/server/content/sources", () => ({ getContentSource: () => ({ currentSlug }) }));

const { GET: getCase } = await import("./cases/[slug]/route");
const { GET: getService } = await import("./services/[slug]/route");
const { GET: getArea } = await import("./areas/[slug]/route");
const { GET: getPage } = await import("./pages/[slug]/route");
const { GET: listCases } = await import("./cases/route");
const { GET: listServices } = await import("./services/route");
const { GET: listCtas } = await import("./ctas/route");

const BASE = "https://site.test/api/v1";
const params = (slug: string) => ({ params: Promise.resolve({ slug }) });
const garbage = ["a", "x".repeat(81), "tem espaço", "com_sublinhado", "traço-", "-traço", "novo", "../etc", "ação"];

function expectEnvelope(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("X-Request-Id")).toBeTruthy();
  return response.json().then((body) => {
    expect(body.error).toMatchObject({ code, message: expect.any(String), requestId: expect.any(String) });
    expect(JSON.stringify(body)).not.toMatch(/stack|supabase|postgres/i);
    return body.error as { fieldErrors?: Record<string, string[]> };
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("detalhes por slug", () => {
  const routes = [
    { name: "case", path: "cases", handler: getCase, read: repo.getCaseDetail },
    { name: "serviço", path: "services", handler: getService, read: repo.getServiceDetail },
    { name: "área", path: "areas", handler: getArea, read: repo.getAreaDetail },
    { name: "página", path: "pages", handler: getPage, read: repo.getPage },
  ] as const;

  describe.each(routes)("$name", ({ path, handler, read }) => {
    it.each(garbage)("%s: 404 padronizado, sem ler o repositório nem a fonte", async (slug) => {
      const url = `${BASE}/${path}/${encodeURIComponent(slug)}`;
      const response = await handler(new Request(url), params(slug) as never);
      await expectEnvelope(response, 404, "NOT_FOUND");
      expect(read).not.toHaveBeenCalled();
      expect(currentSlug).not.toHaveBeenCalled();
    });

    it("slug bem formado e inexistente também responde 404, sem revelar mais nada", async () => {
      read.mockResolvedValue(null);
      currentSlug.mockResolvedValue(null);
      const response = await handler(new Request(`${BASE}/${path}/nao-existe`), params("nao-existe") as never);
      await expectEnvelope(response, 404, "NOT_FOUND");
      expect(read).toHaveBeenCalledWith("nao-existe");
    });
  });

  it.each([
    ["cases", getCase, repo.getCaseDetail, "cases"],
    ["services", getService, repo.getServiceDetail, "servicos"],
  ] as const)(
    "%s: maiúsculas não passam pelo cache e respondem 301 para o endereço atual",
    async (path, handler, read, route) => {
      currentSlug.mockResolvedValue("meridiano");
      const response = await handler(new Request(`${BASE}/${path}/Meridiano?x=1`), params("Meridiano") as never);
      expect(response.status).toBe(301);
      expect(response.headers.get("Location")).toBe(`${BASE}/${path}/meridiano?x=1`);
      expect(read).not.toHaveBeenCalled();
      expect(currentSlug).toHaveBeenCalledWith(route, "meridiano", expect.any(Date));
    },
  );

  it("endereço antigo responde 301, sem mudar o que o cliente pediu na query", async () => {
    repo.getCaseDetail.mockResolvedValue(null);
    currentSlug.mockResolvedValue("nome-novo");
    const response = await getCase(new Request(`${BASE}/cases/nome-antigo`), params("nome-antigo") as never);
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe(`${BASE}/cases/nome-novo`);
  });

  it("slug válido devolve o DTO público com cache de leitura, sem campos de controle", async () => {
    const item = caseStudy("meridiano", "cat", ["srv"]);
    repo.getCaseDetail.mockResolvedValue({ item, category: category("cat"), services: [], areas: [] });
    const response = await getCase(new Request(`${BASE}/cases/${item.slug}`), params(item.slug) as never);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("s-maxage");
    const body = await response.json();
    expect(body.data.slug).toBe(item.slug);
    for (const field of ["id", "status", "archivedAt", "updatedAt", "provisional"]) {
      expect(body.data).not.toHaveProperty(field);
    }
  });
});

describe("listas e filtros", () => {
  it.each([
    ["pageSize acima do limite", "pageSize=999", "pageSize"],
    ["pageSize zero", "pageSize=0", "pageSize"],
    ["page zero", "page=0", "page"],
    ["page que não é número", "page=abc", "page"],
    ["categoria fora do formato", "category=NAO%20VALE", "category"],
    ["serviço fora do formato", "service=a_b", "service"],
    ["área grande demais", `area=${"x".repeat(81)}`, "area"],
    ["cliente vazio", "client=%20", "client"],
    ["cliente grande demais", `client=${"x".repeat(121)}`, "client"],
  ])("cases: %s responde 400 com o campo, sem consultar", async (_label, query, field) => {
    const error = await expectEnvelope(
      await listCases(new Request(`${BASE}/cases?${query}`), undefined as never),
      400,
      "BAD_REQUEST",
    );
    expect(error.fieldErrors).toHaveProperty(field);
    expect(repo.listCases).not.toHaveBeenCalled();
  });

  it("cases: parâmetro desconhecido é ignorado e nunca filtra por campo interno", async () => {
    repo.listCases.mockResolvedValue([]);
    const response = await listCases(
      new Request(`${BASE}/cases?status=draft&provisional=true&category=social`),
      undefined as never,
    );
    expect(response.status).toBe(200);
    expect(repo.listCases).toHaveBeenCalledWith({ category: "social" });
  });

  it("serviços: featured só aceita true ou false", async () => {
    await expectEnvelope(
      await listServices(new Request(`${BASE}/services?featured=talvez`), undefined as never),
      400,
      "BAD_REQUEST",
    );
    expect(repo.listServices).not.toHaveBeenCalled();

    repo.listServices.mockResolvedValue([service("srv", ["a1"])]);
    repo.listAreas.mockResolvedValue([area("a1")]);
    const response = await listServices(new Request(`${BASE}/services?featured=true`), undefined as never);
    expect(response.status).toBe(200);
    expect(repo.listServices).toHaveBeenCalledWith({ featuredOnly: true });
  });

  it.each(["", "?placement=", "?placement=qualquer"])("CTAs: local inválido (%s) responde 400", async (query) => {
    await expectEnvelope(await listCtas(new Request(`${BASE}/ctas${query}`), undefined as never), 400, "BAD_REQUEST");
    expect(repo.listCtas).not.toHaveBeenCalled();
  });
});
