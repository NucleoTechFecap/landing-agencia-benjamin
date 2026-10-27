/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Tests
 Arquivo      : helpers.ts
 Descrição    : Clientes e utilitários dos testes de integração com o Supabase local.

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
 26/10/2026 Vinícius Nishimura Reis  Usuários de teste por papel (ADM-07).
──────────────────────────────────────────────────────────────────────────────
*/

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
 * Os testes desta pasta rodam contra o Supabase local (`npx supabase start`), com a RLS
 * real. Sem as variáveis abaixo eles são pulados — `npm test` continua sem depender de
 * Docker. Para rodar: `npm run test:supabase` (lê as chaves de `supabase status`).
 */
export const supabaseTestEnv = {
  url: process.env.SUPABASE_TEST_URL,
  anonKey: process.env.SUPABASE_TEST_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_TEST_SERVICE_ROLE_KEY,
};

export const hasSupabaseTestEnv = Boolean(
  supabaseTestEnv.url && supabaseTestEnv.anonKey && supabaseTestEnv.serviceRoleKey,
);

const options = { auth: { persistSession: false, autoRefreshToken: false } };

/** Visitante: chave anônima, sujeita à RLS (só conteúdo publicado). */
export function anonClient(): SupabaseClient {
  return createClient(supabaseTestEnv.url!, supabaseTestEnv.anonKey!, options);
}

/** Preparação dos dados de teste: service_role ignora a RLS. Nunca usar no código do site. */
export function serviceClient(): SupabaseClient {
  return createClient(supabaseTestEnv.url!, supabaseTestEnv.serviceRoleKey!, options);
}

/** Sufixo para slugs de teste não colidirem com dados de desenvolvimento. */
export const testSuffix = () => Math.random().toString(36).slice(2, 8);

/** Falha o teste com a mensagem do PostgREST em vez de seguir com dados faltando. */
export async function must<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  // Insert sem .select() devolve data nula: quem precisa das linhas encadeia .select().
  return data as T;
}

export type TestRole = "super_admin" | "admin" | "editor" | "viewer" | "pending";

export interface TestUser {
  id: string;
  /** Cliente com a sessão do usuário: tudo o que ele faz passa pela RLS do papel (ADM-07). */
  client: SupabaseClient;
}

/** Cria uma conta confirmada com o papel pedido e devolve um cliente já autenticado. */
export async function createTestUser(role: TestRole, suffix: string): Promise<TestUser> {
  const admin = serviceClient();
  const email = `${role.replace("_", "-")}-${suffix}@teste.local`;
  const password = `Senha-de-teste-${suffix}-${role}!`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error(error?.message ?? "usuário não criado");
  await must(admin.from("profiles").update({ role }).eq("id", data.user.id));
  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw new Error(signInError.message);
  return { id: data.user.id, client };
}

export async function deleteTestUsers(users: readonly (TestUser | undefined)[]): Promise<void> {
  const admin = serviceClient();
  for (const user of users) if (user) await admin.auth.admin.deleteUser(user.id);
}
