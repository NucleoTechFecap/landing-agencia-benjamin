/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : versions.ts
 Descrição    : Histórico de versões do conteúdo: gravação, baseline e restauração segura.

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
import { can } from "@/lib/domain/auth/rbac";
import { BLOCK_SCHEMAS, isBlockType, isFreePageSlug } from "@/lib/domain/content/blocks";
import { catalogFieldLabel, parsePageFields } from "@/lib/domain/content/catalog";
import { parseSeo } from "@/lib/domain/content/seo-schema";
import { THEME_COLORS, THEME_IMAGES, parseTheme, type ThemeColor, type ThemeImage } from "@/lib/domain/content/theme";
import type { Page } from "@/lib/domain/content/types";
import { toSnapshot, versionResource, type ContentVersion, type VersionEntity } from "@/lib/domain/content/versions";
import { AppError } from "../errors";
import type { CmsActor, CmsDeps, ItemRef } from "./content-service";
import { saveContent } from "./content-service";
import { AREA, CASE, CATEGORY, CTA, PAGE, SERVICE, type CmsItem, type EntityDefinition } from "./entities";
import { saveSiteSettingsValues, type RestorableSettings } from "./settings-service";
import { saveThemeValues } from "./theme-service";
import { itemVersion, recordVersion } from "./version-log";

const LATEST_LIMIT = 100;

export const listItemVersions = (deps: Pick<CmsDeps, "store">, entity: VersionEntity, id: string) =>
  deps.store.listVersions({ entity, entityId: id, limit: LATEST_LIMIT });

export const listRecentVersions = (deps: Pick<CmsDeps, "store">, limit = 60) => deps.store.listVersions({ limit });

const ITEM_DEFINITIONS = {
  area: AREA,
  service: SERVICE,
  category: CATEGORY,
  case: CASE,
  cta: CTA,
} as const;

/** Imagem gravada em JSON que já saiu da biblioteca ficaria quebrada no site: barra antes de restaurar. */
async function assertImagesExist(deps: Pick<CmsDeps, "store">, content: unknown) {
  const sources = new Set<string>();
  const walk = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (typeof value === "object" && value !== null) {
      const { src } = value as { src?: unknown };
      if (typeof src === "string" && !src.startsWith("/")) sources.add(src);
      Object.values(value).forEach(walk);
    }
  };
  walk(content);
  if (!sources.size) return;
  const library = new Set((await deps.store.listMedia()).map((asset) => asset.src));
  const missing = [...sources].filter((src) => !library.has(src));
  if (missing.length) {
    throw new AppError("VALIDATION_FAILED", {
      message: "Esta versão usa imagens que não estão mais na biblioteca. Envie as imagens de novo e tente outra vez.",
      fieldErrors: { impacto: missing.map((src) => src.slice(src.lastIndexOf("/") + 1)) },
    });
  }
}

