/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Criação de categoria de cases no CMS.

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
import { CategoryForm } from "@/components/admin/cms/category-form";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { saveCategory } from "../actions";

export const metadata: Metadata = { title: "Nova categoria" };

export default async function NewCategoryPage() {
  await requirePageAccess("category", "create", "/admin/categorias/nova");
  return (
    <>
      <CmsHeader
        title="Nova categoria"
        trail={[
          { label: "Cases", href: "/admin/cases" },
          { label: "Categorias", href: "/admin/categorias" },
          { label: "Nova" },
        ]}
      />
      <div className="max-w-3xl rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
        <CategoryForm action={saveCategory} />
      </div>
    </>
  );
}
