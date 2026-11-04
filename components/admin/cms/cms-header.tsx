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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import type { ReactNode } from "react";
import { StudioIcon } from "../ui/icons";

/**
 * Título da tela e ações dela. A trilha fica no cabeçalho da casca (PanelShell). `description` diz, em
 * uma frase, para que serve a tela: quem usa o painel não precisa conhecer a estrutura do site.
 */
export function CmsHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 lg:mb-8">
      <div className="min-w-0 flex-1 basis-80">
        <h1 className="text-3xl leading-tight font-black wrap-anywhere text-benja-verde lg:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-studio-suave">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
    </header>
  );
}

/** Ação principal da tela (ex.: "Nova área"). */
export function CmsLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} prefetch={false} className="studio-btn studio-btn-primario">
      <StudioIcon name="mais" size={18} />
      {children}
    </Link>
  );
}

/** Ação secundária da tela (ex.: "Categorias"). */
export function CmsSecondaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} prefetch={false} className="studio-btn studio-btn-secundario">
      {children}
    </Link>
  );
}