async function restorePage(deps: CmsDeps, actor: CmsActor, ref: ItemRef, version: ContentVersion) {
  const current = await deps.store.readPage(ref.id);
  if (!current) throw new AppError("NOT_FOUND");
  if (current.updatedAt !== ref.expectedUpdatedAt) throw new AppError("CONFLICT");
  if (current.status === "archived") {
    throw new AppError("VALIDATION_FAILED", { message: "Página arquivada: restaure como rascunho antes." });
  }
  const snapshot = version.snapshot as Partial<Page> & Record<string, unknown>;

  // Tudo passa pelas mesmas validações de uma gravação comum: a versão nunca fura uma regra atual.
  const blocks = (snapshot.blocks ?? []).map((block) => {
    if (!isBlockType(block.type))
      throw new AppError("VALIDATION_FAILED", { message: "Esta versão usa um bloco que não existe mais." });
    const parsed = BLOCK_SCHEMAS[block.type].safeParse(block.content);
    if (!parsed.success) {
      throw new AppError("VALIDATION_FAILED", { message: "Um bloco desta versão não atende às regras atuais." });
    }
    return { type: block.type, content: parsed.data };
  });
  const { fields } = parsePageFields(current.slug, snapshot.fields);
  const { seo } = parseSeo(snapshot.seo);
  await assertImagesExist(deps, { blocks, fields, seo });

  // Rota fixa sem nada gravado mostra os textos originais: voltar a esse estado é legítimo. Só a página
  // livre depende dos blocos para existir.
  if (current.status === "published" && isFreePageSlug(current.slug)) {
    const candidate = { ...current, blocks: blocks as Page["blocks"], fields, seo };
    const problems = PAGE.validateForPublish(candidate);
    if (problems.length) {
      throw new AppError("VALIDATION_FAILED", {
        message: "Esta versão deixaria a página publicada incompleta.",
        fieldErrors: { publicacao: problems },
      });
    }
  }

  const title = typeof snapshot.title === "string" ? snapshot.title : current.title;
  const description = typeof snapshot.description === "string" ? snapshot.description : null;
  const provisional = snapshot.provisional ?? current.provisional ?? false;

  await deps.audit({
    event: "content.version_restored",
    resourceId: current.id,
    outcome: "success",
    metadata: { entity: "page", slug: current.slug, fromStatus: current.status, count: version.version },
  });
  await deps.store.savePageDocument(current.id, current.updatedAt, {
    values: { title, description, provisional, fields, seo },
    blocks,
  });
  const after = await deps.store.readPage(current.id);
  if (after) {
    await recordVersion(deps, itemVersion("page", after, "version_restored", { restoredFrom: version.version }));
  }
  if (current.status === "published") deps.invalidate({ entity: "page", slug: current.slug });
}

/** Um item comum volta pelo mesmo `saveContent` do formulário: validação, concorrência, auditoria e cache. */
async function restoreItem<I extends { slug?: string }, T extends CmsItem>(
  deps: CmsDeps,
  actor: CmsActor,
  def: EntityDefinition<I, T>,
  ref: ItemRef,
  version: ContentVersion,
) {
  const snapshot = version.snapshot as unknown as T;
  const item = def.list(await deps.store.snapshot()).find((entry) => entry.id === ref.id);
  if (!item) throw new AppError("NOT_FOUND");
  if (!def.toRawInput) throw new AppError("BAD_REQUEST", { message: "Este conteúdo não pode ser restaurado." });
  // Restaurar não troca o endereço: a troca é feita no campo, com 301 em serviço e case (DB-08).
  const raw = { ...(def.toRawInput(snapshot) as object), ...(item.slug ? { slug: item.slug } : {}) };

  let expected = ref.expectedUpdatedAt;
  const { seo: restoredSeo } = parseSeo((snapshot as { seo?: unknown }).seo);
  const currentSeo = (item as { seo?: unknown }).seo ?? {};
  if (def.hasSeo && JSON.stringify(restoredSeo) !== JSON.stringify(currentSeo)) {
    await assertImagesExist(deps, restoredSeo);
    expected = (await deps.store.update(def.table, ref.id, { seo: restoredSeo }, expected)).updatedAt;
  }
  await saveContent(
    deps,
    actor,
    def,
    raw,
    { id: ref.id, expectedUpdatedAt: expected },
    { restoredFrom: version.version },
  );
}

/** O que está valendo hoje, para comparar; `null` quando o item foi excluído. */
export async function currentOfVersioned(
  deps: Pick<CmsDeps, "store">,
  entity: VersionEntity,
  id: string,
): Promise<{
  snapshot: Record<string, unknown>;
  updatedAt: string | null;
  status: CmsItem["status"] | null;
  /** Está visível no site: restaurar muda o site na hora. */
  live: boolean;
  slug?: string;
} | null> {
  if (entity === "settings" || entity === "theme") {
    const stored = await deps.store.readSettings();
    const updatedAt = stored?.updatedAt ?? null;
    const settings = stored?.settings;
    const snapshot =
      entity === "theme"
        ? { ...(settings?.theme ?? {}) }
        : {
            tagline: settings?.tagline,
            description: settings?.description,
            contact: settings?.contact,
            socials: settings?.socials,
          };
    return { snapshot, updatedAt, status: null, live: true };
  }
  const item: (CmsItem & object) | null =
    entity === "page"
      ? await deps.store.readPage(id)
      : ((ITEM_DEFINITIONS[entity] as unknown as EntityDefinition<{ slug?: string }, CmsItem>)
          .list(await deps.store.snapshot())
          .find((entry) => entry.id === id) ?? null);
  if (!item) return null;
  return {
    snapshot: toSnapshot(item),
    updatedAt: item.updatedAt,
    status: item.status,
    live: item.status === "published",
    slug: item.slug,
  };
}

