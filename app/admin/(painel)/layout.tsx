/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : layout.tsx
 Descrição    : Casca do painel com verificação de sessão, menu dos módulos e saída.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
 13/10/2026 Vinícius Nishimura Reis  Bloqueio de contas pendentes (ADM-03).
 26/10/2026 Vinícius Nishimura Reis  Páginas do painel só por requisição (connection) (ADM-07).
 29/10/2026 Caio Moraes              Cores via tokens do tema (ADM-04).
 01/11/2026 Vinícius Nishimura Reis  Estados globais de carregamento, vazio e erro (LAY-07).
 04/11/2026 Vinícius Nishimura Reis  Menu dos módulos e atalho para o conteúdo (ADM-04).
──────────────────────────────────────────────────────────────────────────────
*/

import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { PanelMenu } from "@/components/admin/panel-menu";
import { SkipLink } from "@/components/layout/skip-link";
import { LoadingState } from "@/components/ui/states";
import { ADMIN_HOME_PATH, modulesFor } from "@/lib/config/admin-modules";
import { ROLE_LABELS } from "@/lib/domain/auth/rbac";
import { PENDING_ACCESS_PATH } from "@/lib/server/auth/guards";
import { getSessionUser } from "@/lib/server/auth/session";
import { signOut } from "../actions";

/**
 * Casca do painel. A sessão é lida dentro de <Suspense> (Cache Components): o restante
 * da página não espera a autenticação para começar a ser enviado.
 */
export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<LoadingState label="Carregando painel…" className="p-8 text-sm" />}>
      <PanelGate>{children}</PanelGate>
    </Suspense>
  );
}

async function PanelGate({ children }: { children: ReactNode }) {
  // Sessão só existe na requisição: o pré-render para aqui (ver requirePageAccess).
  await connection();
  const user = await getSessionUser();
  if (!user) redirect("/admin/login?erro=sessao");
  // Conta sem papel liberado nunca vê a casca do painel (RBAC N03).
  if (user.role === "pending") redirect(PENDING_ACCESS_PATH);

  return (
    <div className="min-h-dvh">
      <SkipLink />
      {/* O contorno de foco padrão (azul) some sobre o verde do cabeçalho. */}
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b-2 border-benja-verde bg-benja-verde px-4 py-3 text-benja-nyanza sm:px-6">
        <Link
          href={ADMIN_HOME_PATH}
          prefetch={false}
          className="flex min-h-11 items-center text-lg font-black focus-visible:outline-benja-nyanza!"
        >
          Painel · Agência Benjamin
        </Link>
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <span className="min-w-0 wrap-anywhere">
            {user.name} · <strong>{ROLE_LABELS[user.role]}</strong>
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 rounded-full border-2 border-benja-nyanza px-4 py-1.5 font-semibold hover:bg-benja-nyanza hover:text-benja-verde focus-visible:outline-benja-nyanza!"
            >
              Sair
            </button>
          </form>
        </div>
      </header>
      <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <PanelMenu modules={modulesFor(user.role)} />
        <main id="conteudo" tabIndex={-1} className="min-w-0 px-4 py-8 wrap-break-word outline-none! sm:px-6 lg:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
