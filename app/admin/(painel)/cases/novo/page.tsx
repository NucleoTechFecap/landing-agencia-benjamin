/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Criação de case no CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-08).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { CaseForm } from "@/components/admin/cms/case-form";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot, loadImageOptions } from "@/lib/server/cms/context";
import { saveCase } from "../actions";

export const metadata: Metadata = { title: "Novo case" };

export default async function NewCasePage({ searchParams }: PageProps<"/admin/cases/novo">) {
  await requirePageAccess("case", "create", "/admin/cases/novo");
  const [snapshot, images, query] = await Promise.all([loadCmsSnapshot(), loadImageOptions(), searchParams]);
  return (
    <>
      <CmsHeader title="Novo case" trail={[{ label: "Cases", href: "/admin/cases" }, { label: "Novo" }]} />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <p className="mb-6 max-w-2xl text-sm text-benja-grafite/80">
        O case nasce como rascunho. Título e endereço bastam para salvar; complete aos poucos enquanto o material da
        Benjamin chega e publique quando a lista de pendências zerar.
      </p>
      <div className="max-w-4xl rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
        <CaseForm
          action={saveCase}
          categories={snapshot.categories}
          services={snapshot.services}
          images={[...images].reverse()}
        />
      </div>
    </>
  );
}
