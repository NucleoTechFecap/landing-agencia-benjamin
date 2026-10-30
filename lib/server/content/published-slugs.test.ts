/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : published-slugs.test.ts
 Descrição    : Testes da resolução de endereços de serviço/case (atual, 301 e 404).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 29/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 26/10/2026 Vinícius Nishimura Reis  Parâmetro estático para banco vazio (DB-03).
 29/10/2026 Vinicius Binda             Endereço antigo e maiúsculas com 301 (DB-08).
──────────────────────────────────────────────────────────────────────────────
*/

import { describe, expect, it, vi } from "vitest";
import { PLACEHOLDER_SLUG, resolveDetailSlug, toStaticParams } from "./published-slugs";

// Conteúdo versionado + um endereço antigo, como o banco devolveria (resolve_public_slug).
vi.mock("./sources", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./sources")>();
  const renamed: Record<string, string> = { "meridiano-antigo": "meridiano" };
  return {
    ...actual,
    getContentSource: () => ({
      ...actual.localSource,
      currentSlug: async (...args: Parameters<typeof actual.localSource.currentSlug>) =>
        renamed[args[1]] ?? actual.localSource.currentSlug(...args),
    }),
  };
});

describe("resolveDetailSlug (DB-08)", () => {
  it("serve o endereço atual de serviços e cases publicados", async () => {
    expect(await resolveDetailSlug("servicos", "audiovisual")).toEqual({ status: "current" });
    expect(await resolveDetailSlug("cases", "meridiano")).toEqual({ status: "current" });
  });

  it("endereço antigo vai para o atual (301)", async () => {
    expect(await resolveDetailSlug("cases", "meridiano-antigo")).toEqual({ status: "moved", slug: "meridiano" });
  });

  it("maiúsculas vão para as minúsculas, já no endereço atual (um só 301)", async () => {
    expect(await resolveDetailSlug("cases", "Meridiano")).toEqual({ status: "moved", slug: "meridiano" });
    expect(await resolveDetailSlug("servicos", "AUDIOVISUAL")).toEqual({ status: "moved", slug: "audiovisual" });
    expect(await resolveDetailSlug("cases", "Meridiano-Antigo")).toEqual({ status: "moved", slug: "meridiano" });
  });

  it("recusa slug inexistente, mal formatado, reservado ou de outro tipo (404)", async () => {
    expect(await resolveDetailSlug("servicos", "nao-existe")).toEqual({ status: "missing" });
    expect(await resolveDetailSlug("servicos", "Nao-Existe")).toEqual({ status: "missing" });
    expect(await resolveDetailSlug("servicos", "Admin")).toEqual({ status: "missing" });
    expect(await resolveDetailSlug("servicos", "audio_visual")).toEqual({ status: "missing" });
    expect(await resolveDetailSlug("cases", "audiovisual")).toEqual({ status: "missing" });
  });

  it("recusa itens ainda não publicados na data", async () => {
    expect(await resolveDetailSlug("cases", "meridiano", new Date("2020-01-01T00:00:00Z"))).toEqual({
      status: "missing",
    });
  });
});

describe("toStaticParams (DB-03)", () => {
  it("gera um parâmetro por slug publicado", () => {
    expect(toStaticParams(["meridiano", "fecap"])).toEqual([{ slug: "meridiano" }, { slug: "fecap" }]);
  });

  it("com banco vazio devolve um slug impossível, que responde 404", async () => {
    expect(toStaticParams([])).toEqual([{ slug: PLACEHOLDER_SLUG }]);
    expect(await resolveDetailSlug("cases", PLACEHOLDER_SLUG)).toEqual({ status: "missing" });
  });
});
