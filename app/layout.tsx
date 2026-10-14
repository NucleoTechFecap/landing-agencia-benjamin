/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : layout.tsx
 Descrição    : Layout raiz: idioma pt-BR, fonte Poppins e metadados padrão.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ARC-03).
 13/10/2026 Vinícius Nishimura Reis  Metadados globais, viewport e template de título (SEO da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { isIndexable, siteUrl } from "@/lib/config/public-env";
import { getSiteSettings } from "@/lib/server/content/repository";
import { DEFAULT_TITLE, SITE_NAME } from "@/lib/server/seo";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

/** Metadados padrão de todo o site; cada página complementa com buildMetadata(). */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(siteUrl),
    title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
    description: settings.description,
    applicationName: SITE_NAME,
    keywords: settings.keywords,
    authors: [{ name: SITE_NAME, url: siteUrl }],
    creator: "NúcleoTech FECAP",
    publisher: SITE_NAME,
    category: "Comunicação e marketing",
    formatDetection: { telephone: false, email: false, address: false },
    robots: isIndexable ? { index: true, follow: true } : { index: false, follow: false },
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: SITE_NAME,
      url: "/",
      title: DEFAULT_TITLE,
      description: settings.description,
    },
    twitter: { card: "summary_large_image", title: DEFAULT_TITLE, description: settings.description },
  };
}

export const viewport: Viewport = {
  themeColor: "#004a1b",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
