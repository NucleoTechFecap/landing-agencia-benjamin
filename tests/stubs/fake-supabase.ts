/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : fake-supabase.ts
 Descrição    : Cliente Supabase falso em memória para testar consultas sem banco.

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

import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

export interface FakeTable {
  data?: Row[];
  error?: { message: string; code?: string };
}

export interface FakeCall {
  table: string;
  columns?: string;
  filters: Array<[column: string, value: unknown]>;
}

/**
 * Imita o encadeamento do PostgREST (`from().select().eq().order().limit()`) sobre dados em
 * memória. `eq` filtra de verdade, para o teste provar que a consulta pede o recorte certo.
 * Não simula RLS: isso fica nos testes pgTAP e no teste de integração com o Supabase local.
 */
export function fakeSupabase(tables: Record<string, FakeTable>) {
  const calls: FakeCall[] = [];
  const client = {
    from(table: string) {
      const call: FakeCall = { table, filters: [] };
      calls.push(call);
      let limit: number | undefined;
      const builder = {
        select(columns: string) {
          call.columns = columns;
          return builder;
        },
        eq(column: string, value: unknown) {
          call.filters.push([column, value]);
          return builder;
        },
        in(column: string, values: unknown[]) {
          call.filters.push([column, values]);
          return builder;
        },
        order() {
          return builder;
        },
        limit(count: number) {
          limit = count;
          return builder;
        },
        then<T>(
          resolve: (value: { data: Row[] | null; error: FakeTable["error"] | null }) => T,
          reject?: (e: unknown) => T,
        ) {
          const source = tables[table] ?? {};
          let rows = source.data ?? [];
          for (const [column, value] of call.filters) {
            rows = rows.filter((row) => (Array.isArray(value) ? value.includes(row[column]) : row[column] === value));
          }
          if (limit !== undefined) rows = rows.slice(0, limit);
          return Promise.resolve(source.error ? { data: null, error: source.error } : { data: rows, error: null }).then(
            resolve,
            reject,
          );
        },
      };
      return builder;
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}
