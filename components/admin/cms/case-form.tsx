/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : case-form.tsx
 Descrição    : Formulário de criação e edição de case no CMS.

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
 26/10/2026 Vinícius Nishimura Reis  Slug em branco gerado pelo servidor, sem preenchimento no navegador (TECH-12).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Link from "next/link";
import { CheckboxField, SelectField, TextArea, TextField } from "@/components/forms/fields";
import { formatLinkLines } from "@/lib/domain/content/case-input-schema";
import { CASE_LIMITS } from "@/lib/domain/content/case-schema";
import { PUBLICATION_STATUS_LABELS } from "@/lib/domain/content/publication-status";
import type { CaseCategory, CaseStudy, Service } from "@/lib/domain/content/types";
import { CheckboxGroup } from "./checkbox-group";
import { CmsFormShell, type CmsSaveAction } from "./form-shell";
import type { MediaOption } from "./service-form";
import { SlugField } from "./slug-field";

const statusNote = (status: CaseStudy["status"]) =>
  status === "published" ? undefined : PUBLICATION_STATUS_LABELS[status].toLowerCase();

/**
 * Case (ADM-08, campos do CASE-11). Capa e galeria vêm da biblioteca de mídia; o link
 * "Enviar imagem" abre a biblioteca e volta para este case depois do envio.
 */
export function CaseForm({
  action,
  item,
  categories,
  services,
  images,
  readOnly,
}: {
  action: CmsSaveAction;
  item?: CaseStudy;
  categories: CaseCategory[];
  services: Service[];
  images: MediaOption[];
  readOnly?: boolean;
}) {
  const uploadHref = `/admin/midia?voltar=${encodeURIComponent(item ? `/admin/cases/${item.id}` : "/admin/cases/novo")}`;
  return (
    <CmsFormShell
      action={action}
      item={item ? { id: item.id, updatedAt: item.updatedAt } : undefined}
      readOnly={readOnly}
      submitLabel={item ? "Salvar alterações" : "Criar rascunho"}
    >
      {({ errors, value }) => {
        const list = (name: string, saved: string[]) => {
          const typed = value(name);
          return typed !== undefined ? typed.split("\n").filter(Boolean) : saved;
        };
        const typedFeatured = value("featured");
        return (
          <>
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                name="title"
                label="Título"
                required
                maxLength={CASE_LIMITS.title}
                errors={errors("title")}
                defaultValue={value("title", item?.title)}
              />
              <SlugField
                source="título"
                locked={Boolean(item?.publishedAt)}
                errors={errors("slug")}
                defaultValue={value("slug", item?.slug)}
              />
              <TextField
                name="client"
                label="Cliente"
                maxLength={CASE_LIMITS.client}
                hint="Obrigatório para publicar."
                errors={errors("client")}
                defaultValue={value("client", item?.client)}
              />
              <SelectField
                name="categoryId"
                label="Categoria"
                placeholder="Escolha a categoria"
                options={categories
                  .filter((category) => category.status !== "archived")
                  .map((category) => ({
                    value: category.id,
                    label: statusNote(category.status)
                      ? `${category.name} (${statusNote(category.status)})`
                      : category.name,
                  }))}
                hint="Obrigatória para publicar; precisa estar publicada."
                errors={errors("categoryId")}
                defaultValue={value("categoryId", item?.categoryId || undefined)}
              />
              <TextField
                name="deliveryType"
                label="Tipo de entrega"
                maxLength={CASE_LIMITS.deliveryType}
                hint="Ex.: Artigos para blog, Campanha, Release."
                errors={errors("deliveryType")}
                defaultValue={value("deliveryType", item?.deliveryType)}
              />
              <TextField
                name="date"
                label="Mês de referência"
                type="month"
                hint="Não pode estar no futuro."
                errors={errors("date")}
                defaultValue={value("date", item?.date)}
              />
            </div>
            <CheckboxGroup
              name="serviceIds"
              legend="Serviços envolvidos"
              hint="Ao menos um serviço publicado para publicar o case."
              options={services
                .filter((service) => service.status !== "archived")
                .map((service) => ({ value: service.id, label: service.name, note: statusNote(service.status) }))}
              selected={list("serviceIds", item?.serviceIds ?? [])}
              errors={errors("serviceIds")}
            />
            <TextArea
              name="summary"
              label="Resumo"
              rows={3}
              maxLength={CASE_LIMITS.summary.max}
              hint={`De ${CASE_LIMITS.summary.min} a ${CASE_LIMITS.summary.max} caracteres. Aparece no card. Obrigatório para publicar.`}
              errors={errors("summary")}
              defaultValue={value("summary", item?.summary)}
            />
            <TextArea
              name="challenge"
              label="Desafio"
              rows={4}
              errors={errors("challenge")}
              defaultValue={value("challenge", item?.challenge)}
            />
            <TextArea
              name="solution"
              label="Solução"
              rows={4}
              errors={errors("solution")}
              defaultValue={value("solution", item?.solution)}
            />
            <TextArea
              name="results"
              label="Resultados"
              rows={4}
              hint="Só resultados reais e autorizados pela Benjamin e pelo cliente."
              errors={errors("results")}
              defaultValue={value("results", item?.results)}
            />
            <div className="rounded-2xl border-2 border-dashed border-benja-noite/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-bold text-benja-noite">Imagens</p>
                <Link href={uploadHref} className="text-sm font-bold text-benja-verde underline underline-offset-4">
                  Enviar imagem para a biblioteca
                </Link>
              </div>
              <div className="mt-4 space-y-5">
                <SelectField
                  name="coverId"
                  label="Capa"
                  placeholder="Escolha a capa"
                  options={images.map((image) => ({ value: image.id, label: image.label }))}
                  hint="Obrigatória para publicar, com texto alternativo."
                  errors={errors("coverId")}
                  defaultValue={value("coverId", item?.cover?.id)}
                />
                <CheckboxGroup
                  name="galleryIds"
                  legend="Galeria"
                  hint={`Até ${CASE_LIMITS.gallery} imagens, na ordem em que aparecem aqui (ordem de envio).`}
                  options={images.map((image) => ({ value: image.id, label: image.label }))}
                  selected={list("galleryIds", item?.gallery.map((media) => media.id!).filter(Boolean) ?? [])}
                  errors={errors("galleryIds")}
                />
              </div>
            </div>
            <TextArea
              name="externalLinks"
              label="Links externos"
              rows={3}
              hint={`Um por linha: Rótulo | https://endereço (até ${CASE_LIMITS.links}). Ex.: Matéria no jornal | https://…`}
              errors={errors("externalLinks")}
              defaultValue={value("externalLinks", formatLinkLines(item?.externalLinks ?? []))}
            />
            <TextArea
              name="team"
              label="Equipe"
              rows={3}
              hint="Um nome por linha. Só com autorização de quem participou."
              errors={errors("team")}
              defaultValue={value("team", item?.team.join("\n"))}
            />
            <div className="grid gap-5 md:grid-cols-2">
              <TextField
                name="order"
                label="Ordem"
                type="number"
                hint="Menor aparece primeiro."
                errors={errors("order")}
                defaultValue={value("order", String(item?.order ?? 0))}
              />
            </div>
            <CheckboxField
              name="featured"
              defaultChecked={typedFeatured !== undefined ? typedFeatured === "on" : item?.featured}
            >
              Destacar na Home (até 6 cases em destaque)
            </CheckboxField>
          </>
        );
      }}
    </CmsFormShell>
  );
}
