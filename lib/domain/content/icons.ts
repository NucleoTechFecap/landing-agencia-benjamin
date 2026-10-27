/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : icons.ts
 Descrição    : Ícones oficiais da marca disponíveis para áreas e serviços no CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
──────────────────────────────────────────────────────────────────────────────
*/

/**
 * Ícones do brandbook publicados em public/brand/icons (14 ícones × 6 cores, UX-14). O CMS
 * só oferece estes nomes: um ícone digitado à mão quebraria a imagem no site.
 */
export const BRAND_ICONS = [
  "calendario",
  "chapeu",
  "comentario",
  "coracao",
  "enviado",
  "estrela",
  "hermes",
  "like",
  "megafone",
  "raio",
  "salvo",
  "seta",
  "seta-curva",
  "xicara",
] as const;

export type BrandIconName = (typeof BRAND_ICONS)[number];

export const BRAND_ICON_LABELS: Record<BrandIconName, string> = {
  calendario: "Calendário",
  chapeu: "Chapéu",
  comentario: "Comentário",
  coracao: "Coração",
  enviado: "Enviado",
  estrela: "Estrela",
  hermes: "Hermes",
  like: "Like",
  megafone: "Megafone",
  raio: "Raio",
  salvo: "Salvo",
  seta: "Seta",
  "seta-curva": "Seta curva",
  xicara: "Xícara",
};

export function isBrandIcon(value: unknown): value is BrandIconName {
  return typeof value === "string" && (BRAND_ICONS as readonly string[]).includes(value);
}
