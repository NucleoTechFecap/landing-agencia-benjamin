/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : page-texts.ts
 Descrição    : Manifesto e Sobre publicados em página, sobre os valores de site_settings.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Site lê páginas e blocos publicados no CMS (INT-03).
 02/11/2026 Vinícius Nishimura Reis  O site público não exibe mais o selo de provisório.
──────────────────────────────────────────────────────────────────────────────
*/

import type { Page, SiteSettings } from "./types";

/**
 * Manifesto e "Sobre" publicados em página tomam o lugar dos valores de site_settings (RF-01):
 * sem página publicada, o site segue com a configuração. A marca de provisório vem da página.
 */
export function withPublishedTexts(settings: SiteSettings, pages: readonly Page[]): SiteSettings {
  const result = { ...settings };
  for (const page of pages) {
    for (const block of page.blocks) {
      if (block.type === "manifesto") result.manifesto = { ...block.content, provisional: page.provisional };
      if (block.type === "about") result.about = { ...block.content, provisional: page.provisional };
    }
  }
  return result;
}
