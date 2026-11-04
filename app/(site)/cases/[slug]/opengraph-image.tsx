/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : opengraph-image.tsx
 Descrição    : Imagem Open Graph de cada case.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (SEO da landing).
 04/11/2026 Vinícius Nishimura Reis  Slug fora do formato não alcança o cache do conteúdo (DB-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { ImageResponse } from "next/og";
import { OgCard } from "@/components/seo/og-card";
import { isValidSlug } from "@/lib/domain/content/slug";
import { getCaseDetail } from "@/lib/server/content/repository";
import { OG_SIZE, ogFonts, ogLogoDataUrl } from "@/lib/server/og";

export const alt = "Case da Agência Benjamin";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Imagem de compartilhamento de cada case. */
export default async function CaseOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // O proxy não cobre esta rota: slug fora do formato nem chega ao cache e cai na imagem genérica.
  const [detail, logo, fonts] = await Promise.all([
    isValidSlug(slug) ? getCaseDetail(slug) : null,
    ogLogoDataUrl(),
    ogFonts(),
  ]);
  return new ImageResponse(
    <OgCard
      eyebrow={detail?.category?.name ?? "Case"}
      title={detail?.item.title ?? "Cases da Agência Benjamin"}
      subtitle={detail ? `Cliente: ${detail.item.client}` : undefined}
      logoSrc={logo}
    />,
    { ...size, fonts },
  );
}
