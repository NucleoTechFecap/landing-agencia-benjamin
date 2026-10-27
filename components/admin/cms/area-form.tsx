/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : area-form.tsx
 Descrição    : Formulário de criação e edição de área de atuação no CMS.

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

"use client";

import { SelectField, TextArea, TextField } from "@/components/forms/fields";
import { AREA_LIMITS } from "@/lib/domain/content/area-schema";
import { BRAND_ICON_LABELS, BRAND_ICONS } from "@/lib/domain/content/icons";
import type { Area } from "@/lib/domain/content/types";
import { CmsFormShell, type CmsSaveAction } from "./form-shell";
import { SlugField } from "./slug-field";

const ICON_OPTIONS = BRAND_ICONS.map((icon) => ({ value: icon, label: BRAND_ICON_LABELS[icon] }));

/** Campos da área (ADM-07). Slug sugerido a partir do nome e travado depois de publicar. */
export function AreaForm({ action, area, readOnly }: { action: CmsSaveAction; area?: Area; readOnly?: boolean }) {
  const slugLocked = Boolean(area?.publishedAt);
  return (
    <CmsFormShell
      action={action}
      item={area ? { id: area.id, updatedAt: area.updatedAt } : undefined}
      readOnly={readOnly}
      submitLabel={area ? "Salvar alterações" : "Criar rascunho"}
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
              defaultValue={value("name", area?.name)}
            />
            <SlugField locked={slugLocked} errors={errors("slug")} defaultValue={value("slug", area?.slug)} />
          </div>
          <TextArea
            name="summary"
            label="Resumo"
            rows={2}
            maxLength={AREA_LIMITS.summary}
            hint={`Até ${AREA_LIMITS.summary} caracteres. Aparece no card da área. Obrigatório para publicar.`}
            errors={errors("summary")}
            defaultValue={value("summary", area?.summary)}
          />
          <TextArea
            name="description"
            label="Descrição"
            rows={5}
            maxLength={AREA_LIMITS.description}
            hint="Texto completo da área. Obrigatório para publicar."
            errors={errors("description")}
            defaultValue={value("description", area?.description)}
          />
          <TextArea
            name="highlights"
            label="Destaques"
            rows={4}
            hint={`Um por linha, até ${AREA_LIMITS.highlights} (ex.: Instagram, TikTok).`}
            errors={errors("highlights")}
            defaultValue={value("highlights", area?.highlights.join("\n"))}
          />
          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              name="icon"
              label="Ícone"
              placeholder="Sem ícone"
              options={ICON_OPTIONS}
              errors={errors("icon")}
              defaultValue={value("icon", area?.icon)}
            />
            <TextField
              name="order"
              label="Ordem"
              type="number"
              hint="Menor aparece primeiro."
              errors={errors("order")}
              defaultValue={value("order", String(area?.order ?? 0))}
            />
          </div>
        </>
      )}
    </CmsFormShell>
  );
}
