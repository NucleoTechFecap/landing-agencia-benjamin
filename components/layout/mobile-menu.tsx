/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : mobile-menu.tsx
 Descrição    : Menu mobile acessível (teclado, Esc, foco e clique fora).

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
 25/10/2026 Caio Moraes              Fecha o menu quando o foco sai dele (LAY-02).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { MAIN_NAVIGATION, SECONDARY_NAVIGATION } from "@/lib/config/navigation";
import { isActivePath } from "./nav-links";

/**
 * Menu mobile acessível: botão com aria-expanded/aria-controls, fecha com Esc, ao
 * navegar e ao clicar fora; devolve o foco ao botão ao fechar (LAY-02 / SEG-07).
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Fecha ao trocar de rota (ajuste de estado durante a renderização, sem efeito).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    // Fecha ao clicar fora ou quando o foco sai do menu pelo teclado (Tab após o último link) (LAY-02).
    const closeIfOutside = (event: Event) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", closeIfOutside);
    document.addEventListener("focusin", closeIfOutside);
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", closeIfOutside);
      document.removeEventListener("focusin", closeIfOutside);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex size-11 items-center justify-center rounded-full border-2 border-benja-noite bg-benja-nyanza shadow-sticker"
      >
        <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="size-6 stroke-benja-verde"
          fill="none"
          strokeWidth={2.5}
          strokeLinecap="round"
        >
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      <div
        id={panelId}
        ref={panelRef}
        hidden={!open}
        className="absolute inset-x-4 top-[calc(100%+0.5rem)] rounded-3xl border-2 border-benja-noite bg-benja-nyanza p-4 shadow-sticker-lg"
      >
        <nav aria-label="Menu principal">
          <ul className="flex flex-col">
            {MAIN_NAVIGATION.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-2xl px-4 py-3 text-lg font-bold ${active ? "bg-benja-claro text-benja-verde" : ""}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ul className="mt-2 border-t-2 border-benja-verde/15 pt-2">
            {SECONDARY_NAVIGATION.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="block rounded-2xl px-4 py-2 text-sm font-semibold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
