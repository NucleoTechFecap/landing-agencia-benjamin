/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : admin-modules.ts
 Descrição    : Registro único dos módulos do painel, usado pelo menu e pelo início.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-04).
 04/11/2026 Vinícius Nishimura Reis  Tela de leads e feedbacks disponível (FORM-09).
──────────────────────────────────────────────────────────────────────────────
*/

import { can, type Action, type Resource, type Role } from "@/lib/domain/auth/rbac";

export interface AdminModule {
  name: string;
  /** Permissão que o papel precisa ter para o módulo aparecer. A proteção real está em cada página e ação. */
  resource: Resource;
  action: Action;
  /** Sem `href` o módulo ainda não tem tela: aparece como "Em construção", nunca como link. */
  href?: string;
  /** Issue que entrega o módulo, mostrada enquanto ele está em construção. */
  issue?: string;
}

/** Módulo novo: acrescente uma linha. Quando a tela ficar pronta, troque `issue` por `href`. */
export const ADMIN_MODULES: readonly AdminModule[] = [
  { name: "Visão geral dos conteúdos", resource: "dashboard", action: "view", href: "/admin/conteudos" },
  { name: "Páginas e textos", resource: "page", action: "view", href: "/admin/paginas" },
  { name: "Áreas de atuação", resource: "area", action: "view", href: "/admin/areas" },
  { name: "Serviços", resource: "service", action: "view", href: "/admin/servicos" },
  { name: "Categorias de cases", resource: "category", action: "view", href: "/admin/categorias" },
  { name: "Cases", resource: "case", action: "view", href: "/admin/cases" },
  { name: "Biblioteca de mídia", resource: "media", action: "view", href: "/admin/midia" },
  { name: "Contato, links e redes sociais", resource: "settings", action: "view", href: "/admin/configuracoes" },
  { name: "CTAs e destaques da Home", resource: "cta", action: "view", issue: "ADM-11" },
  { name: "Leads e feedbacks", resource: "lead", action: "view", href: "/admin/leads" },
  { name: "Usuários e papéis", resource: "user", action: "view", issue: "INT-08" },
  { name: "Trilha de auditoria", resource: "audit", action: "view", issue: "TECH-10" },
];

export const ADMIN_HOME_PATH = "/admin";

/** Módulos que o papel pode abrir, na ordem do registro. */
export function modulesFor(role: Role | null | undefined): AdminModule[] {
  return ADMIN_MODULES.filter((module) => can(role, module.resource, module.action));
}

/** O início só é a página atual nele mesmo; os módulos continuam ativos nas telas internas. */
export function isActiveModule(pathname: string, href: string): boolean {
  if (href === ADMIN_HOME_PATH) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
