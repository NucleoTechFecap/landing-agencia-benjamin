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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (DB-03).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
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

/** Colunas de `create table public.<tabela> ( ... );` mais as de `alter table ... add column`. */
function tableColumns(table: string): string[] {
  const body = sql.match(new RegExp(`create table public\\.${table} \\(([\\s\\S]+?)\\n\\);`))?.[1] ?? "";
  const created = body
    .split("\n")
    .map((line) => line.trim().match(/^([a-z_]+) /)?.[1])
    .filter((name): name is string => Boolean(name) && name !== "constraint" && name !== "primary");
  const added = [...sql.matchAll(new RegExp(`alter table public\\.${table}\\s([^;]+);`, "g"))].flatMap(([, changes]) =>
    [...changes.matchAll(/add column (?:if not exists )?([a-z_]+)/g)].map((match) => match[1]),
  );
  return [...created, ...added];
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
