/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : tones.ts
 Descrição    : Nomes dos tons de seção do site, oferecidos também no painel.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

/** Tons de seção (UX-05). As classes e o contraste de cada um ficam em components/ui/section.tsx. */
export const SECTION_TONE_NAMES = ["nyanza", "verde", "lima", "claro", "laranja", "azul", "rosa", "creme"] as const;

export type SectionToneName = (typeof SECTION_TONE_NAMES)[number];

export const SECTION_TONE_LABELS: Readonly<Record<SectionToneName, string>> = {
  nyanza: "Nyanza (claro)",
  verde: "Verde",
  lima: "Lima",
  claro: "Verde-claro",
  laranja: "Laranja",
  azul: "Azul",
  rosa: "Rosa",
  creme: "Creme",
};
