/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Componentes
 Arquivo      : seo-form.tsx
 Descrição    : SEO e compartilhamento de uma página, com prévia do resultado de busca e do cartão social.

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

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { CheckboxField, TextArea, TextField } from "@/components/forms/fields";
import { SEO_RECOMMENDED, effectiveSeo, type SeoData } from "@/lib/domain/content/seo-schema";
import type { ImageOption } from "./field-editor";
import { CmsFormShell, type CmsSaveAction } from "./form-shell";
import { MediaPicker } from "./media-picker";
import { FormSection } from "../ui/primitives";

/** Contagem de caracteres com o limite que os buscadores costumam mostrar. */
function Counter({ size, limit }: { size: number; limit: number }) {
  const over = size > limit;
  return (
    <p className={`mt-1 text-xs ${over ? "font-bold text-benja-laranja-texto" : "text-studio-suave"}`}>
      {size} de {limit} caracteres{over ? ": o buscador pode cortar o final" : ""}.
    </p>
  );
}

/** Domínio sem protocolo, como aparece no resultado de busca. */
const hostOf = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

/**
 * Tudo em branco segue o padrão da página, mostrado nas prévias. As prévias acompanham a digitação; o
 * que vai ao ar é o que o servidor valida ao salvar.
 */
export function SeoForm({
  action,
  item,
  seo,
  base,
  path,
  siteUrl,
  images,
  defaultImageSrc,
  readOnly,
  cancelHref,
}: {
  action: CmsSaveAction;
  item: { id: string; updatedAt: string };
  seo: SeoData;
  base: { title: string; description: string };
  /** Endereço público; `null` quando a página não tem rota. */
  path: string | null;
  siteUrl: string;
  images: readonly ImageOption[];
  defaultImageSrc: string;
  readOnly?: boolean;
  cancelHref: string;
}) {
  const [live, setLive] = useState({
    title: seo.title ?? "",
    description: seo.description ?? "",
    ogTitle: seo.ogTitle ?? "",
    ogDescription: seo.ogDescription ?? "",
    ogImageId: images.find((option) => option.src === seo.ogImage?.src)?.id ?? "",
  });
  const onInput = (event: FormEvent<HTMLDivElement>) => {
    const { name, value } = event.target as HTMLInputElement;
    if (name in live) setLive((current) => ({ ...current, [name]: value }));
  };
  const preview = effectiveSeo(base, {
    title: live.title || undefined,
    description: live.description || undefined,
    ogTitle: live.ogTitle || undefined,
    ogDescription: live.ogDescription || undefined,
  });
  const image = images.find((option) => option.id === live.ogImageId)?.src ?? defaultImageSrc;
  const address = `${hostOf(siteUrl)}${path ?? ""}`;
  return (
    <CmsFormShell
      action={action}
      item={item}
      readOnly={readOnly}
      cancelHref={cancelHref}
      submitLabel="Salvar SEO e compartilhamento"
    >
      {({ errors, value }) => (
        <div onInput={onInput} onChange={onInput} className="space-y-6">
          <FormSection title="Como aparece nos buscadores" description="Em branco, vale o padrão da página.">
            <div
              className="rounded-studio-md border border-studio-linha bg-white p-4"
              aria-label="Prévia do resultado de busca"
            >
              <p className="text-xs text-studio-suave wrap-anywhere">{address}</p>
              <p className="mt-1 text-lg leading-snug font-semibold wrap-anywhere text-benja-azul">{preview.title}</p>
              <p className="mt-1 text-sm wrap-anywhere text-studio-suave">{preview.description}</p>
            </div>
            <div>
              <TextField
                name="title"
                label="Título para buscadores"
                maxLength={120}
                errors={errors("title")}
                defaultValue={value("title", seo.title ?? "")}
              />
              <Counter size={preview.title.length} limit={SEO_RECOMMENDED.title} />
            </div>
            <div>
              <TextArea
                name="description"
                label="Descrição para buscadores"
                rows={3}
                maxLength={300}
                errors={errors("description")}
                defaultValue={value("description", seo.description ?? "")}
              />
              <Counter size={preview.description.length} limit={SEO_RECOMMENDED.description} />
            </div>
            <TextField
              name="keywords"
              label="Palavras-chave"
              hint="Separadas por vírgula."
              errors={errors("keywords")}
              defaultValue={value("keywords", seo.keywords?.join(", ") ?? "")}
            />
            <CheckboxField name="noindex" defaultChecked={seo.noindex ?? false}>
              Pedir aos buscadores para não listar esta página. Ela também sai do sitemap.
            </CheckboxField>
          </FormSection>
          <FormSection
            title="Como aparece ao compartilhar"
            description="Cartão mostrado no WhatsApp, LinkedIn, Instagram e outras redes (Open Graph)."
          >
            <div
              className="max-w-md overflow-hidden rounded-studio-md border border-studio-linha bg-white"
              aria-label="Prévia do cartão de compartilhamento"
            >
              <div className="relative aspect-[1200/630] bg-studio-realce">
                <Image src={image} alt="" fill unoptimized sizes="28rem" className="object-cover" />
              </div>
              <div className="p-3">
                <p className="text-xs text-studio-suave uppercase">{hostOf(siteUrl)}</p>
                <p className="font-bold wrap-anywhere">{preview.ogTitle}</p>
                <p className="mt-0.5 text-sm wrap-anywhere text-studio-suave">{preview.ogDescription}</p>
              </div>
            </div>
            <TextField
              name="ogTitle"
              label="Título ao compartilhar"
              maxLength={120}
              errors={errors("ogTitle")}
              defaultValue={value("ogTitle", seo.ogTitle ?? "")}
            />
            <TextArea
              name="ogDescription"
              label="Descrição ao compartilhar"
              rows={2}
              maxLength={300}
              errors={errors("ogDescription")}
              defaultValue={value("ogDescription", seo.ogDescription ?? "")}
            />
            <MediaPicker
              name="ogImageId"
              label="Imagem ao compartilhar (Open Graph)"
              placeholder="Imagem padrão do site"
              hint="Use 1200 × 630 px, em JPG ou PNG."
              images={images}
              errors={errors("ogImageId")}
              defaultValue={value("ogImageId", images.find((option) => option.src === seo.ogImage?.src)?.id ?? "")}
              uploadHref="/admin/midia"
              emptyLabel="Imagem padrão do site"
            />
          </FormSection>
        </div>
      )}
    </CmsFormShell>
  );
}
