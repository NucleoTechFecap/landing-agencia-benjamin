/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : button-link.tsx
 Descrição    : Link com estilo de botão sticker (interno ou externo).

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

import Link from "next/link";
import type { ReactNode } from "react";

const VARIANTS = {
  primary: "bg-benja-verde text-benja-nyanza border-benja-noite hover:bg-benja-lima hover:text-benja-verde",
  secondary: "bg-benja-nyanza text-benja-verde border-benja-noite hover:bg-benja-claro",
  lima: "bg-benja-lima text-benja-verde border-benja-noite hover:bg-benja-nyanza",
  ghost: "bg-transparent text-current border-current shadow-none hover:bg-white/15",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

/** Link com aparência de botão "sticker" (borda grossa e sombra deslocada). */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  external = false,
  className = "",
  prefetch,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  external?: boolean;
  className?: string;
  prefetch?: boolean;
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full border-2 px-6 py-3 text-base font-bold shadow-sticker transition hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none ${VARIANTS[variant]} ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
        <span className="sr-only"> (abre em nova aba)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={classes} prefetch={prefetch}>
      {children}
    </Link>
  );
}
