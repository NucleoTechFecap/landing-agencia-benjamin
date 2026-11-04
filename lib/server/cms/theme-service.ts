/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : theme-service.ts
 Descrição    : Aparência do site: leitura, gravação e histórico de cores, fontes e logotipos.

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
 04/11/2026 Vinícius Nishimura Reis  Comparação sem depender da ordem das chaves que volta do jsonb.
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { can } from "@/lib/domain/auth/rbac";
import { fieldErrorsOf } from "@/lib/domain/content/cms-schema";
import { stableJson } from "@/lib/domain/content/fields";
import { compactTheme, contrastProblems, themeSchema, type SiteTheme } from "@/lib/domain/content/theme";
import { SINGLE_ENTITY_ID } from "@/lib/domain/content/versions";
import { AppError } from "../errors";
import type { CmsActor, CmsDeps } from "./content-service";
import { firstRowColumns, loadSettingsForEdit } from "./settings-service";
import { livePaths } from "./content-paths";
import { recordBaseline, recordVersion } from "./version-log";

const LABEL = "Aparência do site";

/**
 * Grava a aparência já validada. Vai direto ao ar (a coluna não tem rascunho) e é evento crítico: sem
 * auditoria, nada muda. Contraste abaixo do mínimo é recusado aqui, seja edição, seja versão antiga.
 */
export async function saveThemeValues(
  deps: CmsDeps,
  actor: CmsActor,
  input: SiteTheme,
  expectedUpdatedAt: string | null,
  restoredFrom?: number,
): Promise<boolean> {
  if (!can(actor.role, "settings", "edit")) throw new AppError("FORBIDDEN");
  const parsed = themeSchema.safeParse(input);
  if (!parsed.success) throw new AppError("VALIDATION_FAILED", { fieldErrors: fieldErrorsOf(parsed.error) });
  const theme = compactTheme(parsed.data);

  const blocking = contrastProblems(theme).filter((problem) => problem.blocking);
  if (blocking.length) {
    throw new AppError("VALIDATION_FAILED", {
      message: "Estas cores deixariam o texto ilegível. Escolha um contraste maior:",
      // `impacto`: a lista aparece junto da mensagem, inclusive ao restaurar, onde não há campo para destacar.
      fieldErrors: {
        impacto: blocking.map((problem) => `${problem.where}: ${problem.ratio.toFixed(1).replace(".", ",")}:1`),
      },
    });
  }

  const { settings, updatedAt } = await loadSettingsForEdit(deps);
  if (updatedAt !== expectedUpdatedAt) throw new AppError("CONFLICT");
  if (stableJson(settings.theme ?? {}) === stableJson(theme)) return false;

  const version = { entity: "theme" as const, entityId: SINGLE_ENTITY_ID, status: null, label: LABEL };
  await recordBaseline(deps, { ...version, snapshot: { ...(settings.theme ?? {}) } });

  const audit = (outcome: "success" | "failure") =>
    deps.audit({
      event: "settings.updated",
      resourceId: "site_settings",
      outcome,
      metadata: { entity: "settings", kind: restoredFrom ? "aparencia-restaurada" : "aparencia" },
    });
  await audit("success");
  try {
    await deps.store.saveSettings(updatedAt === null ? { ...firstRowColumns(settings), theme } : { theme }, updatedAt);
  } catch (error) {
    await audit("failure").catch(() => undefined);
    throw error;
  }
  await recordVersion(deps, {
    ...version,
    action: restoredFrom ? "version_restored" : "updated",
    snapshot: { ...theme },
    restoredFrom: restoredFrom ?? null,
  });
  deps.invalidate({ entity: "settings", relatedPaths: await livePaths(deps) });
  return true;
}
