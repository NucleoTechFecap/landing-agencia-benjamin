/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : public-env.ts
 Descrição    : Valida as variáveis públicas (NEXT_PUBLIC_*) e expõe URL, ambiente e flags.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ARC-05).
──────────────────────────────────────────────────────────────────────────────
*/

import { z } from "zod";

export const SITE_ENVIRONMENTS = ["development", "preview", "homologation", "production"] as const;
export type SiteEnvironment = (typeof SITE_ENVIRONMENTS)[number];

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

export const publicEnvSchema = z
  .object({
    NEXT_PUBLIC_SITE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
    NEXT_PUBLIC_SITE_ENV: z.preprocess(emptyToUndefined, z.enum(SITE_ENVIRONMENTS).default("development")),
    NEXT_PUBLIC_SUPABASE_URL: z.preprocess(emptyToUndefined, z.url().optional()),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(emptyToUndefined, z.string().min(20).optional()),
  })
  .superRefine((env, ctx) => {
    const isDeployed = env.NEXT_PUBLIC_SITE_ENV === "production" || env.NEXT_PUBLIC_SITE_ENV === "homologation";
    if (isDeployed && !env.NEXT_PUBLIC_SITE_URL) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SITE_URL"],
        message: "Obrigatória em homologação e produção.",
      });
    }
    if (Boolean(env.NEXT_PUBLIC_SUPABASE_URL) !== Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      ctx.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
        message: "Informe URL e chave anônima do Supabase juntas.",
      });
    }
  });

export type PublicEnv = z.infer<typeof publicEnvSchema>;

/** Valida as variáveis públicas; lança erro com a lista de problemas encontrados. */
export function parsePublicEnv(raw: Record<string, string | undefined>): PublicEnv {
  const result = publicEnvSchema.safeParse(raw);
  if (!result.success) {
    const problems = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Variáveis de ambiente públicas inválidas:\n- ${problems.join("\n- ")}`);
  }
  return result.data;
}

// As variáveis NEXT_PUBLIC_* precisam ser lidas de forma explícita para que o Next.js
// as embuta no bundle do cliente; acesso dinâmico (process.env[nome]) não funciona.
export const publicEnv = parsePublicEnv({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SITE_ENV: process.env.NEXT_PUBLIC_SITE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/** Origem canônica do site, sem barra final. */
export const siteUrl = (publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const siteEnvironment: SiteEnvironment = publicEnv.NEXT_PUBLIC_SITE_ENV;

/** Somente produção pode ser indexada por buscadores e assistentes de IA. */
export const isIndexable = siteEnvironment === "production";

export const isSupabaseConfigured = Boolean(
  publicEnv.NEXT_PUBLIC_SUPABASE_URL && publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
