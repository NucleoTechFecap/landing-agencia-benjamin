/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : nav-links.tsx
 Descrição    : Navegação principal (desktop) com indicação da página atual.

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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAVIGATION } from "@/lib/config/navigation";

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Navegação principal (desktop) com indicação da página atual. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="hidden items-center gap-1 lg:flex">
      {MAIN_NAVIGATION.filter((item) => item.href !== "/contato").map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition hover:bg-benja-claro ${
                active ? "bg-benja-claro text-benja-verde" : ""
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
