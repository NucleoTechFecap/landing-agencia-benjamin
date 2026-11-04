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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Navegação principal (desktop) com indicação da página atual. Com as animações ligadas, um único
 * destaque desliza entre os itens; sem elas, cada link pinta o próprio fundo.
 */
export function NavLinks({
  items,
  ctaHref,
}: {
  items: readonly { label: string; href: string }[];
  /** O destino do botão do cabeçalho já tem o botão: não repete como link. */
  ctaHref: string;
}) {
  const pathname = usePathname();
  return (
    <div data-nav className="relative hidden lg:block">
      <span
        aria-hidden
        data-nav-pill
        className="pointer-events-none absolute top-0 left-0 rounded-full bg-benja-claro opacity-0 motion-off:hidden"
      />
      <ul data-motion="chrome" className="relative flex items-center gap-1">
        {items
          .filter((item) => item.href !== ctaHref)
          .map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`block rounded-full px-4 py-2 text-sm font-semibold motion-off:transition motion-off:hover:bg-benja-claro ${
                    active ? "text-benja-verde motion-off:bg-benja-claro" : ""
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
      </ul>
    </div>
  );
}
