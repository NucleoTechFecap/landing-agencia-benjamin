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
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-04).
 04/11/2026 Vinícius Nishimura Reis  Tela de leads e feedbacks disponível (FORM-09).
 04/11/2026 Vinícius Nishimura Reis  Módulo de CTAs e destaques da Home (ADM-11).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
 12/11/2026 Codex                     Inclui artigos no painel (FUT-10).
──────────────────────────────────────────────────────────────────────────────
*/

import { can, type Action, type Resource, type Role } from "@/lib/domain/auth/rbac";

export const ADMIN_GROUPS = [
  { id: "geral", label: "Visão geral" },
  { id: "conteudo", label: "Conteúdo do site" },
  { id: "comunicacao", label: "Comunicação" },
  { id: "biblioteca", label: "Biblioteca" },
  { id: "administracao", label: "Administração" },
] as const;

export type AdminGroupId = (typeof ADMIN_GROUPS)[number]["id"];

/** Nome do ícone de interface do módulo (components/admin/ui/icons.tsx). */
export type AdminModuleIcon =
  | "inicio"
  | "revisao"
  | "paginas"
  | "areas"
  | "servicos"
  | "cases"
  | "categorias"
  | "chamadas"
  | "contatos"
  | "midia"
  | "configuracoes"
  | "aparencia"
  | "historico";

export interface AdminModule {
  name: string;
  /** Permissão que o papel precisa ter para o módulo aparecer. A proteção real está em cada página e ação. */
  resource: Resource;
  action: Action;
  group: AdminGroupId;
  icon: AdminModuleIcon;
  /** Sem `href` o módulo ainda não tem tela e fica fora do menu: nada de item que não leva a lugar nenhum. */
  href?: string;
  /** Issue que entrega o módulo enquanto ele não tem tela. */
  issue?: string;
  /** Como o item aberto e o item novo aparecem na trilha. */
  itemLabel?: string;
  newLabel?: string;
}

/** Módulo novo: acrescente uma linha. Quando a tela ficar pronta, troque `issue` por `href`. */
export const ADMIN_MODULES: readonly AdminModule[] = [
  {
    name: "Revisão de conteúdos",
    resource: "dashboard",
    action: "view",
    group: "geral",
    icon: "revisao",
    href: "/admin/conteudos",
  },
  {
    name: "Histórico de alterações",
    resource: "dashboard",
    action: "view",
    group: "geral",
    icon: "historico",
    href: "/admin/historico",
    itemLabel: "Versões",
  },
  {
    name: "Páginas e textos",
    resource: "page",
    action: "view",
    group: "conteudo",
    icon: "paginas",
    href: "/admin/paginas",
    itemLabel: "Editar página",
    newLabel: "Nova página",
  },
  {
    name: "Blog",
    resource: "page",
    action: "view",
    group: "conteudo",
    icon: "paginas",
    href: "/admin/blog",
    itemLabel: "Editar artigo",
    newLabel: "Novo artigo",
  },
  {
    name: "Áreas de atuação",
    resource: "area",
    action: "view",
    group: "conteudo",
    icon: "areas",
    href: "/admin/areas",
    itemLabel: "Editar área",
    newLabel: "Nova área",
  },
  {
    name: "Serviços",
    resource: "service",
    action: "view",
    group: "conteudo",
    icon: "servicos",
    href: "/admin/servicos",
    itemLabel: "Editar serviço",
    newLabel: "Novo serviço",
  },
  {
    name: "Cases",
    resource: "case",
    action: "view",
    group: "conteudo",
    icon: "cases",
    href: "/admin/cases",
    itemLabel: "Editar case",
    newLabel: "Novo case",
  },
  {
    name: "Categorias de cases",
    resource: "category",
    action: "view",
    group: "conteudo",
    icon: "categorias",
    href: "/admin/categorias",
    itemLabel: "Editar categoria",
    newLabel: "Nova categoria",
  },
  {
    name: "CTAs e destaques da Home",
    resource: "cta",
    action: "view",
    group: "conteudo",
    icon: "chamadas",
    href: "/admin/ctas",
    itemLabel: "Editar CTA",
    newLabel: "Novo CTA",
  },
  {
    name: "Contatos e feedbacks",
    resource: "lead",
    action: "view",
    group: "comunicacao",
    icon: "contatos",
    href: "/admin/leads",
    itemLabel: "Envio recebido",
  },
  {
    name: "Imagens e arquivos",
    resource: "media",
    action: "view",
    group: "biblioteca",
    icon: "midia",
    href: "/admin/midia",
    itemLabel: "Arquivo",
  },
  {
    name: "Aparência do site",
    resource: "settings",
    action: "view",
    group: "administracao",
    icon: "aparencia",
    href: "/admin/aparencia",
  },
  {
    name: "Contato, links e redes sociais",
    resource: "settings",
    action: "view",
    group: "administracao",
    icon: "configuracoes",
    href: "/admin/configuracoes",
  },
  {
    name: "Usuários e papéis",
    resource: "user",
    action: "view",
    group: "administracao",
    icon: "configuracoes",
    issue: "INT-08",
  },
  {
    name: "Trilha de auditoria",
    resource: "audit",
    action: "view",
    group: "administracao",
    icon: "revisao",
    issue: "TECH-10",
  },
];

