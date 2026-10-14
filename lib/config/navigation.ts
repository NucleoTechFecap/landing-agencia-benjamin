/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : navigation.ts
 Descrição    : Itens de navegação principal e secundária do site público.

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

/** Navegação principal do site público (PRJ §7.3 e §41). */
export const MAIN_NAVIGATION = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/areas", label: "Áreas" },
  { href: "/servicos", label: "Serviços" },
  { href: "/cases", label: "Cases" },
  { href: "/contato", label: "Contato" },
] as const;

export const SECONDARY_NAVIGATION = [
  { href: "/feedback", label: "Deixe seu feedback" },
  { href: "/privacidade", label: "Aviso de privacidade" },
] as const;
