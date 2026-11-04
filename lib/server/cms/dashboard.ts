/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : dashboard.ts
 Descrição    : Leitura dos dados do início do painel, com a permissão aplicada no servidor.

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

import "server-only";
import { can, type Role } from "@/lib/domain/auth/rbac";
import {
  contentIndicators,
  quickActions,
  recentItems,
  type DashboardIndicator,
  type QuickAction,
} from "@/lib/domain/content/dashboard";
import type { OverviewItem } from "@/lib/domain/content/overview";
import { inboxHref, kindsAllowed } from "@/lib/domain/forms/inbox";
import { countNewSubmissions } from "../forms/inbox";
import { createSessionClient } from "../supabase/server";
import { cmsDeps } from "./context";
import { buildContentOverview } from "./overview";

export interface DashboardData {
  indicators: DashboardIndicator[];
  inbox: DashboardIndicator[];
  actions: QuickAction[];
  recent: OverviewItem[];
  /** Itens que pedem ação, com o total à parte: a lista do início mostra só os primeiros. */
  review: OverviewItem[];
  reviewTotal: number;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Indicadores da caixa de entrada, só de quem pode ver cada tipo. Conta, sem abrir nenhum envio. */
async function inboxIndicators(role: Role): Promise<DashboardIndicator[]> {
  const kinds = kindsAllowed(role, "view");
  if (!kinds.length) return [];
  const db = await createSessionClient();
  const requestKinds = kinds.filter((kind) => kind !== "feedback");
  const [requests, feedbacks] = await Promise.all([
    countNewSubmissions(db, requestKinds),
    countNewSubmissions(
      db,
      kinds.filter((kind) => kind === "feedback"),
    ),
  ]);
  return [
    ...(requestKinds.length
      ? [
          {
            key: "solicitacoes",
            label: "Solicitações novas",
            value: requests,
            hint: "Projetos e mensagens por responder",
            href: inboxHref({ status: "novo" }),
            highlight: requests > 0,
          },
        ]
      : []),
    ...(kinds.includes("feedback")
      ? [
          {
            key: "feedbacks",
            label: "Feedbacks novos",
            value: feedbacks,
            hint: feedbacks ? plural(feedbacks, "ainda não lido", "ainda não lidos") : "Nada por ler",
            href: inboxHref({ status: "novo", kind: "feedback" }),
            highlight: feedbacks > 0,
          },
        ]
      : []),
  ];
}

/**
 * Tudo que o início mostra, com a permissão aplicada aqui. É uma leitura só do conteúdo (`snapshot`) e
 * duas contagens, com a sessão de quem está logado. Falha sobe como erro: quem chama decide mostrar o
 * aviso, porque "0 cases" no lugar de um erro diria algo que não se sabe.
 */
export async function loadDashboard(role: Role, now: Date): Promise<DashboardData> {
  const { store } = await cmsDeps();
  const [snapshot, inbox] = await Promise.all([store.snapshot(), inboxIndicators(role)]);
  const overview = buildContentOverview(snapshot, (resource, action) => can(role, resource, action), now);
  const home = snapshot.pages.find((page) => page.slug === "home");
  const homeHref = home ? `/admin/paginas/${home.id}` : "/admin/paginas/nova?rota=home";
  return {
    indicators: contentIndicators(overview),
    inbox,
    actions: quickActions(role, can(role, "page", "view") ? homeHref : null),
    recent: recentItems(overview),
    review: overview.review.slice(0, 4),
    reviewTotal: overview.review.length,
  };
}
