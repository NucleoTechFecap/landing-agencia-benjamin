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
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 04/11/2026 Vinícius Nishimura Reis  Páginas estáticas dos formulários de /contato (FORM-08).
 12/11/2026 Codex                     Inclui o blog na navegação (FUT-10).
──────────────────────────────────────────────────────────────────────────────
*/

/** Navegação principal do site público (PRJ §7.3 e §41). */
export const MAIN_NAVIGATION = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Sobre" },
  { href: "/areas", label: "Áreas" },
  { href: "/servicos", label: "Serviços" },
  { href: "/cases", label: "Cases" },
  { href: "/blog", label: "Blog" },
  { href: "/contato", label: "Contato" },
] as const;

export const SECONDARY_NAVIGATION = [
  { href: "/feedback", label: "Deixe seu feedback" },
  { href: "/privacidade", label: "Aviso de privacidade" },
] as const;

/**
 * Formulários de /contato em página estática, para quem envia sem JavaScript ou antes da hidratação
 * (`useSubmission`). Fora do menu, do sitemap e dos buscadores: quem tem JavaScript fica em /contato.
 */
export const STANDALONE_FORM_PATHS = { lead: "/contato/projeto", contact: "/contato/mensagem" } as const;
