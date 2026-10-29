/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : content-service.ts
 Descrição    : Regras de gravação e publicação do CMS: validação, integridade, concorrência, auditoria e cache.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 27/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 26/10/2026 Vinícius Nishimura Reis  Entidade de serviço e regras já cobertas (ADM-06).
 26/10/2026 Vinícius Nishimura Reis  Categorias, cases, galeria e envio de mídia (ADM-08).
 26/10/2026 Vinícius Nishimura Reis  Slug em branco gerado pelo servidor, sem preenchimento no navegador (TECH-12).
 27/10/2026 Vinícius Nishimura Reis  Correções da revisão de segurança (TECH-13).
 28/10/2026 Vinícius Nishimura Reis  Salva conteúdo e relações atomicamente no banco (TECH-13).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { can, type Role } from "@/lib/domain/auth/rbac";
import { AUDIT_EVENTS, type AuditEventName } from "@/lib/domain/audit/events";
import { fieldErrorsOf } from "@/lib/domain/content/cms-schema";
import { assessRemovalImpact, findIntegrityIssues } from "@/lib/domain/content/integrity";
import { uniqueSlug } from "@/lib/domain/content/slug";
import {
  transition,
  type PublicationCommand,
  type PublicationError,
  type PublicationState,
} from "@/lib/domain/content/publication";
import type { PublicationStatus } from "@/lib/domain/content/publication-status";
import type { ContentSnapshot } from "@/lib/domain/content/types";
import type { AuditInput } from "../audit";
import type { ContentChange } from "../content/invalidate";
import { AppError } from "../errors";
import type { CmsItem, EntityDefinition } from "./entities";
import type { CmsStore } from "./store";

export interface CmsActor {
  id: string;
  role: Role;
}

/** Dependências injetadas: em produção, Supabase + auditoria + updateTag; nos testes, memória. */
export interface CmsDeps {
  store: CmsStore;
  audit(input: AuditInput): Promise<void>;
  invalidate(change: ContentChange): void;
  now(): Date;
}

export interface ItemRef {
  id: string;
  /** `updated_at` lido quando o formulário foi aberto (concorrência otimista). */
  expectedUpdatedAt: string;
}

export interface SaveResult {
  id: string;
  updatedAt: string;
  status: PublicationStatus;
  created: boolean;
}

export interface CommandResult {
  status: PublicationStatus | "deleted";
  /** Avisos de impacto (ex.: CTAs que passam a usar fallback) para mostrar após a operação. */
  warnings: string[];
}

const COMMAND_EVENTS: Record<PublicationCommand, AuditEventName> = {
  save: "content.updated",
  publish: "content.published",
  unpublish: "content.unpublished",
  archive: "content.archived",
  restore: "content.restored",
  delete: "content.deleted",
};

/**
 * Alteração para o cache: a entidade, o slug e as outras páginas que exibem o item. Em edição,
 * vale a união das relações de antes e de depois (o case que saiu de um serviço também some da
 * página dele).
 */
function contentChange<I extends { slug: string }, T extends CmsItem>(
  def: EntityDefinition<I, T>,
  slug: string,
  items: T[],
  snapshot: ContentSnapshot,
  now: Date,
): ContentChange {
  const relatedPaths = [...new Set(items.flatMap((item) => def.relatedPaths?.(item, snapshot, now) ?? []))];
  return { entity: def.type, slug, ...(relatedPaths.length ? { relatedPaths } : {}) };
}

/** Snapshot com o item substituído pela versão nova (para checar integridade antes de gravar). */
function withItem<I extends { slug: string }, T extends CmsItem>(
  snapshot: ContentSnapshot,
  def: EntityDefinition<I, T>,
  item: T,
): ContentSnapshot {
  const items = def.list(snapshot);
  const replaced = items.some((entry) => entry.id === item.id)
    ? items.map((entry) => (entry.id === item.id ? item : entry))
    : [...items, item];
  return { ...snapshot, [def.key]: replaced };
}

/**
 * O que impede publicar o item: campos obrigatórios da entidade e erros de integridade que
 * apareceriam com ele publicado (ex.: serviço sem área, case com categoria em rascunho).
 */