/** Nome do campo para a comparação: campos do catálogo e da aparência têm o rótulo da tela. */
export async function versionLabelLookup(entity: VersionEntity, slug?: string) {
  return (path: string): string | undefined => {
    if (entity === "page" && slug) return catalogFieldLabel(slug, path);
    if (entity === "theme") {
      const [group, name] = path.split(".");
      if (group === "colors") return `Cor: ${THEME_COLORS[name as ThemeColor]?.label ?? name}`;
      if (group === "images") return THEME_IMAGES[name as ThemeImage]?.label ?? name;
    }
    return undefined;
  };
}

/** Nome do conteúdo por trás de um id, para a comparação não mostrar código. */
export async function versionNameLookup(deps: Pick<CmsDeps, "store">, entity: VersionEntity) {
  if (entity === "settings" || entity === "theme" || entity === "page") return undefined;
  const { areas, services, categories, cases } = await deps.store.snapshot();
  const names = new Map<string, string>([
    ...areas.map((item) => [item.id, item.name] as const),
    ...services.map((item) => [item.id, item.name] as const),
    ...categories.map((item) => [item.id, item.name] as const),
    ...cases.map((item) => [item.id, item.title] as const),
  ]);
  return (id: string) => names.get(id);
}

export interface RestoreRequest {
  entity: VersionEntity;
  entityId: string;
  version: number;
  /** Versão do item lida quando a tela abriu: quem chega tarde recebe CONFLICT, como no formulário. */
  expectedUpdatedAt: string | null;
}

/**
 * Traz o conteúdo de uma versão de volta. Item publicado muda no ar na hora, como numa edição. A
 * restauração vira uma versão nova, então também pode ser desfeita. Não muda endereço nem estado.
 */
export async function restoreVersion(deps: CmsDeps, actor: CmsActor, request: RestoreRequest): Promise<void> {
  const { entity, entityId, version: number, expectedUpdatedAt } = request;
  if (!can(actor.role, versionResource(entity), "edit")) throw new AppError("FORBIDDEN");
  const version = await deps.store.readVersion(entity, entityId, number);
  if (!version) throw new AppError("NOT_FOUND");
  if (!version.snapshot) {
    throw new AppError("BAD_REQUEST", { message: "Esta linha só registra uma mudança de estado: não há conteúdo." });
  }

  if (entity === "settings") {
    await saveSiteSettingsValues(
      deps,
      actor,
      version.snapshot as unknown as RestorableSettings,
      expectedUpdatedAt,
      number,
    );
    return;
  }
  if (entity === "theme") {
    const { theme } = parseTheme(version.snapshot);
    await assertImagesExist(deps, theme);
    await saveThemeValues(deps, actor, theme, expectedUpdatedAt, number);
    return;
  }
  if (!expectedUpdatedAt)
    throw new AppError("BAD_REQUEST", { message: "Formulário desatualizado. Recarregue a página." });
  const ref = { id: entityId, expectedUpdatedAt };
  if (entity === "page") {
    await restorePage(deps, actor, ref, version);
    return;
  }
  // Generics de definição diferentes não têm tipo comum: o despacho é por chave conhecida.
  await restoreItem(
    deps,
    actor,
    ITEM_DEFINITIONS[entity] as unknown as EntityDefinition<{ slug?: string }, CmsItem>,
    ref,
    version,
  );
}
