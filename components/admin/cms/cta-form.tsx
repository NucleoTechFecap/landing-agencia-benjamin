/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : cta-form.tsx
 Descrição    : Formulário de criação e edição de CTA no CMS, com o destino conforme o tipo escolhido.

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
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useState } from "react";
import { SelectField, TextField } from "@/components/forms/fields";
import {
  CTA_LIMITS,
  CTA_PAGE_LABELS,
  CTA_PLACEMENT_LABELS,
  CTA_PLACEMENTS,
  CTA_PLACEMENTS_ON_SITE,
  CTA_TARGET_KIND_LABELS,
  CTA_TARGET_KINDS,
  ctaFormValues,
  type CtaTargetOptions,
} from "@/lib/domain/content/cta-schema";
import type { Cta } from "@/lib/domain/content/types";
import { CmsFormShell, type CmsSaveAction, type FieldHelpers } from "./form-shell";

const PLACEMENT_OPTIONS = CTA_PLACEMENTS.map((placement) => ({
  value: placement,
  label: CTA_PLACEMENTS_ON_SITE.includes(placement)
    ? CTA_PLACEMENT_LABELS[placement]
    : `${CTA_PLACEMENT_LABELS[placement]} (ainda não aparece no site)`,
}));
const KIND_OPTIONS = CTA_TARGET_KINDS.map((kind) => ({ value: kind, label: CTA_TARGET_KIND_LABELS[kind] }));
const PAGE_OPTIONS = Object.entries(CTA_PAGE_LABELS).map(([value, label]) => ({ value, label }));

/**
 * Campos do destino: só o do tipo escolhido vai no envio, então o servidor nunca recebe sobra de
 * outro tipo. Fica em componente próprio porque o formulário remonta a cada erro (CmsFormShell) e
 * o tipo precisa voltar ao que foi digitado.
 */
function TargetFields({
  fields: { errors, value },
  saved,
  options,
}: {
  fields: FieldHelpers;
  saved?: ReturnType<typeof ctaFormValues>;
  options: CtaTargetOptions;
}) {
  const [kind, setKind] = useState(value("targetKind", saved?.targetKind) ?? "internal");
  const id = value("targetId", saved?.targetId);
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <SelectField
        name="targetKind"
        label="Tipo de destino"
        required
        options={KIND_OPTIONS}
        errors={errors("targetKind")}
        defaultValue={kind}
        onValueChange={setKind}
      />
      {kind === "internal" ? (
        <SelectField
          name="targetPath"
          label="Página"
          required
          placeholder="Escolha a página"
          options={PAGE_OPTIONS}
          errors={errors("targetPath")}
          defaultValue={value("targetPath", saved?.targetPath)}
        />
      ) : null}
      {kind === "external" ? (
        <TextField
          name="targetUrl"
          label="Link"
          required
          type="url"
          maxLength={CTA_LIMITS.url}
          hint="Link completo, começando com https://. Abre em outra aba."
          errors={errors("targetUrl")}
          defaultValue={value("targetUrl", saved?.targetUrl)}
        />
      ) : null}
      {kind === "service" ? (
        <SelectField
          name="targetId"
          label="Serviço"
          required
          placeholder="Escolha o serviço"
          options={options.services}
          hint="Em rascunho, o botão leva à lista de serviços até o serviço ser publicado."
          errors={errors("targetId")}
          defaultValue={id}
        />
      ) : null}
      {kind === "case" ? (
        <SelectField
          name="targetId"
          label="Case"
          required
          placeholder="Escolha o case"
          options={options.cases}
          hint="Em rascunho, o botão leva ao portfólio até o case ser publicado."
          errors={errors("targetId")}
          defaultValue={id}
        />
      ) : null}
      {kind === "area" ? (
        <SelectField
          name="targetId"
          label="Área"
          required
          placeholder="Escolha a área"
          options={options.areas}
          hint="Em rascunho, o botão leva à lista de áreas até a área ser publicada."
          errors={errors("targetId")}
          defaultValue={id}
        />
      ) : null}
      {kind === "contact" ? (
        <SelectField
          name="targetId"
          label="Serviço pré-selecionado"
          placeholder="Nenhum"
          options={options.services}
          hint="Abre o formulário de contato já com este serviço marcado."
          errors={errors("targetId")}
          defaultValue={id}
        />
      ) : null}
    </div>
  );
}

/** Campos do CTA (ADM-11). O destino é sempre escolhido em lista, exceto o link externo. */
export function CtaForm({
  action,
  cta,
  options,
  readOnly,
}: {
  action: CmsSaveAction;
  cta?: Cta;
  options: CtaTargetOptions;
  readOnly?: boolean;
}) {
  const saved = cta ? ctaFormValues(cta) : undefined;
  return (
    <CmsFormShell
      action={action}
      item={cta ? { id: cta.id, updatedAt: cta.updatedAt } : undefined}
      readOnly={readOnly}
      cancelHref="/admin/ctas"
      submitLabel={cta ? "Salvar alterações" : "Criar rascunho"}
    >
      {(fields) => (
        <>
          <TextField
            name="label"
            label="Texto do botão"
            required
            maxLength={CTA_LIMITS.label}
            hint={`De ${CTA_LIMITS.labelMin} a ${CTA_LIMITS.label} caracteres. É o que o visitante lê no botão.`}
            errors={fields.errors("label")}
            defaultValue={fields.value("label", saved?.label)}
          />
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              name="placement"
              label="Posição"
              required
              placeholder="Escolha a posição"
              options={PLACEMENT_OPTIONS}
              errors={fields.errors("placement")}
              defaultValue={fields.value("placement", saved?.placement)}
            />
            <TextField
              name="order"
              label="Ordem"
              type="number"
              hint="Menor aparece primeiro dentro da mesma posição. O primeiro botão ganha o destaque de cor."
              errors={fields.errors("order")}
              defaultValue={fields.value("order", String(saved?.order ?? 0))}
            />
          </div>
          <TargetFields fields={fields} saved={saved} options={options} />
        </>
      )}
    </CmsFormShell>
  );
}
