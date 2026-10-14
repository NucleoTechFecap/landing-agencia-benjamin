/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : brand-icon.tsx
 Descrição    : Ícones oficiais do brandbook em seis cores.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";

export const BRAND_ICON_COLORS = ["verde", "verde-claro", "lima", "laranja", "rosa", "azul"] as const;
export type BrandIconColor = (typeof BRAND_ICON_COLORS)[number];

/** Ícone oficial do brandbook (public/brand/icons). Decorativo por padrão. */
export function BrandIcon({
  name,
  color = "verde",
  size = 64,
  alt = "",
  className = "",
}: {
  name: string;
  color?: BrandIconColor;
  size?: number;
  alt?: string;
  className?: string;
}) {
  return (
    <Image
      src={`/brand/icons/${name}-${color}.webp`}
      alt={alt}
      width={size}
      height={size}
      className={`h-auto select-none ${className}`}
      style={{ width: size }}
      aria-hidden={alt ? undefined : true}
    />
  );
}
