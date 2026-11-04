/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Scripts
 Arquivo      : backup-media.test.mjs
 Descrição    : Testes da validação de argumentos e de caminhos da cópia do bucket de mídia.

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
 04/11/2026 Vinicius Binda             Criação inicial (DB-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { assertOutsideRepo, assertSafeObjectPath, parseArgs, sha256 } from "./backup-media.mjs";

const env = {
  NEXT_PUBLIC_SUPABASE_URL: "https://destino.exemplo.invalid",
  SUPABASE_SERVICE_ROLE_KEY: "chave-ficticia",
};
const repo = resolve("repositorio-ficticio");

describe("parseArgs", () => {
  it("aceita baixar só com a pasta", () => {
    expect(parseArgs(["baixar", "--pasta", "copia"], env)).toMatchObject({
      command: "baixar",
      folder: resolve("copia"),
    });
  });

  it("recusa comando desconhecido, pasta ausente e variáveis ausentes", () => {
    expect(() => parseArgs(["apagar", "--pasta", "copia"], env)).toThrow(/baixar ou enviar/);
    expect(() => parseArgs(["baixar"], env)).toThrow(/--pasta/);
    expect(() => parseArgs(["baixar", "--pasta", "copia"], {})).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("enviar exige digitar o host do destino", () => {
    expect(() => parseArgs(["enviar", "--pasta", "copia"], env)).toThrow(/--confirmar destino\.exemplo\.invalid/);
    expect(() => parseArgs(["enviar", "--pasta", "copia", "--confirmar", "outro.invalid"], env)).toThrow(/--confirmar/);
    expect(parseArgs(["enviar", "--pasta", "copia", "--confirmar", "destino.exemplo.invalid"], env).command).toBe(
      "enviar",
    );
  });
});

describe("assertOutsideRepo", () => {
  it("recusa a raiz e qualquer pasta dentro do repositório", () => {
    expect(() => assertOutsideRepo(repo, repo)).toThrow(/fora do repositório/);
    expect(() => assertOutsideRepo(join(repo, "backups", "semana"), repo)).toThrow(/fora do repositório/);
  });

  it("aceita pasta fora, mesmo com nome parecido", () => {
    expect(() => assertOutsideRepo(join(dirname(repo), "copias"), repo)).not.toThrow();
    expect(() => assertOutsideRepo(`${repo}-copias`, repo)).not.toThrow();
  });

  it.runIf(process.platform === "win32")("aceita pasta em outra unidade do Windows", () => {
    expect(() => assertOutsideRepo("C:\copias\semana", "E:\repositorio")).not.toThrow();
  });
});

describe("assertSafeObjectPath", () => {
  it("aceita o caminho usado no bucket", () => {
    expect(() => assertSafeObjectPath("2026/11/6f1c2a3b-foto.webp")).not.toThrow();
  });

  it.each(["", "/absoluto.webp", "../fora.webp", "2026/../../fora.webp", "2026\\fora.webp"])("recusa %j", (path) => {
    expect(() => assertSafeObjectPath(path)).toThrow(/recusado/);
  });
});

describe("sha256", () => {
  it("muda com o conteúdo", () => {
    expect(sha256(Buffer.from("a"))).toBe(sha256(Buffer.from("a")));
    expect(sha256(Buffer.from("a"))).not.toBe(sha256(Buffer.from("b")));
  });
});
