/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : server.ts
 Descrição    : Clientes Supabase: sessão do usuário (cookies) e leitura pública anônima.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isSupabaseConfigured, publicEnv } from "@/lib/config/public-env";
import { AppError } from "../errors";

function credentials() {
  if (!isSupabaseConfigured) {
    throw new AppError("SERVICE_UNAVAILABLE", { message: "Autenticação indisponível neste ambiente." });
  }
  return { url: publicEnv.NEXT_PUBLIC_SUPABASE_URL!, anonKey: publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY! };
}

/**
 * Cliente com a sessão do usuário (cookies httpOnly). Toda operação do painel passa
 * pela RLS do banco com a identidade de quem está logado — segunda barreira (ADR-0003).
 */
export async function createSessionClient() {
  const { url, anonKey } = credentials();
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components não gravam cookies; a renovação acontece no proxy.ts.
        }
      },
    },
  });
}

/** Cliente anônimo sem cookies, para leituras públicas (RLS expõe só conteúdo publicado). */
export function createPublicClient() {
  const { url, anonKey } = credentials();
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
