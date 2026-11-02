/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : states.tsx
 Descrição    : Estados compartilhados de carregamento, lista vazia e erro.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import type { ReactNode } from "react";
import { BrandIcon } from "./brand-icon";
import { ButtonLink, buttonClasses } from "./button-link";
import { Section } from "./section";

/*
 * Estados de carregamento, vazio e erro (LAY-07). Usam `currentColor`, então funcionam em
 * qualquer tom de seção. Fica de fora um `loading.tsx` de rota: a resposta passaria a começar com
 * status 200 antes de a página existir, e /cases/<slug-inexistente> deixaria de responder 404.
 */

/** Espera curta dentro da página (fallback de Suspense). O texto é anunciado por leitor de tela. */
export function LoadingState({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div role="status" className={`flex items-center gap-3 font-bold ${className}`}>
      <span
        aria-hidden
        className="size-5 shrink-0 animate-spin rounded-full border-[3px] border-current border-t-transparent"
      />
      {label}
    </div>
  );
}

/** Espaço reservado da grade de cards, para o conteúdo não empurrar a página ao chegar. */
export function CardsSkeleton({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <ul aria-hidden className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className="h-72 animate-pulse rounded-3xl border-2 border-current/15 bg-current/5" />
      ))}
    </ul>
  );
}

/** Lista sem itens: explica o que houve e, quando existe, oferece o próximo passo. */
export function EmptyState({
  children,
  action,
  className = "",
}: {
  children: ReactNode;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border-2 border-dashed border-current/50 p-8 text-center ${className}`}>
      <p>{children}</p>
      {action ? (
        <Link href={action.href} className="mt-3 inline-block font-bold underline underline-offset-4">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

/** Erro inesperado: mensagem amigável, código para atendimento e os caminhos de saída (ARC-09). */
export function ErrorState({
  error,
  retry,
  description,
  home = { href: "/", label: "Ir para o início" },
}: {
  error: Error & { digest?: string };
  retry: () => void;
  description: string;
  home?: { href: string; label: string };
}) {
  return (
    <Section tone="rosa" containerClassName="flex flex-col items-center text-center">
      <BrandIcon name="xicara" color="verde" size={110} />
      <h1 className="mt-6 text-balance text-4xl font-black">Algo deu errado por aqui.</h1>
      <p className="mt-3 max-w-lg text-lg">{description}</p>
      {error.digest ? (
        <p className="mt-2 text-sm">
          Código de atendimento: <code className="font-mono font-bold">{error.digest}</code>
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => retry()} className={buttonClasses("primary")}>
          Tentar novamente
        </button>
        <ButtonLink href={home.href} variant="secondary">
          {home.label}
        </ButtonLink>
      </div>
    </Section>
  );
}
