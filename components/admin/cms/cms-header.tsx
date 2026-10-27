/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : cms-header.tsx
 Descrição    : Cabeçalho das telas do CMS com trilha de navegação e ações.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import type { ReactNode } from "react";

/** Título da tela do CMS com trilha (Painel › Seção › Item) e botões à direita. */
export function CmsHeader({
  title,
  trail,
  children,
}: {
  title: string;
  trail: { label: string; href?: string }[];
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <nav aria-label="Trilha" className="text-sm text-benja-grafite/80">
          <ol className="flex flex-wrap items-center gap-1.5">
            {[{ label: "Painel", href: "/admin" }, ...trail].map((step, index, steps) => (
              <li key={step.label} className="flex items-center gap-1.5">
                {step.href && index < steps.length - 1 ? (
                  <Link href={step.href} className="underline-offset-4 hover:underline">
                    {step.label}
                  </Link>
                ) : (
                  <span aria-current={index === steps.length - 1 ? "page" : undefined}>{step.label}</span>
                )}
                {index < steps.length - 1 ? <span aria-hidden>›</span> : null}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="mt-1 text-3xl font-black text-benja-verde">{title}</h1>
      </div>
      {children ? <div className="flex flex-wrap gap-3">{children}</div> : null}
    </header>
  );
}

/** Botão-link primário do painel (ex.: "Nova área"). */
export function CmsLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full bg-benja-verde px-5 py-2.5 text-sm font-bold text-benja-nyanza transition hover:bg-benja-noite focus-visible:ring-4 focus-visible:ring-benja-lima/40"
    >
      {children}
    </Link>
  );
}
