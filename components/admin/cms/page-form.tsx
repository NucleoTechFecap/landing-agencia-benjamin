/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : page-form.tsx
 Descrição    : Formulário dos dados da página do CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 12/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 02/11/2026 Vinícius Nishimura Reis  O site público não exibe mais o selo de provisório.
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
 12/11/2026 Codex                     Amplia gestão editorial e segurança do painel.
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { CheckboxField, TextArea, TextField } from "@/components/forms/fields";
import type { Page } from "@/lib/domain/content/types";
import { CmsFormShell, type CmsSaveAction } from "./form-shell";

/**
 * Dados da página (ADM-05). O endereço vem da rota escolhida e não aparece como campo: em branco
 * na edição, o servidor mantém o atual. Texto novo nasce marcado como provisório: tirar a marca
 * é a decisão de quem confirmou a aprovação da Benjamin.
 */
export function PageForm({
  action,
  page,
  slug,
  defaultTitle,
  custom = false,
  readOnly,
}: {
  action: CmsSaveAction;
  page?: Page;
  slug?: string;
  defaultTitle?: string;
  custom?: boolean;
  readOnly?: boolean;
}) {
  return (
    <CmsFormShell
      action={action}
      item={page ? { id: page.id, updatedAt: page.updatedAt } : undefined}
      readOnly={readOnly}
      cancelHref="/admin/paginas"
      submitLabel={page ? "Salvar alterações" : "Criar rascunho"}
    >
      {({ errors, value }) => (
        <>
          {page?.isCustom || custom ? <input type="hidden" name="isCustom" value="on" /> : null}
          {slug ? <input type="hidden" name="slug" value={slug} /> : null}
          <TextField
            name="title"
            label="Título interno"
            required
            maxLength={120}
            hint="Identifica a página no painel e na API."
            errors={errors("title")}
            defaultValue={value("title", page?.title ?? defaultTitle)}
          />
          {custom && !page ? (
            <TextField
              name="slug"
              label="Endereço da página"
              required
              maxLength={80}
              hint="Letras minúsculas, números e hífens; a página ficará em /paginas/endereco."
              errors={errors("slug")}
              defaultValue={value("slug")}
            />
          ) : null}
          <TextArea
            name="description"
            label="Descrição"
            rows={2}
            maxLength={300}
            errors={errors("description")}
            defaultValue={value("description", page?.description)}
          />
          <CheckboxField name="provisional" defaultChecked={page ? page.provisional : true}>
            Texto provisório: ainda espera a aprovação da Benjamin. O site não mostra nenhum aviso ao visitante, mas o
            go-live fica bloqueado.
          </CheckboxField>
        </>
      )}
    </CmsFormShell>
  );
}
