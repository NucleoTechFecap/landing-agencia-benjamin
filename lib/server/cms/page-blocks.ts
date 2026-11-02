/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Lib
 Arquivo      : page-blocks.ts
 Descrição    : Gravação, ordem e exclusão dos blocos de uma página do CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 01/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
──────────────────────────────────────────────────────────────────────────────
*/

import "server-only";
import { can } from "@/lib/domain/auth/rbac";
import { blockContentFromForm, type BlockFormInput } from "@/lib/domain/content/block-input";
import { BLOCK_SCHEMAS, blockRestriction, isBlockType, type PageBlock } from "@/lib/domain/content/blocks";
import { fieldErrorsOf } from "@/lib/domain/content/cms-schema";
import { transition } from "@/lib/domain/content/publication";
import type { Page } from "@/lib/domain/content/types";
import { AppError } from "../errors";
import { publicationError, stateOf, type CmsActor, type CmsDeps, type ItemRef } from "./content-service";
import { PAGE } from "./entities";
import { lines, text } from "./form-data";
import type { MediaAsset } from "./store";

export type BlockOperation = "subir" | "descer" | "excluir";

export const isBlockOperation = (value: string): value is BlockOperation =>
  value === "subir" || value === "descer" || value === "excluir";

/** Campos do formulário de bloco. As listas de pessoas chegam alinhadas, na ordem da tela. */
export function blockInputFromForm(form: FormData): BlockFormInput {
  const repeated = (name: string) => form.getAll(name).map((value) => (typeof value === "string" ? value : ""));
  const roles = repeated("memberRole");
  const photos = repeated("memberPhoto");
  const fields = ["title", "text", "label", "href", "intro", "valueProposition", "howWeWork", "fecapRelation"];
  return {
    fields: Object.fromEntries(fields.map((name) => [name, text(form, name)])),
    paragraphs: lines(form, "paragraphs"),
    items: lines(form, "items"),
    members: repeated("memberName").map((name, index) => ({
      name,
      role: roles[index] ?? "",
      photoId: photos[index] ?? "",
    })),
  };
}

/**
 * Página a alterar: confere papel, existência e versão, e aplica a regra de edição (arquivada
 * não muda; publicada continua completa). Não há versão por bloco: `updated_at` da página vale
 * para ela e para seus blocos, então quem abriu a tela antes recebe CONFLICT.
 */
async function loadForChange(
  deps: CmsDeps,
  actor: CmsActor,
  ref: ItemRef,
  blocksAfter: (page: Page) => readonly PageBlock[],
): Promise<Page> {
  if (!can(actor.role, "page", "edit")) throw new AppError("FORBIDDEN");
  const page = (await deps.store.snapshot()).pages.find((item) => item.id === ref.id);
  if (!page) throw new AppError("NOT_FOUND");
  if (page.updatedAt !== ref.expectedUpdatedAt) throw new AppError("CONFLICT");
  const check = transition(stateOf(page), "save", {
    role: actor.role,
    resource: "page",
    now: deps.now(),
    validateForPublish: () => PAGE.validateForPublish({ ...page, blocks: [...blocksAfter(page)] }),
  });
  if (!check.ok) throw publicationError(check.error);
  return page;
}

/** Avança a versão da página (o gatilho do banco renova `updated_at`) e barra quem chegou tarde. */
const touchPage = (deps: CmsDeps, page: Page) =>
  deps.store.update("pages", page.id, { title: page.title }, page.updatedAt);

async function afterChange(deps: CmsDeps, page: Page, action: string, type: string) {
  await deps.audit({
    event: "content.updated",
    resourceId: page.id,
    outcome: "success",
    metadata: { entity: "page", slug: page.slug, action, kind: type, fromStatus: page.status },
  });
  if (page.status === "published") deps.invalidate({ entity: "page", slug: page.slug });
}

/** Foto só vem da biblioteca, nunca do formulário: o bloco guarda endereço e texto alternativo. */
function withPhotos(content: unknown, media: readonly MediaAsset[]): unknown {
  const { members, ...rest } = content as { members: { name: string; role?: string; photoId: string }[] };
  return {
    ...rest,
    members: members.map(({ photoId, ...member }) => {
      if (!photoId) return member;
      const asset = media.find((item) => item.id === photoId);
      if (!asset?.alt) {
        throw new AppError("VALIDATION_FAILED", {
          fieldErrors: { members: [`Escolha para ${member.name || "esta pessoa"} uma foto com texto alternativo.`] },
        });
      }
      return { ...member, photo: { src: asset.src, alt: asset.alt } };
    }),
  };
}

export interface SaveBlockRequest {
  blockId?: string;
  type: string;
  input: BlockFormInput;
}

/** Cria ou edita um bloco. Em página publicada, o site muda ao salvar. */
export async function saveBlock(deps: CmsDeps, actor: CmsActor, ref: ItemRef, request: SaveBlockRequest) {
  const { blockId, type, input } = request;
  if (!isBlockType(type)) throw new AppError("BAD_REQUEST", { message: "Tipo de bloco desconhecido." });
  const page = await loadForChange(deps, actor, ref, (current) => current.blocks);

  const current = blockId ? page.blocks.find((block) => block.id === blockId) : undefined;
  if (blockId && current?.type !== type) throw new AppError("NOT_FOUND");
  const restriction = blockId ? null : blockRestriction(type, page.slug, page.blocks);
  if (restriction) throw new AppError("VALIDATION_FAILED", { message: restriction });

  const draft = blockContentFromForm(type, input);
  const content = type === "team" ? withPhotos(draft, await deps.store.listMedia()) : draft;
  const parsed = BLOCK_SCHEMAS[type].safeParse(content);
  if (!parsed.success) throw new AppError("VALIDATION_FAILED", { fieldErrors: fieldErrorsOf(parsed.error) });

  await touchPage(deps, page);
  if (blockId) await deps.store.updateBlock(blockId, { content: parsed.data });
  else {
    const sortOrder = page.blocks.reduce((highest, block) => Math.max(highest, block.order + 1), 0);
    await deps.store.insertBlock({ page_id: page.id, type, content: parsed.data, sort_order: sortOrder });
  }
  await afterChange(deps, page, blockId ? "bloco-editado" : "bloco-criado", type);
}

/** Sobe, desce ou exclui um bloco. A ordem é renumerada de 0 em diante, corrigindo empates. */
export async function changeBlock(
  deps: CmsDeps,
  actor: CmsActor,
  ref: ItemRef,
  blockId: string,
  operation: BlockOperation,
) {
  const page = await loadForChange(deps, actor, ref, (current) =>
    operation === "excluir" ? current.blocks.filter((block) => block.id !== blockId) : current.blocks,
  );
  const index = page.blocks.findIndex((block) => block.id === blockId);
  if (index < 0) throw new AppError("NOT_FOUND");
  const block = page.blocks[index];

  if (operation === "excluir") {
    await touchPage(deps, page);
    await deps.store.removeBlock(blockId);
    await afterChange(deps, page, "bloco-excluido", block.type);
    return;
  }

  const target = operation === "subir" ? index - 1 : index + 1;
  if (target < 0 || target >= page.blocks.length) return;
  const reordered = [...page.blocks];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  await touchPage(deps, page);
  for (const [position, item] of reordered.entries()) {
    if (item.order !== position) await deps.store.updateBlock(item.id, { sort_order: position });
  }
  await afterChange(deps, page, "bloco-movido", block.type);
}
