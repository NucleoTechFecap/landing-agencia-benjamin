/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : service-form.tsx
 Descrição    : Formulário de criação e edição de serviço no CMS.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 29/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-06).
 26/10/2026 Vinícius Nishimura Reis  Atalho para enviar imagem (ADM-08).
 29/10/2026 Vinicius Binda             Endereço editável depois de publicado, com aviso (DB-08).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { CheckboxField, SelectField, TextArea, TextField } from "@/components/forms/fields";
import { PUBLICATION_STATUS_LABELS } from "@/lib/domain/content/publication-status";
import { SERVICE_LIMITS } from "@/lib/domain/content/service-schema";
import { BRAND_ICON_LABELS, BRAND_ICONS } from "@/lib/domain/content/icons";
import type { Area, Service } from "@/lib/domain/content/types";
import { CheckboxGroup } from "./checkbox-group";
import { CmsFormShell, type CmsSaveAction } from "./form-shell";
import { SlugField } from "./slug-field";

const ICON_OPTIONS = BRAND_ICONS.map((icon) => ({ value: icon, label: BRAND_ICON_LABELS[icon] }));

export interface MediaOption {
  id: string;
  label: string;
}

/** Campos do serviço (ADM-06): textos, áreas (N:M), ícone, imagem da biblioteca, destaque e ordem. */
export function ServiceForm({
  action,
  service,
  areas,
  images,
  readOnly,
}: {
  action: CmsSaveAction;
  service?: Service;
  areas: Area[];
  images: MediaOption[];
  readOnly?: boolean;
}) {
  return (
    <CmsFormShell
      action={action}
      item={service ? { id: service.id, updatedAt: service.updatedAt } : undefined}
      readOnly={readOnly}
      submitLabel={service ? "Salvar alterações" : "Criar rascunho"}
    >
      {({ errors, value }) => {
        const typedAreas = value("areaIds");
        const selectedAreas = typedAreas !== undefined ? typedAreas.split("\n") : (service?.areaIds ?? []);
        const typedFeatured = value("featured");
        return (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                name="name"
                label="Nome"
                required
                maxLength={120}
                errors={errors("name")}
                defaultValue={value("name", service?.name)}
              />
              <SlugField
                locked={false}
                redirects={Boolean(service?.publishedAt)}
                errors={errors("slug")}
                defaultValue={value("slug", service?.slug)}
              />
            </div>
            <TextArea
              name="summary"
              label="Resumo"
              rows={2}
              maxLength={SERVICE_LIMITS.summary}
              hint={`Até ${SERVICE_LIMITS.summary} caracteres. Aparece no card do serviço. Obrigatório para publicar.`}
              errors={errors("summary")}
              defaultValue={value("summary", service?.summary)}
            />
            <TextArea
              name="description"
              label="Descrição"
              rows={5}
              maxLength={SERVICE_LIMITS.description}
              hint="Texto da página do serviço. Obrigatório para publicar."
              errors={errors("description")}
              defaultValue={value("description", service?.description)}
            />
            <TextArea
              name="examples"
              label="Exemplos de entregas"
              rows={4}
              hint={`Um por linha, até ${SERVICE_LIMITS.examples}.`}
              errors={errors("examples")}
              defaultValue={value("examples", service?.examples.join("\n"))}
            />
            <CheckboxGroup
              name="areaIds"
              legend="Áreas de atuação"
              hint="Ao menos uma para publicar. Áreas em rascunho não aparecem no site."
              options={areas
                .filter((area) => area.status !== "archived")
                .map((area) => ({
                  value: area.id,
                  label: area.name,
                  note: area.status === "published" ? undefined : PUBLICATION_STATUS_LABELS[area.status].toLowerCase(),
                }))}
              selected={selectedAreas}
              errors={errors("areaIds")}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                name="icon"
                label="Ícone"
                placeholder="Sem ícone"
                options={ICON_OPTIONS}
                errors={errors("icon")}
                defaultValue={value("icon", service?.icon)}
              />
              <SelectField
                name="imageId"
                label="Imagem"
                placeholder="Sem imagem"
                options={images.map((image) => ({ value: image.id, label: image.label }))}
                hint="Da biblioteca de mídia. Precisa de texto alternativo para publicar."
                errors={errors("imageId")}
                defaultValue={value("imageId", service?.image?.id)}
              />
              <TextField
                name="order"
                label="Ordem"
                type="number"
                hint="Menor aparece primeiro."
                errors={errors("order")}
                defaultValue={value("order", String(service?.order ?? 0))}
              />
            </div>
            <p className="-mt-2 text-sm">
              <Link
                href={`/admin/midia?voltar=${encodeURIComponent(service ? `/admin/servicos/${service.id}` : "/admin/servicos/novo")}`}
                className="font-bold text-benja-verde underline underline-offset-4"
              >
                Enviar imagem para a biblioteca
              </Link>
            </p>
            <CheckboxField
              name="featured"
              errors={errors("featured")}
              defaultChecked={typedFeatured !== undefined ? typedFeatured === "on" : service?.featured}
            >
              Destacar na Home (até 6 serviços em destaque)
            </CheckboxField>
          </>
        );
      }}
    </CmsFormShell>
  );
}
