/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : version-log.ts
 Descrição    : Registra versões do conteúdo: a edição não falha se o histórico falhar.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { hasSnapshot, toSnapshot, type VersionAction, type VersionEntity } from "@/lib/domain/content/versions";
import { logger } from "../logger";
import type { CmsStore, VersionInput } from "./store";

type StoreDeps = { store: CmsStore };

/**
 * Perder uma versão é menos grave que bloquear a edição (FUT-04 §5.2): o conteúdo já foi gravado, então
 * a falha vai para o log com o que faltou, e a pessoa não recebe erro por algo que deu certo.
 */
export async function recordVersion(deps: StoreDeps, input: VersionInput): Promise<void> {
  try {
    await deps.store.insertVersion(input);
  } catch (error) {
    logger.error("cms.version.record_failed", {
      entity: input.entity,
      entityId: input.entityId,
      action: input.action,
      error,
    });
  }
}

/**
 * Antes da primeira edição, guarda como o item estava: sem isso, o conteúdo anterior ao histórico
 * (o texto original do site) não teria para onde voltar.
 */
export async function recordBaseline(
  deps: StoreDeps,
  input: Pick<VersionInput, "entity" | "entityId" | "status" | "label" | "snapshot">,
): Promise<void> {
  try {
    if ((await deps.store.countVersions(input.entity, input.entityId)) > 0) return;
    await deps.store.insertVersion({ ...input, action: "baseline" });
  } catch (error) {
    logger.error("cms.version.record_failed", {
      entity: input.entity,
      entityId: input.entityId,
      action: "baseline",
      error,
    });
  }
}

/** Baseline e versão de um item de conteúdo, com os campos de controle de fora. */
export const itemVersion = <
  T extends {
    id: string;
    status: VersionInput["status"];
    slug?: string;
    title?: string;
    name?: string;
    label?: string;
  },
>(
  entity: VersionEntity,
  item: T,
  action: VersionAction,
  extra: { summary?: string; restoredFrom?: number } = {},
): VersionInput => ({
  entity,
  entityId: item.id,
  action,
  status: item.status,
  label: item.title ?? item.name ?? item.label ?? item.slug ?? null,
  snapshot: hasSnapshot(action) ? toSnapshot(item) : null,
  summary: extra.summary ?? null,
  restoredFrom: extra.restoredFrom ?? null,
});
