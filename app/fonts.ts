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
 Modificado em: 13/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
 13/11/2026 Vinícius Nishimura Reis  Arquivos no repositório: o build não depende do Google Fonts.
──────────────────────────────────────────────────────────────────────────────
*/

import localFont from "next/font/local";

/*
 * Toda fonte de THEME_FONTS (lib/domain/content/theme.ts) precisa estar aqui. Com `preload: false`, o
 * navegador só baixa a que estiver em uso de fato. Os arquivos ficam em assets/fonts/web, com os recortes
 * latin e latin-ext do Google Fonts (como aparecem lá: assets/fonts/web/README.md). Com next/font/google o
 * build baixava as fontes e falhava quando o download estourava o tempo. O next/font exige as opções escritas
 * em cada chamada: não dá para guardar `display` ou `preload` numa constante.
 */
const poppins = localFont({
  src: [
    { path: "../assets/fonts/web/poppins/Poppins-Light.woff2", weight: "300", style: "normal" },
    { path: "../assets/fonts/web/poppins/Poppins-Regular.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/web/poppins/Poppins-Medium.woff2", weight: "500", style: "normal" },
    { path: "../assets/fonts/web/poppins/Poppins-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../assets/fonts/web/poppins/Poppins-Bold.woff2", weight: "700", style: "normal" },
    { path: "../assets/fonts/web/poppins/Poppins-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../assets/fonts/web/poppins/Poppins-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});
const inter = localFont({
  src: "../assets/fonts/web/inter/Inter.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
  preload: false,
});
const montserrat = localFont({
  src: "../assets/fonts/web/montserrat/Montserrat.woff2",
  weight: "100 900",
  variable: "--font-montserrat",
  display: "swap",
  preload: false,
});
const nunito = localFont({
  src: "../assets/fonts/web/nunito/Nunito.woff2",
  weight: "200 1000",
  variable: "--font-nunito",
  display: "swap",
  preload: false,
});
const raleway = localFont({
  src: "../assets/fonts/web/raleway/Raleway.woff2",
  weight: "100 900",
  variable: "--font-raleway",
  display: "swap",
  preload: false,
});
const dmSans = localFont({
  src: "../assets/fonts/web/dmsans/DMSans.woff2",
  weight: "100 1000",
  variable: "--font-dm-sans",
  display: "swap",
  preload: false,
});
const workSans = localFont({
  src: "../assets/fonts/web/worksans/WorkSans.woff2",
  weight: "100 900",
  variable: "--font-work-sans",
  display: "swap",
  preload: false,
});
const playfair = localFont({
  src: "../assets/fonts/web/playfairdisplay/PlayfairDisplay.woff2",
  weight: "400 900",
  variable: "--font-playfair",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});
const merriweather = localFont({
  src: "../assets/fonts/web/merriweather/Merriweather.woff2",
  weight: "300 900",
  variable: "--font-merriweather",
  display: "swap",
  preload: false,
  adjustFontFallback: "Times New Roman",
});

/** Classes que declaram as variáveis no <html>; a fonte em uso sai do `--font-sans` do tema. */
export const fontVariables = [poppins, inter, montserrat, nunito, raleway, dmSans, workSans, playfair, merriweather]
  .map((font) => font.variable)
  .join(" ");
