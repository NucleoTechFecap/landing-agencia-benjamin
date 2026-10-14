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
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

import type { SocialLinks as SocialLinksData } from "@/lib/domain/content/types";

const ICONS: Record<keyof SocialLinksData, { label: string; path: string }> = {
  instagram: {
    label: "Instagram",
    path: "M12 2.2c3.2 0 3.6 0 4.8.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 3.2-1.7 4.8-4.9 4.9-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-3.3-.1-4.8-1.7-4.9-4.9C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8C2.4 3.9 3.9 2.4 7.2 2.3 8.4 2.2 8.8 2.2 12 2.2Zm0 4.6a5.2 5.2 0 1 0 0 10.4 5.2 5.2 0 0 0 0-10.4Zm0 8.6a3.4 3.4 0 1 1 0-6.8 3.4 3.4 0 0 1 0 6.8Zm5.4-9.9a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z",
  },
  tiktok: {
    label: "TikTok",
    path: "M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4a4.3 4.3 0 0 1-3.2-1.6Z",
  },
  linkedin: {
    label: "LinkedIn",
    path: "M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.4 4.3 5.5v6.3ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Zm1.8 13.1H3.5V9h3.6v11.5Z",
  },
};

/** Links oficiais de Instagram, TikTok e LinkedIn (PRJ §16), abrindo em nova aba. */
export function SocialLinks({ socials, className = "" }: { socials: SocialLinksData; className?: string }) {
  const entries = (Object.keys(ICONS) as (keyof SocialLinksData)[]).filter((key) => socials[key]);
  return (
    <ul className={`flex items-center gap-3 ${className}`}>
      {entries.map((key) => (
        <li key={key}>
          <a
            href={socials[key]}
            target="_blank"
            rel="noopener noreferrer me"
            className="flex size-11 items-center justify-center rounded-full border-2 border-current transition hover:bg-benja-lima hover:text-benja-verde"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="size-5 fill-current">
              <path d={ICONS[key].path} />
            </svg>
            <span className="sr-only">{ICONS[key].label} da Agência Benjamin (abre em nova aba)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
