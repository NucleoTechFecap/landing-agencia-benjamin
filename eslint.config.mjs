/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Config
 Arquivo      : eslint.config.mjs
 Descrição    : Configuração do ESLint (flat config) com regras do Next.js e TypeScript.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 16/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ARC-03).
 13/10/2026 Vinícius Nishimura Reis  Regras de fronteira entre camadas (TECH-01).
 16/10/2026 Caio Moraes              Integra eslint-config-prettier para evitar conflitos (ARC-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";

// Fronteiras de camadas (ADR-0003 / TECH-01): violações aparecem no `npm run lint`.
const serverOnlyModules = {
  group: ["@/lib/server/*", "@/lib/server/**", "@/lib/config/server-env", "@supabase/*"],
  message: "Acesso a I/O fica em lib/server e é chamado a partir de app/ (ADR-0003).",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["lib/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            serverOnlyModules,
            {
              group: [
                "next",
                "next/*",
                "react",
                "react-dom",
                "@/components/*",
                "@/components/**",
                "@/app/*",
                "@/app/**",
              ],
              message: "lib/domain contém apenas regras puras, sem framework ou UI (ADR-0003).",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [serverOnlyModules] }],
    },
  },
  {
    files: ["lib/server/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/*", "@/components/**", "@/app/*", "@/app/**"],
              message: "lib/server não depende de UI nem de rotas (ADR-0003).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  eslintConfigPrettier,
]);

export default eslintConfig;
