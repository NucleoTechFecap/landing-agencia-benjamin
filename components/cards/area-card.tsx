/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : area-card.tsx
 Descrição    : Card compacto de área de atuação.

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

import Link from "next/link";
import type { Area } from "@/lib/domain/content/types";
import { BrandIcon, type BrandIconColor } from "../ui/brand-icon";

/** Card compacto de área de atuação (Home e Sobre). */
export function AreaCard({ area, color = "verde" }: { area: Area; color?: BrandIconColor }) {
  return (
    <Link
      href={`/areas#${area.slug}`}
      className="flex h-full items-start gap-4 rounded-3xl border-2 border-benja-noite bg-benja-nyanza p-5 text-benja-noite shadow-sticker transition hover:-translate-y-1"
    >
      <BrandIcon name={area.icon ?? "estrela"} color={color} size={52} className="shrink-0" />
      <span>
        <span className="block text-lg font-black text-benja-verde">{area.name}</span>
        <span className="mt-1 block text-sm leading-relaxed text-benja-grafite">{area.summary}</span>
      </span>
    </Link>
  );
}
