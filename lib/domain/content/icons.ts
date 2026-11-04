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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Cores dos ícones no domínio; interrogação e exclamação no catálogo (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

/**
 * Ícones do brandbook oferecidos pelo CMS (16 de public/brand/icons, em 6 cores). O CMS só
 * oferece estes nomes: um ícone digitado à mão quebraria a imagem no site.
 */
export const BRAND_ICONS = [
  "calendario",
  "chapeu",
  "comentario",
  "coracao",
  "enviado",
  "estrela",
  "exclamacao",
  "hermes",
  "interrogacao",
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
  exclamacao: "Exclamação",
  hermes: "Hermes",
  interrogacao: "Interrogação",
  like: "Like",
  megafone: "Megafone",
  raio: "Raio",
  salvo: "Salvo",
  seta: "Seta",
  "seta-curva": "Seta curva",
  xicara: "Xícara",
};

/** Cores em que cada ícone existe em public/brand/icons. */
export const BRAND_ICON_COLORS = ["verde", "verde-claro", "lima", "laranja", "rosa", "azul"] as const;

export type BrandIconColor = (typeof BRAND_ICON_COLORS)[number];

export const BRAND_ICON_COLOR_LABELS: Readonly<Record<BrandIconColor, string>> = {
  verde: "Verde",
  "verde-claro": "Verde-claro",
  lima: "Lima",
  laranja: "Laranja",
  rosa: "Rosa",
  azul: "Azul",
};

export function isBrandIcon(value: unknown): value is BrandIconName {
  return typeof value === "string" && (BRAND_ICONS as readonly string[]).includes(value);
}
