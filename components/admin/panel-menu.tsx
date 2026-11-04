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
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ADMIN_HOME_PATH, isActiveModule, type AdminModule } from "@/lib/config/admin-modules";

const link = "flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-semibold wrap-anywhere transition";

/**
 * Lista de módulos que o servidor já filtrou pelo papel. No celular é um painel que abre abaixo do
 * botão, no fluxo da página: não cobre o conteúdo e o foco segue a ordem natural (padrão de divulgação).
 * Fecha com Esc, devolvendo o foco ao botão, e ao escolher um módulo. O menu fica no layout e não
 * desmonta ao navegar, então precisa fechar sozinho.
 *
 * Sem prefetch: todas as telas do painel dependem da requisição, então não há o que adiantar, e cada
 * prefetch passaria pelo proxy, que valida a sessão no Supabase Auth (eram 14 chamadas a cada página).
 */
export function PanelMenu({ modules }: { modules: readonly AdminModule[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const navId = useId();

  // Fecha ao trocar de rota (ajuste de estado durante a renderização, sem efeito).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const item = (href: string, name: string) => {
    const active = isActiveModule(pathname, href);
    return (
      <Link
        href={href}
        prefetch={false}
        aria-current={active ? "page" : undefined}
        onClick={close}
        className={`${link} ${active ? "bg-benja-claro font-bold text-benja-verde" : "hover:bg-benja-creme"}`}
      >
        {name}
      </Link>
    );
  };

  return (
    <div className="border-b-2 border-benja-noite/10 bg-white lg:border-r-2 lg:border-b-0">
      <div className="lg:sticky lg:top-0 lg:max-h-dvh lg:overflow-y-auto">
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls={navId}
          onClick={() => setOpen((current) => !current)}
          className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-2 text-sm font-bold text-benja-verde focus-visible:outline-offset-[-4px]! lg:hidden"
        >
          {open ? "Fechar menu" : "Abrir menu"}
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="size-6 stroke-current"
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
          >
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
        <nav id={navId} aria-label="Módulos do painel" className={`${open ? "block" : "hidden"} p-2 lg:block lg:p-3`}>
          <ul className="space-y-1">
            <li>{item(ADMIN_HOME_PATH, "Início")}</li>
            {modules.map((module) => (
              <li key={module.name}>
                {module.href ? (
                  item(module.href, module.name)
                ) : (
                  <p className="flex min-h-11 flex-col justify-center px-3 py-2 text-sm text-benja-grafite/70">
                    {module.name}
                    <span className="text-xs font-bold">Em construção</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
