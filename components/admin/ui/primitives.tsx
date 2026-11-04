/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : primitives.tsx
 Descrição    : Componentes básicos do painel: avatar, aviso, painel, seção, estado vazio e indicador.

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

import Link from "next/link";
import type { ReactNode } from "react";
import { StudioIcon, type StudioIconName } from "./icons";

/** Iniciais de quem está logado, sem depender de foto. Nome vazio não quebra o avatar. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0]!.charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : "";
  return `${first}${last}`.toLocaleUpperCase("pt-BR");
}

export function Avatar({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-benja-lima text-sm font-extrabold text-benja-noite ${className}`}
    >
      {initialsOf(name)}
    </span>
  );
}

const NOTICE_TONES = {
  sucesso: { box: "border-benja-verde bg-benja-sucesso-fundo text-benja-verde", icon: "sucesso" },
  atencao: { box: "border-benja-laranja bg-white text-benja-noite", icon: "alerta" },
  erro: { box: "border-benja-erro bg-benja-erro-fundo text-benja-erro-texto", icon: "erro" },
  info: { box: "border-studio-linha bg-studio-realce text-benja-noite", icon: "info" },
} as const satisfies Record<string, { box: string; icon: StudioIconName }>;

/** Mensagem em linha. O tom vem também no ícone e no texto, nunca só na cor. */
export function Notice({
  tone,
  children,
  role,
  className = "",
}: {
  tone: keyof typeof NOTICE_TONES;
  children: ReactNode;
  role?: "alert" | "status";
  className?: string;
}) {
  const { box, icon } = NOTICE_TONES[tone];
  return (
    <div
      role={role}
      className={`flex items-start gap-3 rounded-studio-md border px-4 py-3 text-sm leading-relaxed ${box} ${className}`}
    >
      <StudioIcon name={icon} className="mt-0.5" />
      <div className="min-w-0 flex-1 wrap-anywhere">{children}</div>
    </div>
  );
}

/** Bloco de conteúdo com título: a unidade de composição das telas do painel. */
export function StudioPanel({
  id,
  title,
  description,
  actions,
  children,
  className = "",
}: {
  /** Liga o título à seção para leitores de tela. */
  id: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={`studio-card min-w-0 p-5 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h2 id={id} className="studio-titulo-secao">
            {title}
          </h2>
          {description ? <p className="mt-1 max-w-2xl text-sm text-studio-suave">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Grupo de campos de um formulário longo. A separação vem do fio, sem um cartão dentro do outro. */
export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 border-t border-studio-linha pt-6 first:border-t-0 first:pt-0">
      <div>
        <h2 className="studio-titulo-secao">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-sm text-studio-suave">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Lista sem itens: diz o que houve e, quando existe, oferece o próximo passo. */
export function EmptyPanel({
  title,
  children,
  action,
}: {
  title?: string;
  children?: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="studio-reticula rounded-studio-lg border border-dashed border-studio-controle bg-studio-papel px-6 py-10 text-center">
      {title ? <p className="font-extrabold text-benja-verde">{title}</p> : null}
      {children ? <div className="mx-auto mt-1 max-w-xl text-sm text-studio-suave">{children}</div> : null}
      {action ? (
        <Link href={action.href} prefetch={false} className="studio-btn studio-btn-secundario mt-4">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

/** Indicador do início: número real, com link para a lista de onde ele vem. */
export function StatCard({
  label,
  value,
  hint,
  href,
  highlight,
}: {
  label: string;
  value: number;
  hint?: string;
  href: string;
  /** Pede atenção: há algo a fazer. */
  highlight?: boolean;
}) {
  return (
    <li className="studio-card studio-card-ativo relative flex min-h-32 flex-col justify-between gap-3 p-4">
      <Link
        href={href}
        prefetch={false}
        className="studio-rotulo underline-offset-4 focus-visible:outline-current! after:absolute after:inset-0 hover:underline"
      >
        {label}
      </Link>
      <div>
        <p
          className={`text-4xl leading-none font-black tracking-tight tabular-nums ${highlight ? "text-benja-laranja-texto" : "text-benja-verde"}`}
        >
          {value}
        </p>
        {hint ? <p className="mt-2 text-xs leading-snug text-studio-suave">{hint}</p> : null}
      </div>
    </li>
  );
}

/** Espaço reservado enquanto os dados chegam, para o conteúdo não empurrar a página. */
export function SkeletonBlocks({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-studio-lg bg-studio-realce" />
      ))}
    </div>
  );
}
