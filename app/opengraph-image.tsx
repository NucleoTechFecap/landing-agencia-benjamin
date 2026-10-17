/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : opengraph-image.tsx
 Descrição    : Imagem Open Graph padrão do site.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (SEO da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import { ImageResponse } from "next/og";
import { OgCard } from "@/components/seo/og-card";
import { getSiteSettings } from "@/lib/server/content/repository";
import { OG_SIZE, ogFonts, ogLogoDataUrl } from "@/lib/server/og";

export const alt = "Agência Benjamin — agência experimental de comunicação da FECAP";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Imagem padrão de compartilhamento (Open Graph/Twitter) de todo o site. */
export default async function OpenGraphImage() {
  const [settings, logo, fonts] = await Promise.all([getSiteSettings(), ogLogoDataUrl(), ogFonts()]);
  return new ImageResponse(
    <OgCard
      eyebrow="Agência Benjamin"
      title={settings.manifesto.title}
      subtitle="Estratégia, conteúdo, criação, eventos e assessoria de imprensa."
      logoSrc={logo}
    />,
    { ...size, fonts },
  );
}
