/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : rbac-sql.test.ts
 Descrição    : Garante que o seed SQL de permissões é idêntico à matriz RBAC do código.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { listGrants } from "@/lib/domain/auth/rbac";

const MIGRATIONS = join(process.cwd(), "supabase", "migrations");

/** Lê as tuplas (role, resource, action) inseridas em role_permissions nas migrations. */
function grantsFromSql(): string[] {
  const sql = readdirSync(MIGRATIONS)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => readFileSync(join(MIGRATIONS, file), "utf8"))
    .join("\n");
  const block = sql.match(/insert into public\.role_permissions[^;]+;/i)?.[0] ?? "";
  return [...block.matchAll(/\('([a-z_]+)',\s*'([a-z_]+)',\s*'([a-z_]+)'\)/g)].map(([, role, resource, action]) =>
    [role, resource, action].join(":"),
  );
}

describe("consistência RBAC código × banco (TECH-03/ADM-03)", () => {
  it("o seed SQL de role_permissions é idêntico à matriz em código", () => {
    const fromCode = listGrants()
      .map((grant) => [grant.role, grant.resource, grant.action].join(":"))
      .sort();
    expect(grantsFromSql().sort()).toEqual(fromCode);
  });
});
