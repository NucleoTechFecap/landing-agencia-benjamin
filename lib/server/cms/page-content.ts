/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : page-content.ts
 Descrição    : Salva os campos das seções fixas e o SEO de páginas, serviços e cases.

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
import { PAGE_CATALOG, diffFromDefaults, isCatalogSlug, type CatalogPage } from "@/lib/domain/content/catalog";
import { fieldErrorsOf } from "@/lib/domain/content/cms-schema";
import {
  fieldDefault,
  readFields,
  type FieldErrors,
  type FormEntries,
  type ImageValue,
} from "@/lib/domain/content/fields";
import { transition } from "@/lib/domain/content/publication";
import { compactSeo, seoFromForm, type SeoFormInput } from "@/lib/domain/content/seo-schema";
import type { Page, SiteSettings } from "@/lib/domain/content/types";
import type { VersionEntity } from "@/lib/domain/content/versions";
import { AppError } from "../errors";
import { publicationError, stateOf, type CmsActor, type CmsDeps, type ItemRef } from "./content-service";
import type { CmsItem, EntityDefinition } from "./entities";
import { livePaths } from "./content-paths";
import { mediaLookup } from "./media-lookup";
import type { MediaAsset } from "./store";
import { itemVersion, recordBaseline, recordVersion } from "./version-log";

/** Lê todos os campos de uma página do catálogo. O nome no formulário é `secao.campo`. */
export function readPageForm(
  catalog: CatalogPage,
  entries: FormEntries,
  media: readonly MediaAsset[],
  page: Pick<Page, "fields">,
  settings: SiteSettings,
): { values: Record<string, unknown>; errors: FieldErrors } {
  const lookup = { media: mediaLookup(media) };
  const values: Record<string, unknown> = {};
  const errors: FieldErrors = {};
  for (const [sectionId, section] of Object.entries(catalog.sections)) {
    const result = readFields(
      section.fields,
      entries,
      lookup,
      sectionId,
      (_key, field) => fieldDefault(field, settings),
      (key) => page.fields?.values[`${sectionId}.${key}`],
    );
    for (const [key, value] of Object.entries(result.values)) values[`${sectionId}.${key}`] = value;
    Object.assign(errors, result.errors);
  }
  return { values, errors };
}

/** Só seção que aceita ser escondida entra na lista: o nome vem do formulário. */
export const hiddenSections = (catalog: CatalogPage, requested: readonly string[]): string[] =>
  requested.filter((id) => catalog.sections[id]?.hideable === true);

async function loadPage(deps: CmsDeps, actor: CmsActor, ref: ItemRef): Promise<Page> {
  if (!can(actor.role, "page", "edit")) throw new AppError("FORBIDDEN");
  const page = await deps.store.readPage(ref.id);
  if (!page) throw new AppError("NOT_FOUND");
  if (page.updatedAt !== ref.expectedUpdatedAt) throw new AppError("CONFLICT");
  return page;
}

export interface PageFieldsRequest {
  entries: FormEntries;
  hidden: readonly string[];
  settings: SiteSettings;
}

/**
 * Salva textos, imagens, ícones e botões das seções fixas. Só o que difere do padrão vai para o banco:
 * voltar ao texto original apaga a linha. Em página publicada, o site muda ao salvar. Devolve se mudou.
 */
