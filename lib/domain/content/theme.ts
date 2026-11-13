/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : theme.ts
 Descrição    : Aparência do site: cores, fontes, logotipos e imagem de compartilhamento, com checagem de contraste.

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

import { z } from "zod";
import { imageValueSchema, type ImageValue } from "./fields";

/*
 * A aparência é uma camada sobre a marca: o tema guarda só o que diverge. Vazio, o site é exatamente
 * o do brandbook, e "Voltar à marca" é só apagar. As cores chegam ao CSS como variáveis, então só um
 * hexadecimal validado entra no <style> (themeCss): nada digitado no painel vira CSS livre.
 */

export const THEME_COLORS = {
  verde: { label: "Verde (principal)", value: "#004a1b", hint: "Títulos, faixas escuras e botão principal." },
  lima: { label: "Lima (destaque)", value: "#24d139", hint: "Faixas e botões de destaque." },
  claro: { label: "Verde-claro", value: "#a0ef91", hint: "Fundos suaves e cartões." },
  nyanza: { label: "Nyanza (fundo)", value: "#f1fcd0", hint: "Fundo principal e texto sobre fundos escuros." },
  laranja: { label: "Laranja", value: "#f1742e", hint: "Faixa final de chamada." },
  azul: { label: "Azul", value: "#1a44a6", hint: "Faixas e foco do teclado." },
  rosa: { label: "Rosa", value: "#ffb4e2", hint: "Faixas e selos." },
  creme: { label: "Creme", value: "#edf1cc", hint: "Fundos neutros." },
  noite: { label: "Quase preto", value: "#161313", hint: "Texto, bordas e sombras." },
  grafite: { label: "Grafite", value: "#231f20", hint: "Texto corrido." },
} as const;

export type ThemeColor = keyof typeof THEME_COLORS;
export const THEME_COLOR_NAMES = Object.keys(THEME_COLORS) as ThemeColor[];

/**
 * Fontes oferecidas. Precisam estar declaradas em app/fonts.ts: o arquivo é baixado no build e servido
 * pelo próprio site, sem pedido a terceiros, e o navegador só carrega a que estiver em uso.
 */
export const THEME_FONTS = {
  poppins: { label: "Poppins (marca)", cssVar: "--font-poppins" },
  inter: { label: "Inter", cssVar: "--font-inter" },
  montserrat: { label: "Montserrat", cssVar: "--font-montserrat" },
  nunito: { label: "Nunito", cssVar: "--font-nunito" },
  raleway: { label: "Raleway", cssVar: "--font-raleway" },
  "dm-sans": { label: "DM Sans", cssVar: "--font-dm-sans" },
  "work-sans": { label: "Work Sans", cssVar: "--font-work-sans" },
  playfair: { label: "Playfair Display (serifada)", cssVar: "--font-playfair" },
  merriweather: { label: "Merriweather (serifada)", cssVar: "--font-merriweather" },
} as const;

export type ThemeFont = keyof typeof THEME_FONTS;
export const THEME_FONT_NAMES = Object.keys(THEME_FONTS) as ThemeFont[];
export const DEFAULT_THEME_FONT: ThemeFont = "poppins";

export const THEME_IMAGES = {
  logoHeader: { label: "Logotipo do cabeçalho", hint: "Altura mínima de 70 px em telas (brandbook)." },
  logoFooter: { label: "Logotipo do rodapé", hint: "Aparece sobre o fundo verde." },
  logoHero: { label: "Logotipo da abertura da Home", hint: "Vertical, sem fundo." },
  favicon: { label: "Ícone da aba do navegador", hint: "PNG quadrado, de pelo menos 512 × 512 px." },
  shareImage: {
    label: "Imagem padrão de compartilhamento",
    hint: "1200 × 630 px. Vale para as páginas sem imagem própria na aba SEO.",
  },
} as const;

export type ThemeImage = keyof typeof THEME_IMAGES;
export const THEME_IMAGE_NAMES = Object.keys(THEME_IMAGES) as ThemeImage[];

/** Padrões dos logotipos quando o tema não diz nada. */
export const DEFAULT_LOGOS = {
  logoHeader: { src: "/brand/logos/logo-horizontal.svg", alt: "Agência Benjamin", width: 107, height: 70 },
  logoFooter: { src: "/brand/logos/logo-horizontal.svg", alt: "Agência Benjamin", width: 180, height: 117 },
  logoHero: { src: "/brand/logos/logo-vertical.svg", alt: "", width: 480, height: 496 },
} as const;

const HEX = /^#[0-9a-f]{6}$/;
const hexColor = z.string().trim().toLowerCase().regex(HEX, "Use uma cor no formato #rrggbb.");

export const themeSchema = z.object({
  colors: z.partialRecord(z.enum(THEME_COLOR_NAMES as [ThemeColor, ...ThemeColor[]]), hexColor).optional(),
  fontBody: z.enum(THEME_FONT_NAMES as [ThemeFont, ...ThemeFont[]]).optional(),
  fontHeading: z.enum(THEME_FONT_NAMES as [ThemeFont, ...ThemeFont[]]).optional(),
  images: z.partialRecord(z.enum(THEME_IMAGE_NAMES as [ThemeImage, ...ThemeImage[]]), imageValueSchema).optional(),
});

