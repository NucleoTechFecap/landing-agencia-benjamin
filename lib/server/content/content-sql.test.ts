/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : content-sql.test.ts
 Descrição    : Garante que as constraints das tabelas de conteúdo espelham as regras de domínio do código.

 Desenvolvedor: Vinícius Binda

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 25/10/2026
 Modificado em: 25/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 25/10/2026 Vinícius Binda             Criação inicial (DB-01/DBX-01).
──────────────────────────────────────────────────────────────────────────────
*/

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLICATION_STATUSES } from "@/lib/domain/content/publication-status";
import { RESERVED_SLUGS, SLUG_MAX_LENGTH, SLUG_MIN_LENGTH, SLUG_PATTERN } from "@/lib/domain/content/slug";
import { MEDIA_RULES } from "@/lib/domain/media/policy";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

const sql = readdirSync(MIGRATIONS)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(join(MIGRATIONS, file), "utf8"))
  .join("\n");

const quoted = (list: string) => [...list.matchAll(/'([^']+)'/g)].map(([, value]) => value);

/** Corpo SQL de uma função `create function public.<name>` até o `$$;` final. */
function functionBody(name: string): string {
  return sql.match(new RegExp(`create function public\\.${name}\\([\\s\\S]+?\\$\\$([\\s\\S]+?)\\$\\$;`))?.[1] ?? "";
}

describe("consistência conteúdo código × banco (DB-01/DBX-01)", () => {
  it("o enum publish_status tem os mesmos estados de PUBLICATION_STATUSES", () => {
    const values = sql.match(/create type public\.publish_status as enum \(([^)]+)\)/)?.[1] ?? "";
    expect(quoted(values)).toEqual([...PUBLICATION_STATUSES]);
  });

  it("is_valid_slug aplica o mesmo formato, tamanho e lista reservada de validateSlug", () => {
    const body = functionBody("is_valid_slug");
    expect(body.match(/p_slug ~ '([^']+)'/)?.[1]).toBe(SLUG_PATTERN.source.replace("(?:", "("));
    expect(body).toContain(`between ${SLUG_MIN_LENGTH} and ${SLUG_MAX_LENGTH}`);
    const reserved = body.match(/<> all \(array\[([^\]]+)\]\)/)?.[1] ?? "";
    expect(quoted(reserved).sort()).toEqual([...RESERVED_SLUGS].sort());
  });

  it("media_assets aceita os mesmos formatos, extensões e limites de MEDIA_RULES", () => {
    const mimes = sql.match(/mime_type text not null check \(mime_type in \(([^)]+)\)\)/)?.[1] ?? "";
    expect(quoted(mimes).sort()).toEqual(Object.keys(MEDIA_RULES).sort());
    for (const [mime, rule] of Object.entries(MEDIA_RULES)) {
      expect(sql).toContain(`when '${mime}' then '${rule.extension}'`);
    }
    const limits = sql.match(/when mime_type = 'application\/pdf' then (\d+) else (\d+) end/);
    expect(Number(limits?.[1])).toBe(MEDIA_RULES["application/pdf"].maxBytes);
    expect(Number(limits?.[2])).toBe(MEDIA_RULES["image/jpeg"].maxBytes);
  });

  it("toda tabela de public habilita RLS (supabase/README.md)", () => {
    const tables = [...sql.matchAll(/create table public\.(\w+)/g)].map(([, table]) => table);
    const protectedTables = new Set(
      [...sql.matchAll(/alter table public\.(\w+) enable row level security/g)].map(([, table]) => table),
    );
    expect(tables.filter((table) => !protectedTables.has(table))).toEqual([]);
  });
});
