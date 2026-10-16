/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Config
 Arquivo      : prettier.config.mjs
 Descrição    : Configuração do Prettier com regras alinhadas ao estilo existente do código.

 Desenvolvedor: Caio Moraes

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 16/10/2026
 Modificado em: 16/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 16/10/2026 Caio Moraes               Criação inicial (ARC-04).
──────────────────────────────────────────────────────────────────────────────
*/

/** @type {import("prettier").Config} */
const config = {
  printWidth: 120,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  tabWidth: 2,
  useTabs: false,
};

export default config;