export async function savePageFields(
  deps: CmsDeps,
  actor: CmsActor,
  ref: ItemRef,
  { entries, hidden, settings }: PageFieldsRequest,
): Promise<boolean> {
  const page = await loadPage(deps, actor, ref);
  if (!isCatalogSlug(page.slug)) throw new AppError("BAD_REQUEST", { message: "Esta página não tem campos fixos." });
  const check = transition(stateOf(page), "save", {
    role: actor.role,
    resource: "page",
    now: deps.now(),
    validateForPublish: () => [],
  });
  if (!check.ok) throw publicationError(check.error);

  const catalog = PAGE_CATALOG[page.slug] as CatalogPage;
  const media = await deps.store.listMedia();
  const { values, errors } = readPageForm(catalog, entries, media, page, settings);
  if (Object.keys(errors).length) {
    throw new AppError("VALIDATION_FAILED", {
      message: "Revise os campos destacados.",
      fieldErrors: errors,
    });
  }
  const fields = { values: diffFromDefaults(page.slug, values, settings), hidden: hiddenSections(catalog, hidden) };
  if (JSON.stringify(fields) === JSON.stringify(page.fields ?? { values: {}, hidden: [] })) return false;

  await recordBaseline(deps, itemVersion("page", page, "baseline"));
  const saved = await deps.store.update("pages", page.id, { fields }, page.updatedAt);
  await deps.audit({
    event: "content.updated",
    resourceId: page.id,
    outcome: "success",
    metadata: { entity: "page", slug: page.slug, action: "campos", fromStatus: page.status },
  });
  await recordVersion(
    deps,
    itemVersion("page", { ...page, fields, updatedAt: saved.updatedAt }, "updated", { summary: "Textos e imagens" }),
  );
  if (page.status === "published") {
    // Menu, rodapé e modelos aparecem nas páginas de detalhe: elas também precisam ficar prontas.
    const everywhere = catalog.kind !== "rota";
    deps.invalidate({
      entity: "page",
      slug: page.slug,
      ...(everywhere ? { relatedPaths: await livePaths(deps) } : {}),
    });
  }
  return true;
}

/** SEO e compartilhamento de páginas, serviços e cases. Em branco, segue o padrão da rota. */
export async function saveItemSeo<I extends { slug?: string }, T extends CmsItem>(
  deps: CmsDeps,
  actor: CmsActor,
  def: EntityDefinition<I, T>,
  entity: VersionEntity,
  ref: ItemRef,
  input: Omit<SeoFormInput, "ogImage"> & { ogImageId: string },
): Promise<boolean> {
  if (!can(actor.role, def.resource, "edit")) throw new AppError("FORBIDDEN");
  const item = def.list(await deps.store.snapshot()).find((entry) => entry.id === ref.id);
  if (!item) throw new AppError("NOT_FOUND");
  if (item.updatedAt !== ref.expectedUpdatedAt) throw new AppError("CONFLICT");
  const check = transition(stateOf(item), "save", {
    role: actor.role,
    resource: def.resource,
    now: deps.now(),
    validateForPublish: () => [],
  });
  if (!check.ok) throw publicationError(check.error);

  let ogImage: ImageValue | undefined;
  if (input.ogImageId) {
    ogImage = mediaLookup(await deps.store.listMedia())(input.ogImageId);
    if (!ogImage) {
      throw new AppError("VALIDATION_FAILED", {
        fieldErrors: { ogImageId: ["Esta imagem não está mais na biblioteca."] },
      });
    }
  }
  const parsed = seoFromForm({ ...input, ogImage });
  if (!parsed.success) throw new AppError("VALIDATION_FAILED", { fieldErrors: fieldErrorsOf(parsed.error) });
  const seo = compactSeo(parsed.data);
  const current = (item as { seo?: object }).seo ?? {};
  if (JSON.stringify(seo) === JSON.stringify(current)) return false;

  await recordBaseline(deps, itemVersion(entity, item, "baseline"));
  const saved = await deps.store.update(def.table, item.id, { seo }, item.updatedAt);
  await deps.audit({
    event: "content.updated",
    resourceId: item.id,
    outcome: "success",
    metadata: { entity: def.type, slug: item.slug, action: "seo", fromStatus: item.status },
  });
  await recordVersion(
    deps,
    itemVersion(entity, { ...item, seo, updatedAt: saved.updatedAt }, "updated", { summary: "SEO e compartilhamento" }),
  );
  if (item.status === "published") {
    deps.invalidate({ entity: def.type, ...(item.slug ? { slug: item.slug } : {}) });
  }
  return true;
}
