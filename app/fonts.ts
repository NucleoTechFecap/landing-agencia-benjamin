/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : fonts.ts
 Descrição    : Fontes oferecidas na aparência do site, servidas pelo próprio site.

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

import {
  DM_Sans,
  Inter,
  Merriweather,
  Montserrat,
  Nunito,
  Playfair_Display,
  Poppins,
  Raleway,
  Work_Sans,
} from "next/font/google";

/*
 * Toda fonte de THEME_FONTS (lib/domain/content/theme.ts) precisa estar aqui. Com `preload: false`, o
 * navegador só baixa a que estiver em uso de fato. O arquivo fica no próprio site: a escolha de fonte
 * não cria pedido a terceiros nem muda a CSP. O next/font exige as opções escritas em cada chamada: não dá para
 * guardar `subsets` numa constante.
 */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], display: "swap", preload: false });
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
});
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin", "latin-ext"], display: "swap", preload: false });
const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
});
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
});
const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
});
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
});
const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin", "latin-ext"],
  display: "swap",
  preload: false,
});

/** Classes que declaram as variáveis no <html>; a fonte em uso sai do `--font-sans` do tema. */
export const fontVariables = [poppins, inter, montserrat, nunito, raleway, dmSans, workSans, playfair, merriweather]
  .map((font) => font.variable)
  .join(" ");
