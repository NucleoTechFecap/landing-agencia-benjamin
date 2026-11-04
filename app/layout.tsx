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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ARC-03).
 13/10/2026 Vinícius Nishimura Reis  Metadados globais, viewport e template de título (SEO da landing).
 19/10/2026 Caio Moraes              Adiciona data-scroll-behavior ao html (LAY-01).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata, Viewport } from "next";
import { THEME_COLORS } from "@/lib/domain/content/theme";
import { isIndexable, siteUrl } from "@/lib/config/public-env";
import { getSiteSettings } from "@/lib/server/content/repository";
import { DEFAULT_TITLE, SITE_NAME } from "@/lib/server/seo";
import { fontVariables } from "./fonts";
import "./globals.css";

/** Metadados padrão de todo o site; cada página complementa com buildMetadata(). */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const shareImage = settings.theme?.images?.shareImage;
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
    // Em public/, e não em app/: um arquivo de ícone em app/ venceria o escolhido em Aparência.
    icons: {
      icon: settings.theme?.images?.favicon?.src ?? "/icon.png",
      apple: settings.theme?.images?.favicon?.src ?? "/apple-icon.png",
    },
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: SITE_NAME,
      url: "/",
      title: DEFAULT_TITLE,
      description: settings.description,
      ...(shareImage ? { images: [{ url: shareImage.src, alt: shareImage.alt || DEFAULT_TITLE }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: DEFAULT_TITLE,
      description: settings.description,
      ...(shareImage ? { images: [shareImage.src] } : {}),
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await getSiteSettings();
  return { themeColor: settings.theme?.colors?.verde ?? THEME_COLORS.verde.value, colorScheme: "light" };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: MotionGate adiciona a classe `motion` ao <html> antes da hidratação.
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${fontVariables} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
