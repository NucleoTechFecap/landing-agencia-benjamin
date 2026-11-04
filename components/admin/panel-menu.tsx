/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : panel-menu.tsx
 Descrição    : Menu dos módulos do painel: barra lateral no desktop, abrir e fechar no celular.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-04).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type FocusEvent, type MouseEvent } from "react";
import { isActiveModule, type AdminNavigationGroup } from "@/lib/config/admin-modules";
import { StudioIcon } from "./ui/icons";

interface Tip {
  text: string;
  top: number;
  left: number;
}

/**
 * Menu do painel, com os grupos que o servidor já filtrou pelo papel. Recolhido, cada item vira só o
 * ícone: o nome continua no link, para leitores de tela, e aparece em dica ao passar o mouse ou focar.
 * A dica é posicionada na janela porque a coluna do menu tem rolagem própria e cortaria o que passa da borda.
 *
 * Sem prefetch: todas as telas do painel dependem da requisição, então não há o que adiantar, e cada
 * prefetch passaria pelo proxy, que valida a sessão no Supabase Auth (eram 14 chamadas a cada página).
 */
export function PanelMenu({
  navigation,
  collapsed = false,
  onNavigate,
}: {
  navigation: readonly AdminNavigationGroup[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [tip, setTip] = useState<Tip | null>(null);

  const showTip = (event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>, text: string) => {
    // Na gaveta do celular o menu aparece sempre inteiro, mesmo com a preferência de recolhido.
    if (!collapsed || !window.matchMedia("(min-width: 64rem)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    setTip({ text, top: box.top + box.height / 2, left: box.right + 12 });
  };

  return (
    <nav aria-label="Módulos do painel" className="min-h-0 flex-1 overflow-y-auto px-3 py-2 [scrollbar-width:thin]">
      {navigation.map((group) => (
        <div key={group.id} className="mb-5 last:mb-2">
          <p
            className={`mb-1.5 px-3 text-[0.6875rem] font-bold tracking-[0.12em] text-benja-claro uppercase ${collapsed ? "lg:sr-only" : ""}`}
          >
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.modules.map((module) => {
              const active = isActiveModule(pathname, module.href!);
              return (
                <li key={module.name}>
                  <Link
                    href={module.href!}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    onClick={() => {
                      setTip(null);
                      onNavigate?.();
                    }}
                    onMouseEnter={(event) => showTip(event, module.name)}
                    onMouseLeave={() => setTip(null)}
                    onFocus={(event) => showTip(event, module.name)}
                    onBlur={() => setTip(null)}
                    className={`flex min-h-11 items-center gap-3 rounded-studio-md px-3 py-2 text-sm leading-snug font-semibold transition duration-150 ease-studio focus-visible:outline-benja-nyanza! ${
                      collapsed ? "lg:justify-center" : ""
                    } ${
                      active
                        ? "bg-benja-nyanza font-bold text-benja-verde shadow-studio-pop-lima"
                        : "text-benja-nyanza hover:bg-white/10"
                    }`}
                  >
                    <StudioIcon name={module.icon} />
                    <span className={`min-w-0 wrap-anywhere ${collapsed ? "lg:sr-only" : ""}`}>{module.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {tip ? (
        <span
          role="tooltip"
          style={{ top: tip.top, left: tip.left }}
          className="pointer-events-none fixed z-60 max-w-56 -translate-y-1/2 rounded-studio-sm bg-benja-noite px-3 py-1.5 text-xs font-semibold text-white shadow-studio-flutuante"
        >
          {tip.text}
        </span>
      ) : null}
    </nav>
  );
}
