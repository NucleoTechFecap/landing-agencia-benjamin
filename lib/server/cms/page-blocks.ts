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
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 04/11/2026 Vinícius Nishimura Reis  Falha ao gravar bloco é auditada e expira o cache (TECH-13, #369).
 04/11/2026 Vinícius Nishimura Reis  Foto do time só do bucket de mídia e só imagem (TECH-13, #369).
 12/11/2026 Codex                     Amplia gestão editorial e segurança do painel.
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
  const fields = [
    "title",
    "text",
    "label",
    "href",
    "intro",
    "valueProposition",
    "howWeWork",
    "fecapRelation",
    "imageId",
    "caption",
  ];
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

/**
 * Grava as alterações de um bloco e registra na auditoria. Blocos não têm transação no banco: uma falha
 * no meio de "mover" deixa a ordem parcial. Por isso a falha também é auditada e, em página publicada,
 * expira o cache: o site precisa mostrar o que ficou gravado (TECH-13, #369). A próxima operação
 * renumera a ordem de 0 em diante.
 */
async function applyChange(deps: CmsDeps, page: Page, action: string, type: string, write: () => Promise<unknown>) {
  const audit = (outcome: "success" | "failure") =>
    deps.audit({
      event: "content.updated",
      resourceId: page.id,
      outcome,
      metadata: { entity: "page", slug: page.slug, action, kind: type, fromStatus: page.status },
    });
  const invalidate = () => {
    if (page.status === "published")
      deps.invalidate({
        entity: "page",
        slug: page.slug,
        ...(page.isCustom ? { relatedPaths: [`/paginas/${page.slug}`] } : {}),
      });
  };
  try {
    await write();
  } catch (error) {
    await audit("failure").catch(() => undefined);
    invalidate();
    throw error;
  }
  await audit("success");
  invalidate();
}

/** Foto só vem da biblioteca, nunca do formulário: o bloco guarda endereço e texto alternativo. */
function withPhotos(content: unknown, media: readonly MediaAsset[]): unknown {
  const { members, ...rest } = content as { members: { name: string; role?: string; photoId: string }[] };
  return {
    ...rest,
    members: members.map(({ photoId, ...member }) => {
      if (!photoId) return member;
      const asset = media.find((item) => item.id === photoId);
      if (!asset?.alt || !asset.mimeType.startsWith("image/")) {
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
  let content: unknown = draft;
  if (type === "team") content = withPhotos(draft, await deps.store.listMedia());
  if (type === "image") {
    const { imageId, ...rest } = draft as { imageId?: string; title?: string; caption?: string };
    const asset = (await deps.store.listMedia()).find((item) => item.id === imageId);
    if (!asset?.alt || !asset.mimeType.startsWith("image/"))
      throw new AppError("VALIDATION_FAILED", {
        fieldErrors: { imageId: ["Escolha uma imagem da biblioteca com texto alternativo."] },
      });
    content = { ...rest, image: { id: asset.id, src: asset.src, alt: asset.alt } };
  }
  const parsed = BLOCK_SCHEMAS[type].safeParse(content);
  if (!parsed.success) throw new AppError("VALIDATION_FAILED", { fieldErrors: fieldErrorsOf(parsed.error) });

  await applyChange(deps, page, blockId ? "bloco-editado" : "bloco-criado", type, async () => {
    await touchPage(deps, page);
    if (blockId) await deps.store.updateBlock(blockId, { content: parsed.data });
    else {
      const sortOrder = page.blocks.reduce((highest, block) => Math.max(highest, block.order + 1), 0);
      await deps.store.insertBlock({ page_id: page.id, type, content: parsed.data, sort_order: sortOrder });
    }
  });
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
    await applyChange(deps, page, "bloco-excluido", block.type, async () => {
      await touchPage(deps, page);
      await deps.store.removeBlock(blockId);
    });
    return;
  }

  const target = operation === "subir" ? index - 1 : index + 1;
  if (target < 0 || target >= page.blocks.length) return;
  const reordered = [...page.blocks];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  await applyChange(deps, page, "bloco-movido", block.type, async () => {
    await touchPage(deps, page);
    for (const [position, item] of reordered.entries()) {
      if (item.order !== position) await deps.store.updateBlock(item.id, { sort_order: position });
    }
  });
}
