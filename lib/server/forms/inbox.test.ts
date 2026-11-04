/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : inbox.test.ts
 Descrição    : Regras do serviço de envios sem banco: corrida, página além do fim e erros internos.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (FORM-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { readFileSync } from "node:fs";
import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { changeSubmissionStatus, getSubmission, listSubmissions } from "./inbox";

const ID = "00000000-0000-4000-8000-000000000601";
const ALL = ["lead", "contact", "feedback"] as const;

type Result = { data: unknown; error: { code?: string; message: string } | null; count?: number };

/** Devolve as respostas na ordem e guarda cada chamada do encadeamento do PostgREST. */
function fakeDb(results: Result[]) {
  const calls: [string, unknown[]][] = [];
  const builder: Record<string, unknown> = {};
  const next = () => results.shift() ?? { data: null, error: null };
  for (const method of ["from", "select", "update", "eq", "in", "order", "range", "returns"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push([method, args]);
      return builder;
    };
  }
  builder.maybeSingle = async () => next();
  builder.then = (resolve: (value: Result) => void) => resolve(next());
  return { db: builder as unknown as SupabaseClient, calls };
}

const change = { id: ID, status: "em_atendimento", currentStatus: "novo" };

describe("changeSubmissionStatus", () => {
  it("altera só a coluna status, condicionada ao status lido", async () => {
    const { db, calls } = fakeDb([
      { data: { kind: "lead", status: "novo" }, error: null },
      { data: [{ id: ID }], error: null },
    ]);
    const audit = vi.fn(async () => {});
    await expect(changeSubmissionStatus({ db, audit }, "admin", change)).resolves.toEqual({ changed: true });
    expect(calls.find(([method]) => method === "update")?.[1]).toEqual([{ status: "em_atendimento" }]);
    expect(calls).toContainEqual(["eq", ["status", "novo"]]);
    expect(audit).toHaveBeenCalledWith({
      event: "lead.status_changed",
      resourceId: ID,
      metadata: { kind: "lead", fromStatus: "novo", toStatus: "em_atendimento" },
    });
  });

  it.each([
    ["id malformado", { ...change, id: "1" }, "NOT_FOUND"],
    ["status fora da lista", { ...change, status: "aprovado" }, "VALIDATION_FAILED"],
    ["status vazio", { ...change, status: "" }, "VALIDATION_FAILED"],
  ])("%s é recusado antes de ir ao banco", async (_name, input, code) => {
    const { db, calls } = fakeDb([]);
    const audit = vi.fn(async () => {});
    await expect(changeSubmissionStatus({ db, audit }, "admin", input)).rejects.toMatchObject({ code });
    expect(calls).toEqual([]);
    expect(audit).not.toHaveBeenCalled();
  });

  it("registro que a RLS esconde responde 404", async () => {
    const { db } = fakeDb([{ data: null, error: null }]);
    await expect(changeSubmissionStatus({ db, audit: vi.fn() }, "admin", change)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("confere a permissão com o tipo que veio do banco", async () => {
    const { db, calls } = fakeDb([{ data: { kind: "feedback", status: "novo" }, error: null }]);
    await expect(
      changeSubmissionStatus({ db, audit: vi.fn() }, "editor", { ...change, status: "lido" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(calls.some(([method]) => method === "update")).toBe(false);
  });

  it("status mudou depois que a tela abriu: conflito, sem gravar", async () => {
    const { db, calls } = fakeDb([{ data: { kind: "lead", status: "respondido" }, error: null }]);
    await expect(changeSubmissionStatus({ db, audit: vi.fn() }, "admin", change)).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(calls.some(([method]) => method === "update")).toBe(false);
  });

  it("corrida: outra pessoa mudou entre a leitura e a gravação", async () => {
    const { db } = fakeDb([
      { data: { kind: "lead", status: "novo" }, error: null },
      { data: [], error: null },
    ]);
    const audit = vi.fn(async () => {});
    await expect(changeSubmissionStatus({ db, audit }, "admin", change)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(audit).not.toHaveBeenCalled();
  });

  it("mesmo status não grava nem audita", async () => {
    const { db, calls } = fakeDb([{ data: { kind: "lead", status: "novo" }, error: null }]);
    const audit = vi.fn(async () => {});
    await expect(changeSubmissionStatus({ db, audit }, "admin", { ...change, status: "novo" })).resolves.toEqual({
      changed: false,
    });
    expect(calls.some(([method]) => method === "update")).toBe(false);
    expect(audit).not.toHaveBeenCalled();
  });

  it.each([
    ["lead", "lido"],
    ["contact", "lido"],
    ["feedback", "respondido"],
    ["feedback", "em_atendimento"],
  ])("%s não aceita o status %s, de outro fluxo", async (kind, status) => {
    const { db } = fakeDb([{ data: { kind, status: "novo" }, error: null }]);
    await expect(changeSubmissionStatus({ db, audit: vi.fn() }, "admin", { ...change, status })).rejects.toMatchObject({
      code: "VALIDATION_FAILED",
    });
  });

  it("erro do banco não expõe a mensagem interna", async () => {
    const { db } = fakeDb([{ data: null, error: { code: "XX000", message: "detalhe interno do banco" } }]);
    const error = await changeSubmissionStatus({ db, audit: vi.fn() }, "admin", change).catch((caught) => caught);
    expect(error).toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(error.message).not.toContain("detalhe interno");
  });
});

describe("listSubmissions", () => {
  const row = {
    id: ID,
    protocol: "AB-000000",
    kind: "lead",
    category: "lead:nao-sei",
    status: "novo",
    created_at: "2026-11-04T10:00:00Z",
    name: "Pessoa Fictícia",
  };

  it("sem tipo permitido não consulta o banco", async () => {
    const { db, calls } = fakeDb([]);
    await expect(listSubmissions(db, { page: 1 }, [])).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      totalPages: 1,
    });
    expect(calls).toEqual([]);
  });

  it("aplica os filtros, a ordem estável e o recorte de tipos", async () => {
    const { db, calls } = fakeDb([{ data: [row], error: null, count: 41 }]);
    const inbox = await listSubmissions(db, { page: 2, kind: "lead", status: "novo", category: "lead:nao-sei" }, ALL);
    expect(calls).toContainEqual(["in", ["kind", ALL]]);
    expect(calls).toContainEqual(["eq", ["kind", "lead"]]);
    expect(calls).toContainEqual(["eq", ["status", "novo"]]);
    expect(calls).toContainEqual(["eq", ["category", "lead:nao-sei"]]);
    expect(calls).toContainEqual(["range", [20, 39]]);
    expect(calls).toContainEqual(["order", ["id", { ascending: false }]]);
    expect(inbox).toMatchObject({ total: 41, page: 2, totalPages: 3 });
    expect(inbox.items[0]).toMatchObject({ protocol: "AB-000000", name: "Pessoa Fictícia" });
  });

  it("a lista lê só o nome, nunca o conteúdo inteiro nem os hashes", async () => {
    const { db, calls } = fakeDb([{ data: [], error: null, count: 0 }]);
    await listSubmissions(db, { page: 1 }, ALL);
    const columns = String(calls.find(([method]) => method === "select")?.[1][0]);
    expect(columns).toContain("name:payload->>name");
    expect(columns).not.toMatch(/(^|[ ,])payload([ ,]|$)/);
    expect(columns).not.toMatch(/ip_hash|fingerprint|last_notification_error|\*/);
  });

  it("página além do fim volta para a última que existe, em vez de erro", async () => {
    const { db } = fakeDb([
      { data: null, error: { code: "PGRST103", message: "Requested range not satisfiable" } },
      { data: [row], error: null, count: 25 },
      { data: [row], error: null, count: 25 },
    ]);
    await expect(listSubmissions(db, { page: 999 }, ALL)).resolves.toMatchObject({ page: 2, totalPages: 2, total: 25 });
  });

  it("página além do fim sem nenhum envio mostra a primeira, vazia", async () => {
    const { db } = fakeDb([
      { data: null, error: { code: "PGRST103", message: "Requested range not satisfiable" } },
      { data: [], error: null, count: 0 },
    ]);
    await expect(listSubmissions(db, { page: 3 }, ALL)).resolves.toMatchObject({ page: 1, items: [], total: 0 });
  });

  it("nome vazio vira anônimo", async () => {
    const { db } = fakeDb([{ data: [{ ...row, name: "" }], error: null, count: 1 }]);
    const inbox = await listSubmissions(db, { page: 1 }, ALL);
    expect(inbox.items[0].name).toBeNull();
  });

  it("erro do banco não expõe a mensagem interna", async () => {
    const { db } = fakeDb([{ data: null, error: { code: "XX000", message: "detalhe interno do banco" } }]);
    const error = await listSubmissions(db, { page: 1 }, ALL).catch((caught) => caught);
    expect(error).toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect(error.message).not.toContain("detalhe interno");
  });
});

describe("getSubmission", () => {
  it("id malformado nem chega ao banco", async () => {
    const { db, calls } = fakeDb([]);
    await expect(getSubmission(db, "not-a-uuid")).resolves.toBeNull();
    expect(calls).toEqual([]);
  });

  it("não pede hash de IP, impressão digital nem erro do provedor", async () => {
    const { db, calls } = fakeDb([{ data: null, error: null }]);
    await getSubmission(db, ID);
    const columns = String(calls.find(([method]) => method === "select")?.[1][0]);
    expect(columns).not.toMatch(/ip_hash|fingerprint|last_notification_error|\*/);
  });

  it("sem permissão no banco vira 403, não erro interno", async () => {
    const { db } = fakeDb([{ data: null, error: { code: "42501", message: "permission denied" } }]);
    await expect(getSubmission(db, ID)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("arquitetura", () => {
  it.each(["lib/server/forms/inbox.ts", "lib/server/forms/inbox-context.ts"])(
    "%s não usa service role nem cache persistente",
    (file) => {
      const source = readFileSync(file, "utf8");
      expect(source).not.toMatch(/from "\.\.\/supabase\/admin"|supabase\/admin"|getServiceClient\(/);
      expect(source).not.toMatch(/^\s*"use cache/m);
      expect(source).not.toMatch(/cacheTag|unstable_cache/);
    },
  );
});
