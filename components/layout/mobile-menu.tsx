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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
 25/10/2026 Caio Moraes              Fecha o menu quando o foco sai dele (LAY-02).
 02/11/2026 Vinícius Nishimura Reis  Marca em vetor, animações GSAP e remoção do selo provisório.
 04/11/2026 Vinícius Nishimura Reis  Menu rola por dentro em tela baixa: no celular deitado, o fim ficava inalcançável (QA-03).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { MAIN_NAVIGATION, SECONDARY_NAVIGATION } from "@/lib/config/navigation";
import { isActivePath } from "./nav-links";

type MenuMotion = typeof import("@/components/motion/menu");

let menuMotion: MenuMotion | null = null;

/** As animações do menu só valem com o motor ligado; sem ele, abre e fecha na hora. */
const activeMenuMotion = () => (document.documentElement.classList.contains("motion") ? menuMotion : null);

/**
 * Menu mobile acessível: botão com aria-expanded/aria-controls, fecha com Esc, ao
 * navegar e ao clicar fora; devolve o foco ao botão ao fechar (LAY-02 / SEG-07).
 * Durante a animação de saída o painel fica `inert`: visível, mas sem receber foco nem cliques.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Fecha ao trocar de rota (ajuste de estado durante a renderização, sem efeito).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
    setVisible(false);
  }

  const close = useCallback(() => {
    setOpen(false);
    const panel = panelRef.current;
    const motion = activeMenuMotion();
    if (panel && motion) motion.closeMenu(panel, () => setVisible(false));
    else setVisible(false);
  }, []);

  useEffect(() => {
    if (!document.documentElement.classList.contains("motion")) return;
    import("@/components/motion/menu")
      .then((module) => {
        menuMotion = module;
      })
      .catch(() => undefined);
  }, []);

  useLayoutEffect(() => {
    if (open && panelRef.current) activeMenuMotion()?.openMenu(panelRef.current);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    // Fecha ao clicar fora ou quando o foco sai do menu pelo teclado (Tab após o último link) (LAY-02).
    const closeIfOutside = (event: Event) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
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
  }, [open, close]);

  return (
    <div data-motion="chrome" className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
            setVisible(true);
          }
        }}
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
          <path
            d="M4 7h16"
            className={`origin-center transition-transform duration-300 ${open ? "[transform:rotate(45deg)_translateY(5px)]" : ""}`}
          />
          <path d="M4 12h16" className={`transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
          <path
            d="M4 17h16"
            className={`origin-center transition-transform duration-300 ${open ? "[transform:rotate(-45deg)_translateY(-5px)]" : ""}`}
          />
        </svg>
      </button>
      <div
        id={panelId}
        ref={panelRef}
        hidden={!visible}
        inert={!open}
        className="absolute inset-x-4 top-[calc(100%+0.5rem)] max-h-[calc(100dvh-6.5rem)] overflow-y-auto overscroll-contain rounded-3xl border-2 border-benja-noite bg-benja-nyanza p-4 shadow-sticker-lg"
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
