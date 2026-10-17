/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : events.ts
 Descrição    : Catálogo de eventos auditados, filtro de metadados sem PII e limites críticos.

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
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (TECH-10).
──────────────────────────────────────────────────────────────────────────────
*/

/** Resultado registrado em cada evento de auditoria. */
export type AuditOutcome = "success" | "denied" | "failure";

export interface AuditEventDefinition {
  description: string;
  resourceType: string;
  /**
   * Operação crítica: se a auditoria não puder ser gravada, a operação é abortada
   * (TECH-10 §4). Eventos não críticos apenas registram a falha no log.
   */
  critical: boolean;
}

/** Catálogo fechado de eventos auditados (TECH-10). Evento fora da lista é rejeitado. */
export const AUDIT_EVENTS = {
  "auth.login.succeeded": { description: "Login no painel", resourceType: "session", critical: false },
  "auth.logout": { description: "Saída do painel", resourceType: "session", critical: false },
  "auth.password.changed": { description: "Senha definida/alterada", resourceType: "user", critical: false },
  "user.invited": { description: "Convite de usuário", resourceType: "user", critical: true },
  "user.role_changed": { description: "Alteração de papel", resourceType: "user", critical: true },
  "user.activation_changed": { description: "Conta ativada/desativada", resourceType: "user", critical: true },
  "content.created": { description: "Conteúdo criado", resourceType: "content", critical: false },
  "content.updated": {
    description: "Conteúdo editado (inclui edição de publicado)",
    resourceType: "content",
    critical: false,
  },
  "content.published": { description: "Conteúdo publicado", resourceType: "content", critical: true },
  "content.unpublished": { description: "Conteúdo despublicado", resourceType: "content", critical: true },
  "content.archived": { description: "Conteúdo arquivado", resourceType: "content", critical: true },
  "content.restored": { description: "Conteúdo restaurado", resourceType: "content", critical: false },
  "content.deleted": { description: "Conteúdo excluído definitivamente", resourceType: "content", critical: true },
  "settings.updated": {
    description: "Contato, links ou redes sociais alterados",
    resourceType: "settings",
    critical: true,
  },
  "media.uploaded": { description: "Mídia enviada", resourceType: "media", critical: false },
  "media.deleted": { description: "Mídia excluída", resourceType: "media", critical: true },
  "lead.viewed": { description: "Lead/contato aberto", resourceType: "lead", critical: false },
  "lead.status_changed": { description: "Status de atendimento alterado", resourceType: "lead", critical: false },
  "lead.exported": { description: "Exportação de leads", resourceType: "lead", critical: true },
  "lead.deleted": { description: "Lead excluído (titular/retenção)", resourceType: "lead", critical: true },
  "feedback.viewed": { description: "Feedback aberto", resourceType: "feedback", critical: false },
  "feedback.deleted": { description: "Feedback excluído", resourceType: "feedback", critical: true },
  "retention.executed": { description: "Rotina de retenção executada", resourceType: "retention", critical: true },
  "access.denied": { description: "Tentativa negada por permissão", resourceType: "access", critical: false },
} as const satisfies Record<string, AuditEventDefinition>;

export type AuditEventName = keyof typeof AUDIT_EVENTS;

export function isAuditEvent(value: string): value is AuditEventName {
  return Object.hasOwn(AUDIT_EVENTS, value);
}

/** Chaves aceitas em `metadata`: só referências e contadores, nunca PII nem conteúdo. */
const ALLOWED_METADATA_KEYS = new Set([
  "slug",
  "previousSlug",
  "entity",
  "fromStatus",
  "toStatus",
  "fromRole",
  "toRole",
  "active",
  "count",
  "filters",
  "kind",
  "category",
  "mimeType",
  "size",
  "reason",
  "action",
  "resource",
]);

const MAX_VALUE_LENGTH = 120;

/**
 * Filtra os metadados do evento: mantém apenas chaves da lista permitida e valores
 * primitivos curtos. Qualquer outra informação é descartada (sem payload de PII).
 */
export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> = {},
): Record<string, string | number | boolean> {
  const clean: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!ALLOWED_METADATA_KEYS.has(key)) continue;
    if (typeof value === "number" || typeof value === "boolean") clean[key] = value;
    else if (typeof value === "string") clean[key] = value.slice(0, MAX_VALUE_LENGTH);
  }
  return clean;
}

/** Limites das operações críticas (TECH-10 §4). */
export const CRITICAL_LIMITS = {
  /** Linhas por exportação de leads. */
  exportMaxRows: 1_000,
  /** Exportações por usuário por hora. */
  exportsPerHour: 5,
  /** Exclusões definitivas por usuário por hora (sem operações em lote no MVP). */
  deletesPerHour: 20,
} as const;