export function publishProblems<I extends { slug: string }, T extends CmsItem>(
  def: EntityDefinition<I, T>,
  item: T,
  snapshot: ContentSnapshot,
  now: Date,
): string[] {
  // Primeiro o que falta no próprio item; as regras entre conteúdos (categoria publicada,
  // serviço publicado…) só fazem sentido — e só aparecem — depois disso.
  const own = def.validateForPublish(item);
  if (own.length) return own;
  const published = { ...item, status: "published" as const, publishedAt: item.publishedAt ?? now.toISOString() };
  const integrity = findIntegrityIssues(withItem(snapshot, def, published), now)
    .filter((issue) => issue.severity === "error" && issue.entity.type === def.type && issue.entity.id === item.id)
    .filter((issue) => !def.coveredRules?.includes(issue.code))
    .map((issue) => issue.message);
  return integrity;
}

function publicationError(error: PublicationError): AppError {
  if (error.code === "FORBIDDEN") return new AppError("FORBIDDEN", { message: error.message });
  if (error.code === "INVALID_TRANSITION") return new AppError("INVALID_TRANSITION", { message: error.message });
  return new AppError("VALIDATION_FAILED", {
    message: "Ainda falta conteúdo para publicar. Complete os itens abaixo.",
    fieldErrors: { publicacao: error.details ?? [] },
  });
}

/**
 * Slug em branco: na criação vira o nome/título normalizado e único entre os itens da
 * entidade; na edição mantém o atual (apagar o campo não apaga o endereço).
 */
function withSlug<I extends { slug: string }, T extends CmsItem>(
  def: EntityDefinition<I, T>,
  raw: unknown,
  snapshot: ContentSnapshot,
  ref?: ItemRef,
): unknown {
  if (typeof raw !== "object" || raw === null) return raw;
  const values = raw as Record<string, unknown>;
  if (typeof values.slug === "string" && values.slug.trim()) return raw;
  const items = def.list(snapshot);
  const current = ref ? items.find((item) => item.id === ref.id) : undefined;
  if (current) return { ...values, slug: current.slug };
  const source = typeof values[def.slugSource] === "string" ? (values[def.slugSource] as string) : "";
  if (!source.trim()) return raw;
  return {
    ...values,
    slug: uniqueSlug(
      source,
      items.map((item) => item.slug),
    ),
  };
}

const stateOf = (item: CmsItem): PublicationState => ({
  status: item.status,
  publishedAt: item.publishedAt,
  archivedAt: item.archivedAt ?? null,
});

/**
 * Cria (rascunho) ou edita um item. Editar item publicado o mantém publicado, então o
 * conteúdo passa pela validação de publicação (I5); item arquivado precisa ser restaurado
 * antes de editar. O slug fica travado depois da primeira publicação: os links já foram
 * divulgados e o redirecionamento de URL antiga ainda não existe (DB-08).
 */
export async function saveContent<I extends { slug: string }, T extends CmsItem>(
  deps: CmsDeps,
  actor: CmsActor,
  def: EntityDefinition<I, T>,
  raw: unknown,
  ref?: ItemRef,
): Promise<SaveResult> {
  if (!can(actor.role, def.resource, ref ? "edit" : "create")) throw new AppError("FORBIDDEN");
  const snapshot = await deps.store.snapshot();
  const parsed = def.inputSchema.safeParse(withSlug(def, raw, snapshot, ref));
  if (!parsed.success) throw new AppError("VALIDATION_FAILED", { fieldErrors: fieldErrorsOf(parsed.error) });
  const input = parsed.data;

  const now = deps.now();
  const items = def.list(snapshot);
  const current = ref ? items.find((item) => item.id === ref.id) : undefined;
  if (ref && !current) throw new AppError("NOT_FOUND");
  if (current && current.updatedAt !== ref!.expectedUpdatedAt) throw new AppError("CONFLICT");

  const slugTaken = items.some((item) => item.slug === input.slug && item.id !== current?.id);
  if (slugTaken) {
    throw new AppError("VALIDATION_FAILED", {
      fieldErrors: { slug: ["Já existe um item com este endereço. Escolha outro."] },
    });
  }
  if (current?.publishedAt && current.slug !== input.slug) {
    throw new AppError("VALIDATION_FAILED", {
      fieldErrors: { slug: ["O endereço não muda depois da primeira publicação: os links já foram divulgados."] },
    });
  }

  const media = new Map((await deps.store.listMedia()).map((asset) => [asset.id, asset]));
  const merged = def.merge(current, input, current?.id ?? "novo", media);
  if (current) {
    const check = transition(stateOf(current), "save", {
      role: actor.role,
      resource: def.resource,
      now,
      validateForPublish: () => publishProblems(def, merged, snapshot, now),
    });
    if (!check.ok) throw publicationError(check.error);
  }

  const saved = await deps.store.saveAtomic({
    table: def.table,
    values: def.toValues(input),
    ...(current ? { id: current.id, expectedUpdatedAt: current.updatedAt } : {}),
    ...(def.links?.table === "service_areas" ? { serviceAreaIds: def.links.from(input) } : {}),
    ...(def.links?.table === "case_services" ? { caseServiceIds: def.links.from(input) } : {}),
    ...("galleryIds" in input && Array.isArray(input.galleryIds) ? { caseGalleryIds: input.galleryIds } : {}),
  });
  const auditSave = (outcome: "success" | "failure", reason?: string) =>
    deps.audit({
      event: current ? "content.updated" : "content.created",
      resourceId: saved.id,
      outcome,
      metadata: {
        entity: def.type,
        slug: input.slug,
        ...(current ? { fromStatus: current.status } : {}),
        ...(reason ? { reason } : {}),
      },
    });
  const refreshSite = () => {
    if (current?.status === "published")
      deps.invalidate(contentChange(def, input.slug, [merged, current], snapshot, now));
  };

  await auditSave("success");
  refreshSite();
  return { id: saved.id, updatedAt: saved.updatedAt, status: current?.status ?? "draft", created: !current };
}

