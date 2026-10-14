/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : opengraph-image.tsx
 Descrição    : Imagem Open Graph de cada serviço.

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
import { getServiceDetail } from "@/lib/server/content/repository";
import { OG_SIZE, ogFonts, ogLogoDataUrl } from "@/lib/server/og";

export const alt = "Serviço da Agência Benjamin";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Imagem de compartilhamento de cada serviço. */
export default async function ServiceOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [detail, logo, fonts] = await Promise.all([getServiceDetail(slug), ogLogoDataUrl(), ogFonts()]);
  return new ImageResponse(
    <OgCard eyebrow="Serviço" title={detail?.service.name ?? "Serviços"} subtitle={detail?.service.summary} logoSrc={logo} />,
    { ...size, fonts },
  );
}
