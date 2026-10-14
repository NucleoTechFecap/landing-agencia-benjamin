/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : admin.ts
 Descrição    : Cliente Supabase com service_role restrito à gravação de envios validados.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, publicEnv } from "@/lib/config/public-env";
import { getServerEnv } from "@/lib/config/server-env";

let client: SupabaseClient | undefined;

/**
 * Cliente com service_role (ignora RLS). Uso restrito ao servidor para operações que o
 * visitante não pode fazer diretamente no banco: gravar envios de formulário já
 * validados (TECH-07). Nunca usar em leitura de conteúdo nem expor ao cliente.
 */
export function getServiceClient(): SupabaseClient | null {
  const key = getServerEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!isSupabaseConfigured || !key) return null;
  client ??= createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
