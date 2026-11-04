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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { blockSummary } from "@/lib/domain/content/block-input";
import { BLOCK_LABELS, isSectionBlock, type BlockType, type PageBlock } from "@/lib/domain/content/blocks";
import { CMS_IDLE, type CmsFormState } from "@/lib/domain/content/cms-form";
import type { Page } from "@/lib/domain/content/types";
import { ConfirmForm, useHydrated, type Confirmation } from "../ui/confirm-form";
import { EmptyPanel } from "../ui/primitives";
import { CmsFormError } from "./form-error";

type BlockAction = (state: CmsFormState, formData: FormData) => Promise<CmsFormState>;

const button = "studio-btn studio-btn-secundario";

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
    <section aria-labelledby="blocos-titulo" className="studio-card p-4 sm:p-6">
      <h2 id="blocos-titulo" className="studio-titulo-secao">
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
        <div className="mt-4">
          <EmptyPanel title="Nenhum bloco ainda.">
            Enquanto não houver conteúdo publicado, o site mostra só as seções fixas.
          </EmptyPanel>
        </div>
      )}
      {addable.length ? (
        <div className="mt-6">
          <h3 className="text-sm font-bold">Adicionar bloco</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {addable.map((type) => (
              <li key={type}>
                <Link href={`/admin/paginas/${page.id}/blocos/novo?tipo=${type}`} className={button}>
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
  const ready = useHydrated();
  const label = BLOCK_LABELS[block.type];
  const operation = (name: string, text: string, disabled: boolean, confirmation?: Confirmation) => (
    <ConfirmForm action={formAction} confirmation={confirmation}>
      <input type="hidden" name="id" value={page.id} />
      <input type="hidden" name="expectedUpdatedAt" value={page.updatedAt} />
      <input type="hidden" name="blockId" value={block.id} />
      <input type="hidden" name="operation" value={name} />
      <button type="submit" disabled={disabled || pending || !ready} className={button}>
        {text}
        <span className="sr-only"> o bloco {label}</span>
      </button>
    </ConfirmForm>
  );
  return (
    <li className="rounded-studio-md border border-studio-linha p-4">
      <CmsFormError state={state} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="studio-rotulo">
            {label}
            {isSectionBlock(block.type) ? " · substitui a seção fixa" : ""}
          </p>
          <p className="mt-1 text-sm wrap-anywhere">{blockSummary(block)}</p>
        </div>
        {readOnly ? null : (
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/admin/paginas/${page.id}/blocos/${block.id}`} className={button}>
              Editar<span className="sr-only"> o bloco {label}</span>
            </Link>
            {operation("subir", "Subir", first)}
            {operation("descer", "Descer", last)}
            {operation("excluir", "Excluir", false, {
              title: "Excluir este bloco?",
              message: "Esta ação não pode ser desfeita.",
              confirmLabel: "Excluir bloco",
            })}
          </div>
        )}
      </div>
    </li>
  );
}