/**
 * Publica, despublica, arquiva, restaura ou exclui (TECH-04): transição permitida → papel →
 * conteúdo completo → impacto em outras páginas (TECH-05) → auditoria → gravação → cache.
 * Eventos críticos são auditados ANTES da gravação; se ela falhar, registra-se a falha (TECH-10).
 */
export async function runContentCommand<I extends { slug: string }, T extends CmsItem>(
  deps: CmsDeps,
  actor: CmsActor,
  def: EntityDefinition<I, T>,
  ref: ItemRef,
  command: PublicationCommand,
): Promise<CommandResult> {
  const now = deps.now();
  const snapshot = await deps.store.snapshot();
  const item = def.list(snapshot).find((entry) => entry.id === ref.id);
  if (!item) throw new AppError("NOT_FOUND");
  if (item.updatedAt !== ref.expectedUpdatedAt) throw new AppError("CONFLICT");

  const result = transition(stateOf(item), command, {
    role: actor.role,
    resource: def.resource,
    now,
    validateForPublish: () => publishProblems(def, item, snapshot, now),
  });
  if (!result.ok) throw publicationError(result.error);

  let warnings: string[] = [];
  const leavesSite = item.status === "published" && (command === "unpublish" || command === "archive");
  if (leavesSite || command === "delete") {
    const impact = assessRemovalImpact(def.type, item.id, snapshot, now);
    if (impact.blockers.length) {
      throw new AppError("CONFLICT", {
        message: "Esta operação deixaria páginas do site quebradas. Resolva antes:",
        fieldErrors: { impacto: impact.blockers },
      });
    }
    warnings = impact.warnings;
  }
  if (command === "delete") {
    const blockers = def.deleteBlockers?.(item, snapshot) ?? [];
    if (blockers.length) {
      throw new AppError("CONFLICT", {
        message: "Não dá para excluir: o item ainda está em uso.",
        fieldErrors: { impacto: blockers },
      });
    }
  }

  const next = result.next;
  const event = COMMAND_EVENTS[command];
  const critical = AUDIT_EVENTS[event].critical;
  const audit = (outcome: "success" | "failure") =>
    deps.audit({
      event,
      resourceId: item.id,
      outcome,
      metadata: { entity: def.type, slug: item.slug, fromStatus: item.status, toStatus: next.status },
    });

  if (critical) await audit("success");
  try {
    if (next.status === "deleted") await deps.store.remove(def.table, item.id);
    else {
      await deps.store.update(
        def.table,
        item.id,
        { status: next.status, published_at: next.publishedAt, archived_at: next.archivedAt },
        item.updatedAt,
      );
    }
  } catch (error) {
    if (critical) await audit("failure").catch(() => undefined);
    throw error;
  }
  if (!critical) await audit("success");

  if (item.status === "published" || next.status === "published") {
    deps.invalidate(contentChange(def, item.slug, [item], snapshot, now));
  }
  return { status: next.status, warnings };
}
