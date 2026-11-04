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
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-07).
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
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
      <CmsHeader title="Nova área" />
      <p className="mb-6 max-w-2xl text-sm text-studio-suave">
        A área nasce como rascunho e só aparece no site depois de publicada. Nome e endereço bastam para salvar.
      </p>
      <div className="max-w-3xl studio-card p-4 sm:p-6">
        <AreaForm action={saveArea} />
      </div>
    </>
  );
}
