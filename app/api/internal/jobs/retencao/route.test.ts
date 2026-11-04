/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : route.test.ts
 Descrição    : Testes de acesso, simulação e trava de execução da rota de retenção.

 Desenvolvedor: Vinicius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinicius Binda             Criação inicial (DBX-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { beforeEach, describe, expect, it, vi } from "vitest";

const SECRET = "segredo-de-teste-da-rotina-de-retencao";
const rpc = vi.hoisted(() => vi.fn());
const getServiceClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/config/server-env", () => ({ getServerEnv: () => ({ CRON_SECRET: SECRET, LOG_LEVEL: "silent" }) }));
vi.mock("@/lib/server/supabase/admin", () => ({ getServiceClient }));

const { GET, POST } = await import("./route");

const URL_ROTA = "https://site.test/api/internal/jobs/retencao";
const auth = { authorization: `Bearer ${SECRET}` };
const get = (headers: Record<string, string> = auth) => GET(new Request(URL_ROTA, { headers }), undefined as never);
const post = (body: unknown, headers: Record<string, string> = auth) =>
  POST(new Request(URL_ROTA, { method: "POST", headers, body: JSON.stringify(body) }), undefined as never);

beforeEach(() => {
  vi.clearAllMocks();
  getServiceClient.mockReturnValue({ rpc });
  rpc.mockResolvedValue({
    data: [{ id: "id-vencido", kind: "lead", last_activity_at: "2020-01-01T00:00:00Z", identified: true }],
    error: null,
  });
});

describe("/api/internal/jobs/retencao", () => {
  it("sem o segredo, recusa e não consulta o banco", async () => {
    expect((await get({})).status).toBe(401);
    expect((await get({ authorization: "Bearer errado" })).status).toBe(401);
    expect((await post({ confirmar: "executar" }, {})).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("GET simula: só contagens, sem ids e sem aplicar nada", async () => {
    const response = await get();
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual({ toDelete: 1, toAnonymize: 0, kept: 0 });
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("retention_subjects");
  });

  it("POST sem a confirmação é recusado", async () => {
    expect((await post({})).status).toBe(400);
    expect((await post({ confirmar: "sim" })).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("POST com a confirmação continua travado enquanto os prazos não são aprovados", async () => {
    const response = await post({ confirmar: "executar" });
    expect(response.status).toBe(409);
    expect(JSON.stringify(await response.json())).toContain("SEG-02");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sem Supabase configurado, responde indisponível", async () => {
    getServiceClient.mockReturnValue(null);
    expect((await get()).status).toBe(503);
  });
});
