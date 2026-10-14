/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : layout.tsx
 Descrição    : Casca do painel com verificação de sessão e saída.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-02).
 13/10/2026 Vinícius Nishimura Reis  Bloqueio de contas pendentes (ADM-03).
──────────────────────────────────────────────────────────────────────────────
*/

import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
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
    <Suspense fallback={<p className="p-8 text-sm">Carregando painel…</p>}>
      <PanelGate>{children}</PanelGate>
    </Suspense>
  );
}

async function PanelGate({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login?erro=sessao");
  // Conta sem papel liberado nunca vê a casca do painel (RBAC N03).
  if (user.role === "pending") redirect(PENDING_ACCESS_PATH);

  return (
    <div className="min-h-dvh">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#004a1b] bg-[#004a1b] px-6 py-4 text-[#f1fcd0]">
        <p className="text-lg font-black">Painel · Agência Benjamin</p>
        <div className="flex items-center gap-4 text-sm">
          <span>
            {user.name} · <strong>{ROLE_LABELS[user.role]}</strong>
          </span>
          <form action={signOut}>
            <button type="submit" className="rounded-full border-2 border-[#f1fcd0] px-4 py-1.5 font-semibold hover:bg-[#f1fcd0] hover:text-[#004a1b]">
              Sair
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </div>
  );
}
