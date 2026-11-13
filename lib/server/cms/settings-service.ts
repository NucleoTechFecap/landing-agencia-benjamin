/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : settings-service.ts
 Descrição    : Grava contato, links e redes sociais: permissão, validação, concorrência, auditoria e cache.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-10).
 04/11/2026 Vinícius Nishimura Reis  Editor do site: campos, SEO, aparência e histórico.
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { siteSettings } from "@/content";
import { can } from "@/lib/domain/auth/rbac";
import { fieldErrorsOf } from "@/lib/domain/content/cms-schema";
import {
  changedSettingsFields,
  settingsFormSchema,
  type EditableSettings,
  type SettingsField,
} from "@/lib/domain/content/settings-schema";
import type { SiteSettings } from "@/lib/domain/content/types";
import { AppError } from "../errors";
import { SINGLE_ENTITY_ID } from "@/lib/domain/content/versions";
import type { CmsActor, CmsDeps } from "./content-service";
import { recordBaseline, recordVersion } from "./version-log";

const SETTINGS_RESOURCE_ID = "site_settings";
const VERSION_LABEL = "Configurações do site";

export interface SettingsForEdit {
  settings: SiteSettings;
  /** Versão lida, para a concorrência otimista; `null` enquanto a linha não existe no banco. */
  updatedAt: string | null;
}

/** O que o painel mostra. Sem linha no banco, os valores de referência que o site já exibe. */
export async function loadSettingsForEdit(deps: Pick<CmsDeps, "store">): Promise<SettingsForEdit> {
  const stored = await deps.store.readSettings();
  return { settings: stored?.settings ?? siteSettings, updatedAt: stored?.updatedAt ?? null };
}

const editableColumns = ({ tagline, description, contact, socials }: EditableSettings) => ({
  tagline,
  description,
  contact,
  socials,
});

/**
 * Primeira gravação de um ambiente sem a linha: o que o painel não edita recebe o valor de
 * referência, que é o que o site já exibe sem a linha. Assim, só muda o que a pessoa alterou.
 */
export const firstRowColumns = (input: EditableSettings) => ({
  name: siteSettings.name,
  short_name: siteSettings.shortName,
  manifesto: siteSettings.manifesto,
  about: siteSettings.about,
  keywords: siteSettings.keywords,
  ...editableColumns(input),
});

/**
 * Salva contato, links, redes e textos de apresentação (ADM-10). A tabela não tem rascunho: a
 * gravação vai direto ao ar. `settings.updated` é evento crítico: como nos comandos de publicação
 * (TECH-10), é auditado antes de gravar, e sem auditoria nada muda. Sem alteração real não há
 * gravação, evento nem cache a renovar. Devolve os nomes dos campos alterados.
 */
export async function saveSiteSettings(
  deps: CmsDeps,
  actor: CmsActor,
  raw: unknown,
  expectedUpdatedAt: string | null,
  restoredFrom?: number,
): Promise<SettingsField[]> {
  if (!can(actor.role, "settings", "edit")) throw new AppError("FORBIDDEN");
  const parsed = settingsFormSchema.safeParse(raw);
  if (!parsed.success) throw new AppError("VALIDATION_FAILED", { fieldErrors: fieldErrorsOf(parsed.error) });

  const { settings, updatedAt } = await loadSettingsForEdit(deps);
  if (updatedAt !== expectedUpdatedAt) throw new AppError("CONFLICT");

  const changed = changedSettingsFields(settings, parsed.data);
  if (!changed.length) return changed;

  const version = { entity: "settings" as const, entityId: SINGLE_ENTITY_ID, status: null, label: VERSION_LABEL };
  await recordBaseline(deps, { ...version, snapshot: { ...editableColumns(settings) } });

  const audit = (outcome: "success" | "failure") =>
    deps.audit({
      event: "settings.updated",
      resourceId: SETTINGS_RESOURCE_ID,
      outcome,
      metadata: { entity: "settings", kind: changed.join(","), count: changed.length },
    });
  await audit("success");
  try {
    await deps.store.saveSettings(
      updatedAt === null ? firstRowColumns(parsed.data) : editableColumns(parsed.data),
      updatedAt,
    );
  } catch (error) {
    await audit("failure").catch(() => undefined);
    throw error;
  }
  await recordVersion(deps, {
    ...version,
    action: restoredFrom ? "version_restored" : "updated",
    snapshot: { ...editableColumns(parsed.data) },
    summary: changed.join(", "),
    restoredFrom: restoredFrom ?? null,
  });
  deps.invalidate({ entity: "settings" });
  return changed;
}

/** O que uma versão da configuração guarda. */
export type RestorableSettings = EditableSettings;

/** Restaura uma versão pelo mesmo caminho do formulário: as regras de hoje valem para o texto de ontem. */
export const saveSiteSettingsValues = (
  deps: CmsDeps,
  actor: CmsActor,
  { tagline, description, contact, socials }: RestorableSettings,
  expectedUpdatedAt: string | null,
  restoredFrom: number,
) => saveSiteSettings(deps, actor, { tagline, description, ...contact, ...socials }, expectedUpdatedAt, restoredFrom);
