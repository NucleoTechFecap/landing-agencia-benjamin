/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Criação de serviço no CMS.

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
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-06).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { ServiceForm } from "@/components/admin/cms/service-form";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot, loadImageOptions } from "@/lib/server/cms/context";
import { saveService } from "../actions";

export const metadata: Metadata = { title: "Novo serviço" };

export default async function NewServicePage() {
  await requirePageAccess("service", "create", "/admin/servicos/novo");
  const [snapshot, images] = await Promise.all([loadCmsSnapshot(), loadImageOptions()]);
  return (
    <>
      <CmsHeader title="Novo serviço" trail={[{ label: "Serviços", href: "/admin/servicos" }, { label: "Novo" }]} />
      <p className="mb-6 max-w-2xl text-sm text-benja-grafite/80">
        O serviço nasce como rascunho e só aparece no site depois de publicado. Nome e endereço bastam para salvar.
      </p>
      <div className="max-w-3xl rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
        <ServiceForm action={saveService} areas={snapshot.areas} images={images} />
      </div>
    </>
  );
}
