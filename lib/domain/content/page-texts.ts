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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Site lê páginas e blocos publicados no CMS (INT-03).
 02/11/2026 Vinícius Nishimura Reis  O site público não exibe mais o selo de provisório.
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import type { Page, SiteSettings } from "./types";

/**
 * O padrão dos campos da Home e do Sobre: configuração mais blocos, sem os próprios campos. Comparar um
 * campo com o que já inclui ele mesmo faria toda edição salva parecer "igual ao original" e sumir.
 */
export function withPublishedBlocks(settings: SiteSettings, pages: readonly Page[]): SiteSettings {
  const result = { ...settings };
  for (const page of pages) {
    for (const block of page.blocks) {
      if (block.type === "manifesto") result.manifesto = { ...block.content, provisional: page.provisional };
      if (block.type === "about") result.about = { ...block.content, provisional: page.provisional };
    }
  }
  return result;
}

/**
 * Manifesto e "Sobre" publicados em página tomam o lugar dos valores de site_settings (RF-01):
 * sem página publicada, o site segue com a configuração. A marca de provisório vem da página.
 */
export function withPublishedTexts(settings: SiteSettings, pages: readonly Page[]): SiteSettings {
  const result = withPublishedBlocks(settings, pages);
  for (const page of pages) {
    // Título e parágrafos da abertura, editados nos campos da Home, valem também para as imagens de
    // compartilhamento, que leem o manifesto daqui.
    if (page.slug === "home") {
      const values = page.fields?.values ?? {};
      const title = values["abertura.titulo"];
      const paragraphs = values["abertura.paragrafos"];
      if (typeof title === "string") result.manifesto = { ...result.manifesto, title };
      if (Array.isArray(paragraphs)) result.manifesto = { ...result.manifesto, paragraphs: paragraphs as string[] };
    }
  }
  return result;
}
