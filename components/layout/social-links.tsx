/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : social-links.tsx
 Descrição    : Links das redes sociais oficiais com ícones acessíveis.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 02/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 01/11/2026 Vinícius Nishimura Reis  Endereço sem mapa e redes vazias no rodapé (LAY-03).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
──────────────────────────────────────────────────────────────────────────────
*/

import Image from "next/image";
import type { SocialLinks as SocialLinksData } from "@/lib/domain/content/types";

const LABELS: Record<keyof SocialLinksData, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
};

/** Links oficiais de Instagram, TikTok e LinkedIn (PRJ §16), abrindo em nova aba. */
export function SocialLinks({ socials, className = "" }: { socials: SocialLinksData; className?: string }) {
  const entries = (Object.keys(LABELS) as (keyof SocialLinksData)[]).filter((key) => socials[key]);
  if (!entries.length) return null;
  return (
    <ul className={`flex items-center gap-3 ${className}`}>
      {entries.map((key) => (
        <li key={key}>
          <a
            href={socials[key]}
            target="_blank"
            rel="noopener noreferrer me"
            className="flex size-11 items-center justify-center rounded-full border-2 border-current transition hover:bg-benja-lima"
          >
            <Image
              src={`/brand/social/${key}.svg`}
              alt=""
              aria-hidden
              width={28}
              height={28}
              unoptimized
              className="object-contain select-none"
              style={{ width: 28, height: 28 }}
            />
            <span className="sr-only">{LABELS[key]} da Agência Benjamin (abre em nova aba)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
