/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Componentes
 Arquivo      : page-fields-form.tsx
 Descrição    : Formulário dos textos, imagens, ícones e botões das seções fixas de uma página.

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
 04/11/2026 Vinícius Nishimura Reis  Criação inicial (editor do site).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { HIDDEN_SECTIONS_FIELD, type EditorSection } from "@/lib/domain/content/field-editor";
import { FieldEditor, type ImageOption } from "./field-editor";
import { CmsFormShell, type CmsSaveAction } from "./form-shell";

/**
 * Tudo o que tem lugar fixo na página, por seção. Cada seção abre e fecha, porque algumas páginas têm
 * dezenas de campos, e a que tem erro já vem aberta. O formulário grava só o que difere do padrão.
 */
export function PageFieldsForm({
  action,
  page,
  sections,
  images,
  readOnly,
}: {
  action: CmsSaveAction;
  page: { id: string; updatedAt: string };
  sections: readonly EditorSection[];
  images: readonly ImageOption[];
  readOnly?: boolean;
}) {
  return (
    <CmsFormShell
      action={action}
      item={page}
      readOnly={readOnly}
      cancelHref={`/admin/paginas/${page.id}`}
      submitLabel="Salvar textos e imagens"
    >
      {(helpers) => (
        <>
          {sections.map((section, index) => {
            const hasError = section.fields.some((field) => helpers.hasErrors(field.name));
            return (
              <details
                key={section.id}
                open={index === 0 || hasError}
                className="group rounded-studio-md border border-studio-linha"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3 font-extrabold text-benja-verde">
                  <span>{section.label}</span>
                  <span aria-hidden className="text-xs font-bold text-studio-suave group-open:hidden">
                    Abrir
                  </span>
                  <span aria-hidden className="hidden text-xs font-bold text-studio-suave group-open:inline">
                    Fechar
                  </span>
                </summary>
                <div className="space-y-5 border-t border-studio-linha p-4">
                  {section.hint ? <p className="text-sm text-studio-suave">{section.hint}</p> : null}
                  {section.hideable ? (
                    <label className="flex items-start gap-2 text-sm font-semibold">
                      <input
                        type="checkbox"
                        name={HIDDEN_SECTIONS_FIELD}
                        value={section.id}
                        defaultChecked={helpers.values(HIDDEN_SECTIONS_FIELD)?.includes(section.id) ?? section.hidden}
                        className="mt-0.5 size-4"
                      />
                      Esconder esta seção do site (o que está escrito fica guardado)
                    </label>
                  ) : null}
                  <FieldEditor fields={section.fields} images={images} helpers={helpers} />
                </div>
              </details>
            );
          })}
        </>
      )}
    </CmsFormShell>
  );
}
