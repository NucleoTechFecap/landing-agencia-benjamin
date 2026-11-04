/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : dashboard.ts
 Descrição    : Regras puras do início do painel: indicadores, conteúdos recentes e atalhos por papel.

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

import { can, type Role } from "../auth/rbac";
import type { ContentOverview, OverviewItem } from "./overview";
import type { ContentEntityType } from "./types";

/** Número real do início, com o caminho para a lista de onde ele vem. */
export interface DashboardIndicator {
  key: string;
  label: string;
  value: number;
  hint?: string;
  href: string;
  /** Há algo a fazer: o número ganha destaque. */
  highlight?: boolean;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/**
 * Indicadores de conteúdo, só dos grupos que o papel pode ver. Grupo fora da visão geral não vira zero:
 * o indicador simplesmente não aparece, porque "0 cases" diria algo que a pessoa não pode saber.
 */
export function contentIndicators(overview: ContentOverview): DashboardIndicator[] {
  const group = (type: ContentEntityType) => overview.groups.find((item) => item.type === type);
  const cases = group("case");
  const services = group("service");
  if (!overview.groups.length) return [];
  return [
    ...(cases
      ? [
          {
            key: "cases",
            label: "Cases cadastrados",
            value: cases.counts.published + cases.counts.draft,
            hint: plural(cases.counts.archived, "arquivado à parte", "arquivados à parte"),
            href: cases.adminPath,
          },
          {
            key: "cases-publicados",
            label: "Cases publicados",
            value: cases.counts.published,
            hint: "Marcados para aparecer no site",
            href: cases.adminPath,
          },
        ]
      : []),
    ...(services
      ? [
          {
            key: "servicos",
            label: "Serviços cadastrados",
            value: services.counts.published + services.counts.draft,
            hint: plural(services.counts.published, "publicado", "publicados"),
            href: services.adminPath,
          },
        ]
      : []),
    {
      key: "rascunhos",
      label: "Conteúdos em rascunho",
      value: overview.counts.draft,
      hint: "Ainda fora do site",
      href: "/admin/conteudos",
    },
    {
      key: "revisao",
      label: "Precisam de revisão",
      value: overview.review.length,
      hint: "Pendências e textos provisórios",
      href: "/admin/conteudos",
      highlight: overview.review.length > 0,
    },
  ];
}

/** Últimos itens alterados, para retomar o trabalho. Arquivado fica de fora: saiu do site e da rotina. */
export function recentItems(overview: ContentOverview, limit = 6): OverviewItem[] {
  return overview.groups
    .flatMap((group) => group.items)
    .filter((item) => item.status !== "archived")
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.title.localeCompare(b.title, "pt-BR"))
    .slice(0, limit);
}

export interface QuickAction {
  key: string;
  label: string;
  description: string;
  href: string;
  /** Abre o site público em outra aba. */
  external?: boolean;
}

/**
 * Atalhos do início: só o que o papel consegue fazer de verdade. A proteção continua em cada página e
 * ação; aqui é só para não oferecer o que daria "Sem permissão". `homeHref` é null quando não se sabe
 * o endereço da página inicial (conteúdo ainda não lido, ou sem conta que possa criá-la).
 */
export function quickActions(role: Role, homeHref: string | null): QuickAction[] {
  const actions: QuickAction[] = [];
  if (can(role, "case", "create")) {
    actions.push({
      key: "novo-case",
      label: "Novo case",
      description: "Cadastre um trabalho no portfólio.",
      href: "/admin/cases/novo",
    });
  }
  if (homeHref && (can(role, "page", "edit") || can(role, "page", "create"))) {
    actions.push({
      key: "pagina-inicial",
      label: "Editar página inicial",
      description: "Manifesto e blocos da Home.",
      href: homeHref,
    });
  }
  if (can(role, "service", "edit")) {
    actions.push({
      key: "servicos",
      label: "Gerenciar serviços",
      description: "Textos, áreas e destaques.",
      href: "/admin/servicos",
    });
  }
  if (can(role, "settings", "edit")) {
    actions.push({
      key: "informacoes",
      label: "Atualizar informações",
      description: "Contato, links e redes sociais.",
      href: "/admin/configuracoes",
    });
  }
  actions.push({
    key: "site",
    label: "Ver site publicado",
    description: "Confira como está para o visitante.",
    href: "/",
    external: true,
  });
  return actions;
}
