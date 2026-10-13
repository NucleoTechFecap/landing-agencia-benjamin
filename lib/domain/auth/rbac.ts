/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : rbac.ts
 Descrição    : Matriz RBAC papel × recurso × ação com negação por padrão e regras de atribuição.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-03).
──────────────────────────────────────────────────────────────────────────────
*/

/** Papéis administrativos (ADM-01). `pending` = conta sem acesso liberado. */
export const ROLES = ["super_admin", "admin", "editor", "viewer", "pending"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Super administrador (NúcleoTech)",
  admin: "Administrador (Benjamin)",
  editor: "Editor",
  viewer: "Leitor",
  pending: "Acesso pendente",
};

/** Recursos protegidos do painel (TECH-03). */
export const RESOURCES = [
  "dashboard",
  "page",
  "area",
  "service",
  "category",
  "case",
  "cta",
  "media",
  "settings",
  "lead",
  "feedback",
  "user",
  "audit",
] as const;
export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ["view", "create", "edit", "publish", "archive", "delete", "export", "manage"] as const;
export type Action = (typeof ACTIONS)[number];

type Grants = Partial<Record<Resource, readonly Action[]>>;

const CONTENT_RESOURCES = ["page", "area", "service", "category", "case", "cta"] as const;
const ALL_CONTENT_ACTIONS = ["view", "create", "edit", "publish", "archive", "delete"] as const;
const EDITOR_CONTENT_ACTIONS = ["view", "create", "edit", "publish", "archive"] as const;

const contentGrants = (actions: readonly Action[]): Grants =>
  Object.fromEntries(CONTENT_RESOURCES.map((resource) => [resource, actions]));

/**
 * Matriz papel × recurso × ação. Tudo que não está listado é NEGADO (deny by default).
 * Espelhada na tabela `role_permissions` do banco (migration de autenticação, ADM-02/03).
 */
export const PERMISSION_MATRIX: Readonly<Record<Role, Grants>> = {
  super_admin: {
    dashboard: ["view"],
    ...contentGrants(ALL_CONTENT_ACTIONS),
    media: ["view", "create", "edit", "delete"],
    settings: ["view", "edit"],
    // Minimização (TECH-08): NúcleoTech não lê leads/feedbacks por padrão.
    user: ["view", "create", "edit", "manage"],
    audit: ["view"],
  },
  admin: {
    dashboard: ["view"],
    ...contentGrants(ALL_CONTENT_ACTIONS),
    media: ["view", "create", "edit", "delete"],
    settings: ["view", "edit"],
    lead: ["view", "edit", "archive", "delete", "export"],
    feedback: ["view", "edit", "archive", "delete"],
    user: ["view", "create", "edit"],
    audit: ["view"],
  },
  editor: {
    dashboard: ["view"],
    ...contentGrants(EDITOR_CONTENT_ACTIONS),
    media: ["view", "create", "edit"],
    settings: ["view"],
  },
  viewer: {
    dashboard: ["view"],
    ...contentGrants(["view"]),
    media: ["view"],
    settings: ["view"],
  },
  pending: {},
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Verifica permissão. Papel desconhecido, nulo ou ausente sempre resulta em `false`. */
export function can(role: Role | null | undefined, resource: Resource, action: Action): boolean {
  if (!role || !isRole(role)) return false;
  return PERMISSION_MATRIX[role][resource]?.includes(action) ?? false;
}

/** Papéis que entram no painel (todos exceto `pending`). */
export function canAccessPanel(role: Role | null | undefined): boolean {
  return can(role, "dashboard", "view");
}

/**
 * Quem pode atribuir qual papel (ADM-01 §4):
 * - super_admin atribui qualquer papel, exceto rebaixar a si mesmo (evita ficar sem super_admin);
 * - admin convida/ajusta apenas editor, viewer e pending;
 * - ninguém altera o próprio papel.
 */
export function canAssignRole(
  actor: { id: string; role: Role | null | undefined },
  target: { id: string; currentRole: Role },
  nextRole: Role,
): boolean {
  if (!actor.role || actor.id === target.id) return false;
  if (actor.role === "super_admin") return true;
  if (actor.role === "admin") {
    const manageable: Role[] = ["editor", "viewer", "pending"];
    return manageable.includes(target.currentRole) && manageable.includes(nextRole);
  }
  return false;
}

export interface Grant {
  role: Role;
  resource: Resource;
  action: Action;
}

/** Lista plana das permissões (usada para gerar/conferir o seed SQL de `role_permissions`). */
export function listGrants(): Grant[] {
  return ROLES.flatMap((role) =>
    Object.entries(PERMISSION_MATRIX[role]).flatMap(([resource, actions]) =>
      (actions ?? []).map((action) => ({ role, resource: resource as Resource, action })),
    ),
  );
}
