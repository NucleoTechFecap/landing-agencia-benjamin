/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : block-list.tsx
 Descrição    : Lista de blocos da página, com editar, mover e excluir.

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

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { blockSummary } from "@/lib/domain/content/block-input";
import { BLOCK_LABELS, isSectionBlock, type BlockType, type PageBlock } from "@/lib/domain/content/blocks";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import type { Page } from "@/lib/domain/content/types";
import { CmsFormError } from "./form-error";

type BlockAction = (state: CmsFormState, formData: FormData) => Promise<CmsFormState>;

const button =
  "rounded-full border-2 border-benja-noite bg-white px-4 py-1.5 text-xs font-bold text-benja-noite transition hover:bg-benja-creme disabled:cursor-not-allowed disabled:opacity-40";

/** Blocos da página na ordem do site, com editar, mover e excluir, e os tipos que ainda cabem. */
export function BlockList({
  page,
  action,
  addable,
  readOnly,
}: {
  page: Page;
  action: BlockAction;
  addable: BlockType[];
  readOnly: boolean;
}) {
  return (
    <section aria-labelledby="blocos-titulo" className="rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
      <h2 id="blocos-titulo" className="text-xl font-black text-benja-verde">
        Blocos
      </h2>
      {page.blocks.length ? (
        <ol className="mt-4 space-y-3">
          {page.blocks.map((block, index) => (
            <BlockRow
              key={block.id}
              page={page}
              block={block}
              action={action}
              first={index === 0}
              last={index === page.blocks.length - 1}
              readOnly={readOnly}
            />
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-2xl border-2 border-dashed border-benja-noite/25 p-6 text-center text-sm">
          Nenhum bloco ainda. Enquanto não houver conteúdo publicado, o site mostra só as seções fixas.
        </p>
      )}
      {addable.length ? (
        <div className="mt-6">
          <h3 className="text-sm font-bold">Adicionar bloco</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {addable.map((type) => (
              <li key={type}>
                <Link href={`/admin/paginas/${page.id}/blocos/novo?tipo=${type}`} className={`inline-block ${button}`}>
                  {BLOCK_LABELS[type]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function BlockRow({
  page,
  block,
  action,
  first,
  last,
  readOnly,
}: {
  page: Page;
  block: PageBlock;
  action: BlockAction;
  first: boolean;
  last: boolean;
  readOnly: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, CMS_IDLE);
  const label = BLOCK_LABELS[block.type];
  const operation = (name: string, text: string, disabled: boolean, confirm?: string) => (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={page.id} />
      <input type="hidden" name="expectedUpdatedAt" value={page.updatedAt} />
      <input type="hidden" name="blockId" value={block.id} />
      <input type="hidden" name="operation" value={name} />
      <button type="submit" disabled={disabled || pending} className={button}>
        {text}
        <span className="sr-only"> o bloco {label}</span>
      </button>
    </form>
  );
  return (
    <li className="rounded-2xl border-2 border-benja-noite/10 p-4">
      <CmsFormError state={state} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-wider text-benja-grafite/80 uppercase">
            {label}
            {isSectionBlock(block.type) ? " · substitui a seção fixa" : ""}
          </p>
          <p className="mt-1 text-sm break-words">{blockSummary(block)}</p>
        </div>
        {readOnly ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/paginas/${page.id}/blocos/${block.id}`} className={`inline-block ${button}`}>
              Editar<span className="sr-only"> o bloco {label}</span>
            </Link>
            {operation("subir", "Subir", first)}
            {operation("descer", "Descer", last)}
            {operation("excluir", "Excluir", false, "Excluir este bloco? Esta ação não pode ser desfeita.")}
          </div>
        )}
      </div>
    </li>
  );
}
