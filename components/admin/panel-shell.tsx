/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : panel-shell.tsx
 Descrição    : Casca do painel: menu lateral recolhível, gaveta no celular, cabeçalho e perfil.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (reestruturação do painel).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SkipLink } from "@/components/layout/skip-link";
import {
  ADMIN_HOME_PATH,
  MENU_COLLAPSED,
  MENU_COOKIE,
  breadcrumbsFor,
  type AdminNavigationGroup,
} from "@/lib/config/admin-modules";
import { PanelMenu } from "./panel-menu";
import { StudioIcon } from "./ui/icons";
import { Avatar } from "./ui/primitives";

function rememberCollapsed(collapsed: boolean) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${MENU_COOKIE}=${collapsed ? MENU_COLLAPSED : "aberto"}; Path=/admin; Max-Age=31536000; SameSite=Lax${secure}`;
}

function PanelBreadcrumbs() {
  const crumbs = breadcrumbsFor(usePathname());
  return (
    <nav aria-label="Trilha" className="min-w-0 text-sm">
      <ol className="flex min-w-0 items-center gap-1.5">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            // No celular, só o último passo: a trilha inteira não cabe ao lado dos botões.
            <li key={crumb.label} className={`flex min-w-0 items-center gap-1.5 ${last ? "" : "max-sm:hidden"}`}>
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  prefetch={false}
                  className="inline-flex min-h-6 items-center whitespace-nowrap text-studio-suave underline-offset-4 hover:text-benja-verde hover:underline"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate font-bold text-benja-verde">
                  {crumb.label}
                </span>
              )}
              {last ? null : (
                <span aria-hidden className="text-studio-suave">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SignOutButton({ signOut, compact }: { signOut: () => Promise<void>; compact?: boolean }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={`flex min-h-11 w-full items-center gap-3 rounded-studio-md px-3 py-2 text-sm font-semibold text-benja-nyanza transition duration-150 ease-studio hover:bg-white/10 focus-visible:outline-benja-nyanza! ${
          compact ? "lg:justify-center" : ""
        }`}
      >
        <StudioIcon name="sair" />
        <span className={compact ? "lg:sr-only" : ""}>Sair</span>
      </button>
    </form>
  );
}

/** Perfil no cabeçalho, só abaixo de `lg`: nas telas grandes, o rodapé do menu já mostra tudo isto. */
function UserMenu({ name, roleLabel, signOut }: { name: string; roleLabel: string; signOut: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-label="Abrir perfil"
        onClick={() => setOpen((current) => !current)}
        className="flex size-11 items-center justify-center rounded-full"
      >
        <Avatar name={name} />
      </button>
      {open ? (
        <div className="absolute top-full right-0 z-40 mt-2 w-64 animate-studio-entrada rounded-studio-lg bg-benja-verde p-3 text-benja-nyanza shadow-studio-flutuante">
          <p className="px-3 pt-1 text-sm font-bold wrap-anywhere">{name}</p>
          <p className="px-3 pb-2 text-xs wrap-anywhere text-benja-claro">{roleLabel}</p>
          <SignOutButton signOut={signOut} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Casca do painel: menu lateral, cabeçalho e área de conteúdo. O menu é uma coluna fixa nas telas grandes,
 * recolhível, e uma gaveta no celular. Com a gaveta aberta, o resto da tela fica `inert`: o foco não sai
 * dela, e Esc ou a escolha de um módulo a fecham. O conteúdo chega do servidor por `children`.
 */
export function PanelShell({
  navigation,
  user,
  signOut,
  initialCollapsed,
  children,
}: {
  navigation: readonly AdminNavigationGroup[];
  user: { name: string; roleLabel: string };
  signOut: () => Promise<void>;
  initialCollapsed: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [lastPathname, setLastPathname] = useState(pathname);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);

  // A gaveta fica no layout e não desmonta ao navegar: fecha ao trocar de rota (ajuste durante a renderização).
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    closeButtonRef.current?.focus();
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      returnFocus.current = true;
      setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      root.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  // Depois de a gaveta fechar: enquanto ela está aberta, o botão de abrir fica em área `inert` e não recebe foco.
  useEffect(() => {
    if (drawerOpen || !returnFocus.current) return;
    returnFocus.current = false;
    menuButtonRef.current?.focus();
  }, [drawerOpen]);

  const closeDrawer = () => {
    returnFocus.current = true;
    setDrawerOpen(false);
  };

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      rememberCollapsed(!current);
      return !current;
    });
  };

  // Recolher é só das telas grandes: as classes abaixo usam `lg:`, e na gaveta o menu aparece inteiro.
  const compact = collapsed;

  return (
    <div className="studio min-h-dvh bg-studio-papel text-benja-noite">
      <SkipLink />
      {drawerOpen ? (
        <div
          aria-hidden
          onClick={closeDrawer}
          className="fixed inset-0 z-40 animate-studio-entrada bg-[rgb(0_40_14/0.55)] lg:hidden"
        />
      ) : null}
      <div className="flex min-h-dvh">
        <aside
          // `visibility` muda na hora ao abrir, senão o botão de fechar ainda não recebe o foco; ao fechar, só
          // depois de a gaveta sair da tela. Nas telas grandes, a única transição é a da largura.
          className={`fixed inset-y-0 left-0 z-50 w-[min(19rem,86vw)] bg-benja-verde text-benja-nyanza lg:visible lg:relative lg:translate-x-0 lg:shrink-0 lg:[transition:width_200ms_var(--ease-studio)] ${
            drawerOpen
              ? "visible translate-x-0 [transition:translate_200ms_var(--ease-studio)]"
              : "invisible -translate-x-full [transition:translate_200ms_var(--ease-studio),visibility_0s_linear_200ms]"
          } ${compact ? "lg:w-studio-menu-recolhido" : "lg:w-studio-menu"}`}
        >
          <div className="flex h-dvh flex-col lg:sticky lg:top-0">
            <div
              className={`flex items-center justify-between gap-2 px-4 pt-4 pb-3 ${compact ? "lg:justify-center lg:px-2" : ""}`}
            >
              <Link
                href={ADMIN_HOME_PATH}
                prefetch={false}
                aria-label="Painel · Agência Benjamin"
                className="flex min-h-11 min-w-0 items-center gap-3 rounded-studio-sm focus-visible:outline-benja-nyanza!"
              >
                <Image
                  src="/brand/logos/simbolo.svg"
                  alt=""
                  width={44}
                  height={44}
                  unoptimized
                  className={`hidden size-11 object-contain ${compact ? "lg:block" : ""}`}
                />
                <Image
                  src="/brand/logos/logo-horizontal.svg"
                  alt=""
                  width={120}
                  height={78}
                  unoptimized
                  priority
                  className={`h-auto w-24 lg:w-28 ${compact ? "lg:hidden" : ""}`}
                />
                <span
                  className={`min-w-0 text-[0.625rem] leading-tight font-bold tracking-[0.08em] text-benja-claro uppercase ${compact ? "lg:sr-only" : ""}`}
                >
                  Painel administrativo
                </span>
              </Link>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeDrawer}
                aria-label="Fechar menu"
                className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-benja-nyanza! lg:hidden"
              >
                <StudioIcon name="fechar" />
              </button>
            </div>

            <PanelMenu navigation={navigation} collapsed={compact} onNavigate={() => setDrawerOpen(false)} />

            <div className="space-y-1 border-t border-white/15 px-3 py-3">
              <div className={`flex items-center gap-3 px-1 py-1 ${compact ? "lg:justify-center" : ""}`}>
                <Avatar name={user.name} />
                <div className={`min-w-0 ${compact ? "lg:sr-only" : ""}`}>
                  <p className="text-sm leading-snug font-bold wrap-anywhere">{user.name}</p>
                  <p className="text-xs leading-snug wrap-anywhere text-benja-claro">{user.roleLabel}</p>
                </div>
              </div>
              <SignOutButton signOut={signOut} compact={compact} />
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-pressed={collapsed}
                className={`hidden min-h-11 w-full items-center gap-3 rounded-studio-md px-3 py-2 text-sm font-semibold text-benja-nyanza transition duration-150 ease-studio hover:bg-white/10 focus-visible:outline-benja-nyanza! lg:flex ${
                  compact ? "lg:justify-center" : ""
                }`}
              >
                <StudioIcon name={collapsed ? "expandir" : "recolher"} />
                <span className={compact ? "lg:sr-only" : ""}>{collapsed ? "Expandir menu" : "Recolher menu"}</span>
              </button>
            </div>
          </div>
        </aside>

        <div inert={drawerOpen} className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex min-h-studio-topo items-center justify-between gap-3 border-b border-studio-linha bg-studio-papel px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-expanded={drawerOpen}
                aria-label="Abrir menu"
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-benja-verde hover:bg-studio-realce lg:hidden"
              >
                <StudioIcon name="menu" size={24} />
              </button>
              <PanelBreadcrumbs />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/"
                target="_blank"
                prefetch={false}
                className="studio-btn studio-btn-secundario max-sm:size-11 max-sm:px-0"
              >
                <StudioIcon name="site" size={18} />
                <span className="max-sm:sr-only">Ver site</span>
                <span className="sr-only"> (abre em nova aba)</span>
              </Link>
              <UserMenu name={user.name} roleLabel={user.roleLabel} signOut={signOut} />
            </div>
          </header>
          <main
            id="conteudo"
            tabIndex={-1}
            className="min-w-0 flex-1 px-4 py-6 wrap-break-word outline-none! sm:px-6 lg:px-8 lg:py-8"
          >
            <div className="mx-auto max-w-studio-conteudo">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
