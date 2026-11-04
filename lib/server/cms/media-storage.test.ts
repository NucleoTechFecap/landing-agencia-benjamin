/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : media-storage.test.ts
 Descrição    : Leitura do início de um objeto do Storage por Range.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 02/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 02/11/2026 Vinícius Nishimura Reis  Criação inicial (TECH-13, #313).
 04/11/2026 Vinícius Nishimura Reis  Remoção que não apagou nada é falha, não sucesso (SEG-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { afterEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseMediaStorage, readObjectStart } from "./media-storage";

const URL = "https://projeto.supabase.co/storage/v1/object/public/media/a.pdf";

function respondWith(body: BodyInit | null, init: ResponseInit) {
  const fetchMock = vi.fn(async () => new Response(body, init));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("readObjectStart (TECH-13, #313)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("pede só o início e lê o tamanho total do Content-Range", async () => {
    const fetchMock = respondWith(new Uint8Array(16), {
      status: 206,
      headers: { "content-type": "application/pdf", "content-range": "bytes 0-15/8388608" },
    });
    await expect(readObjectStart(URL, 16)).resolves.toMatchObject({ size: 8388608, contentType: "application/pdf" });
    expect(fetchMock).toHaveBeenCalledWith(URL, { headers: { Range: "bytes=0-15" }, cache: "no-store" });
  });

  it("servidor que ignora o Range: corta no limite e usa o tamanho do corpo", async () => {
    respondWith(new Uint8Array(100), { status: 200, headers: { "content-type": "image/png" } });
    const result = await readObjectStart(URL, 16);
    expect(result?.bytes).toHaveLength(16);
    expect(result?.size).toBe(100);
  });

  it("arquivo inexistente devolve null, e o Storage responde 404 ou 400", async () => {
    respondWith(null, { status: 404 });
    await expect(readObjectStart(URL, 16)).resolves.toBeNull();
    respondWith(null, { status: 400 });
    await expect(readObjectStart(URL, 16)).resolves.toBeNull();
  });

  it("arquivo vazio (416) chega à validação com tamanho zero", async () => {
    respondWith(null, { status: 416 });
    await expect(readObjectStart(URL, 16)).resolves.toMatchObject({ size: 0 });
  });

  it("erro do Storage ou Content-Range inválido não vira arquivo aceito", async () => {
    respondWith(null, { status: 500 });
    await expect(readObjectStart(URL, 16)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    respondWith(new Uint8Array(16), { status: 206, headers: { "content-range": "bytes 0-15/*" } });
    await expect(readObjectStart(URL, 16)).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
  });
});

describe("createSupabaseMediaStorage: remoção (SEG-05)", () => {
  const storageReturning = (result: { data: unknown; error: unknown }) =>
    createSupabaseMediaStorage({
      storage: { from: () => ({ remove: async () => result }) },
    } as unknown as SupabaseClient);

  it("só resolve quando o Storage devolve o objeto removido", async () => {
    await expect(storageReturning({ data: [{ name: "a.pdf" }], error: null }).remove("a.pdf")).resolves.toBeUndefined();
  });

  it("erro do Storage vira falha, com a causa", async () => {
    const error = new Error("fora do ar");
    await expect(storageReturning({ data: null, error }).remove("a.pdf")).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
      cause: error,
    });
  });

  it("lista vazia sem erro (sem permissão ou nada a apagar) também é falha", async () => {
    await expect(storageReturning({ data: [], error: null }).remove("a.pdf")).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });
});
