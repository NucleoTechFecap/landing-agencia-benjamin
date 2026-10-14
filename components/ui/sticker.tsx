/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : sticker.tsx
 Descrição    : Stickers decorativos da identidade visual.

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

/** Sticker da identidade (public/brand/stickers), sempre decorativo. */
export function Sticker({
  name,
  color,
  width = 160,
  className = "",
}: {
  name: string;
  color: "verde" | "lima" | "laranja" | "rosa" | "azul";
  width?: number;
  className?: string;
}) {
  return (
    <Image
      src={`/brand/stickers/${name}-${color}.webp`}
      alt=""
      aria-hidden
      width={width}
      height={width}
      className={`pointer-events-none h-auto select-none ${className}`}
      style={{ width }}
    />
  );
}
