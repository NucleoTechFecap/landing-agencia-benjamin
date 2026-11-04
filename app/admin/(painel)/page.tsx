/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Início do painel com os módulos previstos no MVP.

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
 13/10/2026 Vinícius Nishimura Reis  Guarda de página e menu filtrado pelo papel (ADM-03).
 26/10/2026 Vinícius Nishimura Reis  Link para o CMS de áreas (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Link para o CMS de serviços (ADM-06).
 26/10/2026 Vinícius Nishimura Reis  Links para cases e biblioteca de mídia (ADM-08).
 29/10/2026 Caio Moraes              Cores via tokens do tema (ADM-04).
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 04/11/2026 Vinícius Nishimura Reis  Módulos vêm do registro único, com o card inteiro clicável (ADM-04).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import {
  AttentionList,
  DashboardHero,
  InboxPanel,
  IndicatorsGrid,
  QuickActionsGrid,
  RecentList,
} from "@/components/admin/dashboard";
import { Notice, SkeletonBlocks } from "@/components/admin/ui/primitives";
import type { Role } from "@/lib/domain/auth/rbac";
import { quickActions } from "@/lib/domain/content/dashboard";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadDashboard } from "@/lib/server/cms/dashboard";
import { logger } from "@/lib/server/logger";

export const metadata: Metadata = { title: "Início" };

/**
 * Início do painel. A abertura não depende do banco: os dados vêm em seguida, e uma falha de leitura
 * vira aviso aqui mesmo, com os atalhos de pé. Quem entra em /admin não fica sem caminho para seguir.
 */
export default async function AdminHomePage() {
  const user = await requirePageAccess("dashboard", "view", "/admin");
  return (
    <div className="space-y-8">
      <DashboardHero name={user.name} />
      <Suspense
        fallback={
          <div role="status" aria-label="Carregando os dados do início">
            <SkeletonBlocks count={6} className="sm:grid-cols-2 xl:grid-cols-3" />
          </div>
        }
      >
        <DashboardContent role={user.role} />
      </Suspense>
    </div>
  );
}

async function DashboardContent({ role }: { role: Role }) {
  let data;
  try {
    data = await loadDashboard(role, new Date());
  } catch (error) {
    unstable_rethrow(error);
    logger.error("cms.dashboard.unavailable", { error });
    return (
      <div className="space-y-8">
        <Notice tone="erro" role="alert">
          <strong>Não foi possível carregar os números agora.</strong> Nada foi perdido. Atualize a página em instantes;
          se persistir, avise o NúcleoTech.
        </Notice>
        <QuickActionsGrid actions={quickActions(role, "/admin/paginas")} />
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <QuickActionsGrid actions={data.actions} />
      <IndicatorsGrid indicators={data.indicators} />
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <RecentList items={data.recent} />
        <div className="min-w-0 space-y-6">
          <InboxPanel indicators={data.inbox} />
          <AttentionList items={data.review} total={data.reviewTotal} />
        </div>
      </div>
    </div>
  );
}
