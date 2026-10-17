/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Config
 Arquivo      : vitest.config.mts
 Descrição    : Configuração do Vitest para testes unitários em ambiente Node.

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
 13/10/2026 Vinícius Nishimura Reis  Alias do server-only para testes (ARC-05).
 16/10/2026 Caio Moraes              Renomeado para .mts: ESM explícito (ARC-04).
──────────────────────────────────────────────────────────────────────────────
*/

import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      "server-only": fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.mjs"],
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
  },
});
