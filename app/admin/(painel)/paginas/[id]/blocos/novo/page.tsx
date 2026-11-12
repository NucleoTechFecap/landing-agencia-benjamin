/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Criação de bloco de página no CMS.

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
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
 12/11/2026 Codex                     Amplia gestão editorial e segurança do painel.
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BlockForm } from "@/components/admin/cms/block-form";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { BLOCK_LABELS, blockRestriction, isBlockType } from "@/lib/domain/content/blocks";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot, loadPhotoOptions } from "@/lib/server/cms/context";
import { saveBlockAction } from "../../../actions";

export const metadata: Metadata = { title: "Novo bloco" };

export default async function NewBlockPage({ params, searchParams }: PageProps<"/admin/paginas/[id]/blocos/novo">) {
  const { id } = await params;
  await requirePageAccess("page", "edit", `/admin/paginas/${id}/blocos/novo`);
  const [{ tipo }, snapshot] = await Promise.all([searchParams, loadCmsSnapshot()]);
  const page = snapshot.pages.find((item) => item.id === id);
  if (!page) notFound();
  if (!isBlockType(tipo) || page.status === "archived" || blockRestriction(tipo, page.slug, page.blocks)) {
    redirect(`/admin/paginas/${id}`);
  }
  return (
    <>
      <CmsHeader title={`Novo bloco: ${BLOCK_LABELS[tipo]}`} />
      <div className="max-w-3xl studio-card p-4 sm:p-6">
        <BlockForm
          action={saveBlockAction}
          page={{ id: page.id, updatedAt: page.updatedAt }}
          type={tipo}
          photos={tipo === "team" || tipo === "image" ? await loadPhotoOptions() : []}
        />
      </div>
    </>
  );
}
