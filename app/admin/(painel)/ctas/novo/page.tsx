/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Criação de CTA no CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 04/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (ADM-11).
──────────────────────────────────────────────────────────────────────────────
*/

import type { Metadata } from "next";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { CtaForm } from "@/components/admin/cms/cta-form";
import { ctaTargetOptions } from "@/lib/domain/content/cta-schema";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { loadCmsSnapshot } from "@/lib/server/cms/context";
import { saveCta } from "../actions";

export const metadata: Metadata = { title: "Novo CTA" };

export default async function NewCtaPage() {
  await requirePageAccess("cta", "create", "/admin/ctas/novo");
  const snapshot = await loadCmsSnapshot();
  return (
    <>
      <CmsHeader title="Novo CTA" trail={[{ label: "CTAs e destaques", href: "/admin/ctas" }, { label: "Novo" }]} />
      <p className="mb-6 max-w-2xl text-sm text-benja-grafite/80">
        O CTA nasce como rascunho e só aparece no site depois de publicado.
      </p>
      <div className="max-w-3xl rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
        <CtaForm action={saveCta} options={ctaTargetOptions(snapshot)} />
      </div>
    </>
  );
}
