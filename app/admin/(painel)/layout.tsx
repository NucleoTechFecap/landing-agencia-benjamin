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
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { PanelShell } from "@/components/admin/panel-shell";
import { MENU_COLLAPSED, MENU_COOKIE, navigationFor } from "@/lib/config/admin-modules";
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
    <Suspense fallback={<ShellFallback />}>
      <PanelGate>{children}</PanelGate>
    </Suspense>
  );
}

/** Mesma geometria da casca, para a chegada da sessão não mudar a tela de lugar. */
function ShellFallback() {
  return (
    <div className="flex min-h-dvh bg-studio-papel">
      <div aria-hidden className="hidden w-studio-menu shrink-0 bg-benja-verde lg:block" />
      <p role="status" className="p-8 text-sm font-bold text-benja-verde">
        Carregando painel…
      </p>
    </div>
  );
}

async function PanelGate({ children }: { children: ReactNode }) {
  // Sessão só existe na requisição: o pré-render para aqui (ver requirePageAccess).
  await connection();
  const user = await getSessionUser();
  if (!user) redirect("/admin/login?erro=sessao");
  // Conta sem papel liberado nunca vê a casca do painel (RBAC N03).
  if (user.role === "pending") redirect(PENDING_ACCESS_PATH);
  const collapsed = (await cookies()).get(MENU_COOKIE)?.value === MENU_COLLAPSED;

  return (
    <PanelShell
      navigation={navigationFor(user.role)}
      user={{ name: user.name, roleLabel: ROLE_LABELS[user.role] }}
      signOut={signOut}
      initialCollapsed={collapsed}
    >
      {children}
    </PanelShell>
  );
}
