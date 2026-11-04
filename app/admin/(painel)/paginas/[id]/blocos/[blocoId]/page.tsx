/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Edição de bloco de página no CMS.

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
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { BlockForm } from "@/components/admin/cms/block-form";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { BLOCK_LABELS } from "@/lib/domain/content/blocks";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot, loadPhotoOptions } from "@/lib/server/cms/context";
import { saveBlockAction } from "../../../actions";

export const metadata: Metadata = { title: "Editar bloco" };

export default async function EditBlockPage({ params }: PageProps<"/admin/paginas/[id]/blocos/[blocoId]">) {
  const { id, blocoId } = await params;
  await requirePageAccess("page", "edit", `/admin/paginas/${id}/blocos/${blocoId}`);
  const snapshot = await loadCmsSnapshot();
  const page = snapshot.pages.find((item) => item.id === id);
  const block = page?.blocks.find((item) => item.id === blocoId);
  if (!page || !block) notFound();
  if (page.status === "archived") redirect(`/admin/paginas/${id}`);
  return (
    <>
      <CmsHeader
        title={`Editar bloco: ${BLOCK_LABELS[block.type]}`}
        trail={[
          { label: "Páginas e textos", href: "/admin/paginas" },
          { label: page.title, href: `/admin/paginas/${id}` },
          { label: "Editar bloco" },
        ]}
      />
      <div className="max-w-3xl rounded-3xl border-2 border-benja-noite/15 bg-white p-4 sm:p-6">
        <BlockForm
          action={saveBlockAction}
          page={{ id: page.id, updatedAt: page.updatedAt }}
          type={block.type}
          block={block}
          photos={block.type === "team" ? await loadPhotoOptions() : []}
        />
      </div>
    </>
  );
}
