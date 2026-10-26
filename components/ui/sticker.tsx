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
 Modificado em: 25/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 25/10/2026 Caio Moraes              Caixa quadrada com âncora topo/base, sem aviso do Image (LAY-06).
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";

/**
 * Sticker da identidade (public/brand/stickers), sempre decorativo. Os stickers não são quadrados:
 * a caixa é fixa (width × width) e a imagem se encaixa com object-contain, o que evita o aviso do
 * next/image de "width or height modified". `anchor` alinha a imagem à borda em que o sticker está
 * posicionado (topo ou base), para ele não mudar de lugar dentro da caixa (LAY-06).
 */
export function Sticker({
  name,
  color,
  width = 160,
  anchor = "top",
  className = "",
}: {
  name: string;
  color: "verde" | "lima" | "laranja" | "rosa" | "azul";
  width?: number;
  anchor?: "top" | "bottom";
  className?: string;
}) {
  return (
    <Image
      src={`/brand/stickers/${name}-${color}.webp`}
      alt=""
      aria-hidden
      width={width}
      height={width}
      className={`pointer-events-none object-contain select-none ${anchor === "bottom" ? "object-bottom" : "object-top"} ${className}`}
      style={{ width, height: width }}
    />
  );
}