export const ADMIN_HOME_PATH = "/admin";

/** Preferência de aparência, sem dado pessoal: lida no servidor para o menu não abrir e fechar ao carregar. */
export const MENU_COOKIE = "painel-menu";
export const MENU_COLLAPSED = "recolhido";

const HOME_MODULE: AdminModule = {
  name: "Início",
  resource: "dashboard",
  action: "view",
  group: "geral",
  icon: "inicio",
  href: ADMIN_HOME_PATH,
};

/** Módulos que o papel pode abrir, na ordem do registro. */
export function modulesFor(role: Role | null | undefined): AdminModule[] {
  return ADMIN_MODULES.filter((module) => can(role, module.resource, module.action));
}

export interface AdminNavigationGroup {
  id: AdminGroupId;
  label: string;
  modules: AdminModule[];
}

/** O menu: grupos com o que o papel pode abrir e que já tem tela. Grupo vazio não aparece. */
export function navigationFor(role: Role | null | undefined): AdminNavigationGroup[] {
  const available = modulesFor(role).filter((module) => module.href);
  return ADMIN_GROUPS.map(({ id, label }) => ({
    id,
    label,
    modules: [
      ...(id === "geral" && can(role, HOME_MODULE.resource, HOME_MODULE.action) ? [HOME_MODULE] : []),
      ...available.filter((module) => module.group === id),
    ],
  })).filter((group) => group.modules.length > 0);
}

/** O início só é a página atual nele mesmo; os módulos continuam ativos nas telas internas. */
export function isActiveModule(pathname: string, href: string): boolean {
  if (href === ADMIN_HOME_PATH) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface AdminCrumb {
  label: string;
  /** Sem `href`: é a página atual. */
  href?: string;
}

/**
 * Trilha do cabeçalho, calculada só pelo endereço. O nome do item aberto fica no título da própria
 * página: a casca não lê o banco, e o título de um envio nunca passa por aqui (TECH-08).
 */
export function breadcrumbsFor(pathname: string): AdminCrumb[] {
  const path = pathname.replace(/\/+$/, "") || ADMIN_HOME_PATH;
  const root = { label: "Painel", href: ADMIN_HOME_PATH };
  if (path === ADMIN_HOME_PATH) return [{ label: "Painel" }];

  const current = ADMIN_MODULES.find((candidate) => candidate.href && isActiveModule(path, candidate.href));
  if (!current?.href) return [root, { label: "Página do painel" }];

  const rest = path.slice(current.href.length).split("/").filter(Boolean);
  if (!rest.length) return [root, { label: current.name }];

  // Histórico: /admin/historico/<tipo>/<id>[/<versão>].
  if (current.href === "/admin/historico") {
    return [root, { label: current.name, href: current.href }, { label: rest[2] ? `Versão ${rest[2]}` : "Versões" }];
  }

  const [first, nested, nestedItem] = rest;
  const isNew = first === "novo" || first === "nova";
  const item = isNew ? (current.newLabel ?? "Novo item") : (current.itemLabel ?? "Item");
  if (!nested) return [root, { label: current.name, href: current.href }, { label: item }];
  // Blocos de uma página: /admin/paginas/<id>/blocos/<bloco ou novo>.
  return [
    root,
    { label: current.name, href: current.href },
    { label: item, href: `${current.href}/${first}` },
    { label: nestedItem === "novo" ? "Novo bloco" : "Editar bloco" },
  ];
}
