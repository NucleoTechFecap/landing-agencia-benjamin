/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : category-form.tsx
 Descrição    : Formulário de criação e edição de categoria de cases no CMS.

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

"use client";

import { TextArea, TextField } from "@/components/forms/fields";
import type { CaseCategory } from "@/lib/domain/content/types";
import { CmsFormShell, type CmsSaveAction } from "./form-shell";
import { SlugField } from "./slug-field";

/** Categoria do portfólio (ADM-08): nome e endereço bastam para publicar. */
export function CategoryForm({
  action,
  category,
  readOnly,
}: {
  action: CmsSaveAction;
  category?: CaseCategory;
  readOnly?: boolean;
}) {
  return (
    <CmsFormShell
      action={action}
      item={category ? { id: category.id, updatedAt: category.updatedAt } : undefined}
      readOnly={readOnly}
      submitLabel={category ? "Salvar alterações" : "Criar rascunho"}
    >
      {({ errors, value }) => (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            <TextField
              name="name"
              label="Nome"
              required
              maxLength={120}
              errors={errors("name")}
              defaultValue={value("name", category?.name)}
            />
            <SlugField
              locked={Boolean(category?.publishedAt)}
              errors={errors("slug")}
              defaultValue={value("slug", category?.slug)}
            />
          </div>
          <TextArea
            name="description"
            label="Descrição"
            rows={3}
            hint="Explica que tipo de trabalho entra nesta categoria."
            errors={errors("description")}
            defaultValue={value("description", category?.description)}
          />
          <TextField
            name="order"
            label="Ordem"
            type="number"
            hint="Menor aparece primeiro nos filtros."
            errors={errors("order")}
            defaultValue={value("order", String(category?.order ?? 0))}
          />
        </>
      )}
    </CmsFormShell>
  );
}
