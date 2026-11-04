/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Componentes
 Arquivo      : site-image.tsx
 Descrição    : Imagem do site vinda do tema ou do painel, sem derrubar a página por host desconhecido.

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

import Image from "next/image";
import type { ComponentProps } from "react";
import { publicEnv } from "@/lib/config/public-env";

/**
 * A imagem fica gravada como endereço, então um host fora de `images.remotePatterns` (ex.: projeto
 * Supabase trocado) derrubaria a página. Nesse caso ela vai sem otimização.
 */
export const isKnownImageSource = (src: string): boolean =>
  src.startsWith("/") || src.startsWith(`${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/`);

export function SiteImage({ src, alt, unoptimized, ...props }: ComponentProps<typeof Image> & { src: string }) {
  return <Image src={src} alt={alt} unoptimized={unoptimized || !isKnownImageSource(src)} {...props} />;
}
