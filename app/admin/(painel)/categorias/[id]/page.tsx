/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : App
 Arquivo      : page.tsx
 Descrição    : Edição e publicação de categoria de cases no CMS.

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
import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/cms/category-form";
import { CmsHeader } from "@/components/admin/cms/cms-header";
import { CommandBar } from "@/components/admin/cms/command-bar";
import { FlashMessage } from "@/components/admin/cms/flash-message";
import { ItemPanel } from "@/components/admin/cms/item-panel";
import { StatusBadge } from "@/components/admin/cms/status-badge";
import { can } from "@/lib/domain/auth/rbac";
import { allowedCommands } from "@/lib/domain/content/publication";
import { requirePageAccess } from "@/lib/server/auth/guards";
import { publishProblems } from "@/lib/server/cms/content-service";
import { loadCmsSnapshot } from "@/lib/server/cms/context";
import { CATEGORY } from "@/lib/server/cms/entities";
import { categoryCommand, saveCategory } from "../actions";

export const metadata: Metadata = { title: "Editar categoria" };

export default async function EditCategoryPage({ params, searchParams }: PageProps<"/admin/categorias/[id]">) {
  const { id } = await params;
  const user = await requirePageAccess("category", "view", `/admin/categorias/${id}`);
  const [snapshot, query] = await Promise.all([loadCmsSnapshot(), searchParams]);
  const category = snapshot.categories.find((item) => item.id === id);
  if (!category) notFound();
  const cases = snapshot.cases.filter((item) => item.categoryId === category.id);
  return (
    <>
      <CmsHeader
        title={category.name}
        trail={[
          { label: "Cases", href: "/admin/cases" },
          { label: "Categorias", href: "/admin/categorias" },
          { label: category.name },
        ]}
      />
      <FlashMessage ok={query.ok} aviso={query.aviso} />
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="rounded-3xl border-2 border-benja-noite/15 bg-white p-6">
          {category.status === "archived" ? (
            <p className="mb-5 rounded-2xl bg-benja-creme px-4 py-3 text-sm">
              Categoria arquivada: restaure como rascunho para editar.
            </p>
          ) : null}
          <CategoryForm
            action={saveCategory}
            category={category}
            readOnly={!can(user.role, "category", "edit") || category.status === "archived"}
          />
        </div>
        <ItemPanel
          item={category}
          publicHref={CATEGORY.publicPath(category)}
          missing={publishProblems(CATEGORY, category, snapshot, new Date())}
          warnings={[]}
        >
          <CommandBar
            action={categoryCommand}
            id={category.id}
            updatedAt={category.updatedAt}
            commands={allowedCommands(category.status, user.role, "category")}
          />
          <section className="rounded-3xl border-2 border-benja-noite/15 bg-white p-5 text-sm">
            <h2 className="font-bold">Cases nesta categoria</h2>
            {cases.length ? (
              <ul className="mt-2 space-y-2">
                {cases.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/admin/cases/${item.id}`}
                      className="text-benja-verde underline-offset-4 hover:underline"
                    >
                      {item.title}
                    </Link>
                    <StatusBadge status={item.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-benja-grafite/80">Nenhum case ainda.</p>
            )}
          </section>
        </ItemPanel>
      </div>
    </>
  );
}
