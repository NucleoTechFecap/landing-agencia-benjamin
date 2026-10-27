/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Criação de área de atuação no CMS.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { AreaForm } from "@/components/admin/cms/area-form";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { saveArea } from "../actions";

export const metadata: Metadata = { title: "Nova área" };

export default async function NewAreaPage() {
  await requirePageAccess("area", "create", "/admin/areas/nova");
  return (
    <>
      <CmsHeader title="Nova área" trail={[{ label: "Áreas", href: "/admin/areas" }, { label: "Nova" }]} />
      <p className="mb-6 max-w-2xl text-sm text-benja-grafite/80">
        A área nasce como rascunho e só aparece no site depois de publicada. Nome e endereço bastam para salvar.
      </p>
      <div className="max-w-3xl rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
        <AreaForm action={saveArea} />
      </div>
    </>
  );
}