export type SiteTheme = z.output<typeof themeSchema>;

export const EMPTY_THEME: SiteTheme = {};

/** Tira o que é igual à marca: o histórico e o `<style>` só carregam o que de fato mudou. */
export function compactTheme(theme: SiteTheme): SiteTheme {
  const colors = Object.fromEntries(
    Object.entries(theme.colors ?? {}).filter(([name, value]) => value !== THEME_COLORS[name as ThemeColor].value),
  );
  const images = Object.fromEntries(Object.entries(theme.images ?? {}).filter(([, value]) => value));
  return {
    ...(Object.keys(colors).length ? { colors } : {}),
    ...(theme.fontBody && theme.fontBody !== DEFAULT_THEME_FONT ? { fontBody: theme.fontBody } : {}),
    ...(theme.fontHeading && theme.fontHeading !== (theme.fontBody ?? DEFAULT_THEME_FONT)
      ? { fontHeading: theme.fontHeading }
      : {}),
    ...(Object.keys(images).length ? { images } : {}),
  };
}

/** Valor do banco: inválido vira a identidade padrão, para um tema quebrado nunca derrubar o site. */
export function parseTheme(raw: unknown): { theme: SiteTheme; problems: string[] } {
  const result = themeSchema.safeParse(raw ?? {});
  if (result.success) return { theme: compactTheme(result.data), problems: [] };
  return { theme: EMPTY_THEME, problems: result.error.issues.map((issue) => issue.path.join(".") || issue.message) };
}

export const themeColor = (theme: SiteTheme | undefined, name: ThemeColor): string =>
  theme?.colors?.[name] ?? THEME_COLORS[name].value;

const fontStack = (font: ThemeFont) => `var(${THEME_FONTS[font].cssVar}), ui-sans-serif, system-ui, sans-serif`;

/**
 * CSS do tema, vazio quando nada diverge da marca. Sobrescreve as variáveis do @theme de
 * app/globals.css, que todo utilitário do Tailwind já lê em tempo de execução.
 */
export function themeCss(theme: SiteTheme | undefined): string {
  if (!theme) return "";
  const variables = [
    ...THEME_COLOR_NAMES.flatMap((name) => {
      const value = theme.colors?.[name];
      return value && HEX.test(value) ? [`--color-benja-${name}:${value}`] : [];
    }),
    ...(theme.fontBody ? [`--font-sans:${fontStack(theme.fontBody)}`] : []),
  ];
  const root = variables.length ? `:root{${variables.join(";")}}` : "";
  const heading = theme.fontHeading ? `h1,h2,h3,h4,h5,h6{font-family:${fontStack(theme.fontHeading)}}` : "";
  return root + heading;
}

export const themeImage = (theme: SiteTheme | undefined, name: ThemeImage): ImageValue | undefined =>
  theme?.images?.[name];

/* ─── Contraste (WCAG 2.2) ─── */

function luminance(hex: string): number {
  const channel = (start: number) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

export function contrastRatio(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** Texto e fundo que o site combina (components/ui/section.tsx e botões). */
export const THEME_PAIRS: readonly { background: ThemeColor; text: ThemeColor; where: string }[] = [
  { background: "nyanza", text: "noite", where: "Texto sobre o fundo principal" },
  { background: "nyanza", text: "verde", where: "Títulos sobre o fundo principal" },
  { background: "verde", text: "nyanza", where: "Texto nas faixas verdes e no botão principal" },
  { background: "lima", text: "verde", where: "Texto nas faixas e botões de destaque" },
  { background: "claro", text: "verde", where: "Texto nos cartões verde-claros" },
  { background: "laranja", text: "noite", where: "Texto na faixa final" },
  { background: "azul", text: "nyanza", where: "Texto nas faixas azuis" },
  { background: "rosa", text: "noite", where: "Texto nas faixas rosa" },
  { background: "creme", text: "noite", where: "Texto nas faixas creme" },
];

/** Abaixo disso nem texto grande fica legível (WCAG 1.4.3): o painel recusa. */
export const MIN_CONTRAST = 3;
/** Texto normal AA: abaixo disso o painel avisa, sem impedir. */
export const AA_CONTRAST = 4.5;

export interface ContrastProblem {
  where: string;
  background: ThemeColor;
  text: ThemeColor;
  ratio: number;
  /** `true` quando fica abaixo do mínimo e o painel não salva. */
  blocking: boolean;
}

export function contrastProblems(theme: SiteTheme | undefined): ContrastProblem[] {
  return THEME_PAIRS.flatMap((pair) => {
    const ratio = contrastRatio(themeColor(theme, pair.background), themeColor(theme, pair.text));
    return ratio >= AA_CONTRAST ? [] : [{ ...pair, ratio, blocking: ratio < MIN_CONTRAST }];
  });
}
