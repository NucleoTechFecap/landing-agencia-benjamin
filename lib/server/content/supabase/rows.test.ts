/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : rows.test.ts
 Descrição    : Confere que as colunas lidas pelo site existem na migration do CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { COLUMNS } from "./rows";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");
const sql = readdirSync(MIGRATIONS)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(join(MIGRATIONS, file), "utf8"))
  .join("\n");

/** Nomes das colunas declaradas em `create table public.<tabela> ( ... );`. */
function tableColumns(table: string): string[] {
  const body = sql.match(new RegExp(`create table public\\.${table} \\(([\\s\\S]+?)\\n\\);`))?.[1] ?? "";
  return body
    .split("\n")
    .map((line) => line.trim().match(/^([a-z_]+) /)?.[1])
    .filter((name): name is string => Boolean(name) && name !== "constraint" && name !== "primary");
}

describe("colunas lidas pelo site × migration (DB-03)", () => {
  for (const [table, columns] of Object.entries(COLUMNS)) {
    it(`${table}: toda coluna selecionada existe no banco`, () => {
      const existing = tableColumns(table);
      expect(existing.length, `tabela ${table} não encontrada`).toBeGreaterThan(0);
      const selected = columns.split(",").map((column) => column.trim());
      expect(selected.filter((column) => !existing.includes(column))).toEqual([]);
    });
  }
});
