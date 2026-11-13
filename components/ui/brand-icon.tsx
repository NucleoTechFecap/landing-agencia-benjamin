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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 25/10/2026 Caio Moraes              Caixa quadrada com object-contain, sem aviso do Image (LAY-06).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";
import type { BrandIconColor } from "@/lib/domain/content/icons";

export { BRAND_ICON_COLORS, type BrandIconColor } from "@/lib/domain/content/icons";

/**
 * Ícone oficial do brandbook em vetor (public/brand/icons), nítido em qualquer tamanho e densidade.
 * Decorativo por padrão. Os ícones não são todos quadrados: a caixa é fixa (size × size) e a imagem
 * se encaixa com object-contain, o que evita o aviso do next/image de "width or height modified" (LAY-06).
 */
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
      src={`/brand/icons/${name}-${color}.svg`}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className={`object-contain select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={alt ? undefined : true}
    />
  );
}
