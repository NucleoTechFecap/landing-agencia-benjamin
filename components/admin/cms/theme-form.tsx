/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Componentes
 Arquivo      : theme-form.tsx
 Descrição    : Aparência do site: cores, fontes e logotipos, com prévia ao vivo e checagem de contraste.

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

import { useState, type CSSProperties } from "react";
import { SelectField } from "@/components/forms/fields";
import {
  AA_CONTRAST,
  DEFAULT_THEME_FONT,
  THEME_COLORS,
  THEME_COLOR_NAMES,
  THEME_FONTS,
  THEME_FONT_NAMES,
  THEME_IMAGES,
  THEME_IMAGE_NAMES,
  contrastProblems,
  type SiteTheme,
  type ThemeColor,
  type ThemeFont,
} from "@/lib/domain/content/theme";
import { FormSection, Notice } from "../ui/primitives";
import type { ImageOption } from "./field-editor";
import { CmsFormShell, type CmsSaveAction } from "./form-shell";
import { MediaPicker } from "./media-picker";

const FONT_OPTIONS = THEME_FONT_NAMES.map((font) => ({ value: font, label: THEME_FONTS[font].label }));
const decimal = (ratio: number) => ratio.toFixed(1).replace(".", ",");
const fontOf = (font: ThemeFont) => `var(${THEME_FONTS[font].cssVar}), sans-serif`;

const defaultColors = () =>
  Object.fromEntries(THEME_COLOR_NAMES.map((name) => [name, THEME_COLORS[name].value])) as Record<ThemeColor, string>;

/** Amostra com as variáveis do tema, só nesta caixa: o painel continua com a identidade dele. */
function ThemePreview({
  colors,
  fontBody,
  fontHeading,
}: {
  colors: Record<ThemeColor, string>;
  fontBody: ThemeFont;
  fontHeading: ThemeFont;
}) {
  const heading: CSSProperties = { fontFamily: fontOf(fontHeading) };
  const button = "inline-block rounded-full border-2 px-4 py-2 text-sm font-bold";
  return (
    <div
      aria-label="Prévia da aparência"
      role="img"
      className="overflow-hidden rounded-studio-md border-2"
      style={{ borderColor: colors.noite, fontFamily: fontOf(fontBody), color: colors.noite }}
    >
      <div style={{ background: colors.verde, color: colors.nyanza }} className="p-5">
        <p className="text-2xl font-black" style={heading}>
          Título em faixa verde
        </p>
        <p className="mt-1 text-sm">Texto sobre o fundo verde.</p>
        <span
          className={`${button} mt-3`}
          style={{ background: colors.lima, color: colors.verde, borderColor: colors.noite }}
        >
          Botão de destaque
        </span>
      </div>
      <div style={{ background: colors.nyanza }} className="p-5">
        <p className="text-xl font-black" style={{ ...heading, color: colors.verde }}>
          Título no fundo principal
        </p>
        <p className="mt-1 text-sm" style={{ color: colors.grafite }}>
          Texto corrido no fundo principal.
        </p>
        <span
          className={`${button} mt-3`}
          style={{ background: colors.verde, color: colors.nyanza, borderColor: colors.noite }}
        >
          Botão principal
        </span>
      </div>
      <div className="grid grid-cols-2 text-xs font-bold sm:grid-cols-4">
        <p className="p-3" style={{ background: colors.laranja, color: colors.noite }}>
          Laranja
        </p>
        <p className="p-3" style={{ background: colors.azul, color: colors.nyanza }}>
          Azul
        </p>
        <p className="p-3" style={{ background: colors.rosa, color: colors.noite }}>
          Rosa
        </p>
        <p className="p-3" style={{ background: colors.creme, color: colors.noite }}>
          Creme
        </p>
      </div>
    </div>
  );
}

/**
 * Salva direto no ar: a aparência não tem rascunho. A prévia e os avisos de contraste acompanham cada
 * mudança; quem barra contraste ilegível é o servidor. Voltar à marca só preenche o formulário: nada
 * muda no site até salvar, e toda versão anterior fica no histórico.
 */
export function ThemeForm({
  action,
  theme,
  updatedAt,
  images,
  readOnly,
}: {
  action: CmsSaveAction;
  theme: SiteTheme;
  updatedAt: string | null;
  images: readonly ImageOption[];
  readOnly?: boolean;
}) {
  const [colors, setColors] = useState({ ...defaultColors(), ...theme.colors } as Record<ThemeColor, string>);
  const [fontBody, setFontBody] = useState<ThemeFont>(theme.fontBody ?? DEFAULT_THEME_FONT);
  const [fontHeading, setFontHeading] = useState<ThemeFont>(theme.fontHeading ?? theme.fontBody ?? DEFAULT_THEME_FONT);
  const [revision, setRevision] = useState(0);
  const [cleared, setCleared] = useState(false);
  const problems = contrastProblems({ colors });
  const selectedImage = (name: (typeof THEME_IMAGE_NAMES)[number]) =>
    cleared ? "" : (images.find((option) => option.src === theme.images?.[name]?.src)?.id ?? "");
  return (
    <CmsFormShell
      action={action}
      item={updatedAt ? { id: "site", updatedAt } : undefined}
      readOnly={readOnly}
      submitLabel="Salvar e publicar a aparência"
    >
      {({ errors, value, markEdited }) => (
        <div key={revision} className="space-y-8">
          <FormSection
            title="Cores"
            description="Valem para o site inteiro. Os ícones e stickers ilustrados são arquivos da marca, com as cores deles."
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
              <ul className="grid gap-3 sm:grid-cols-2">
                {THEME_COLOR_NAMES.map((name) => (
                  <li key={name} className="flex items-start gap-3">
                    <input
                      type="color"
                      id={`cor-${name}`}
                      name={`cor.${name}`}
                      value={colors[name]}
                      disabled={readOnly}
                      onChange={(event) => {
                        const next = event.target.value;
                        setColors((current) => ({ ...current, [name]: next }));
                      }}
                      className="size-11 shrink-0 cursor-pointer rounded-studio-sm border border-studio-controle bg-white p-0.5"
                    />
                    <label htmlFor={`cor-${name}`} className="min-w-0 text-sm">
                      <span className="font-bold">{THEME_COLORS[name].label}</span>
                      <span className="ml-2 font-mono text-xs text-studio-suave">{colors[name]}</span>
                      <span className="block text-xs text-studio-suave">{THEME_COLORS[name].hint}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <ThemePreview colors={colors} fontBody={fontBody} fontHeading={fontHeading} />
            </div>
            <div aria-live="polite" className="space-y-2">
              {problems.length === 0 ? (
                <Notice tone="sucesso">Contraste ok: todas as combinações passam de {decimal(AA_CONTRAST)}:1.</Notice>
              ) : (
                problems.map((problem) => (
                  <Notice key={problem.where} tone={problem.blocking ? "erro" : "atencao"}>
                    <strong>{problem.where}:</strong> {decimal(problem.ratio)}:1.{" "}
                    {problem.blocking
                      ? "Ilegível: o painel não salva abaixo de 3:1."
                      : `Abaixo de ${decimal(AA_CONTRAST)}:1, difícil de ler em texto pequeno.`}
                  </Notice>
                ))
              )}
            </div>
          </FormSection>
          <FormSection
            title="Fontes"
            description="O arquivo fica no próprio site: trocar de fonte não cria pedido a outros serviços."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                name="fontBody"
                label="Fonte do texto"
                required
                options={FONT_OPTIONS}
                errors={errors("fontBody")}
                defaultValue={value("fontBody", fontBody)}
                onValueChange={(next) => setFontBody(next as ThemeFont)}
              />
              <SelectField
                name="fontHeading"
                label="Fonte dos títulos"
                required
                options={FONT_OPTIONS}
                errors={errors("fontHeading")}
                defaultValue={value("fontHeading", fontHeading)}
                onValueChange={(next) => setFontHeading(next as ThemeFont)}
              />
            </div>
          </FormSection>
          <FormSection
            title="Logotipos e imagens"
            description="Em branco, vale o arquivo da marca. Envie em PNG ou WebP, com fundo transparente: a biblioteca não aceita SVG."
          >
            <div className="space-y-6">
              {THEME_IMAGE_NAMES.map((name) => (
                <MediaPicker
                  key={name}
                  name={`imagem.${name}`}
                  label={THEME_IMAGES[name].label}
                  placeholder="Arquivo da marca"
                  hint={THEME_IMAGES[name].hint}
                  images={images}
                  errors={errors(`imagem.${name}`)}
                  defaultValue={value(`imagem.${name}`, selectedImage(name))}
                  uploadHref="/admin/midia"
                  emptyLabel="Arquivo da marca"
                />
              ))}
            </div>
          </FormSection>
          {readOnly ? null : (
            <button
              type="button"
              onClick={() => {
                setColors(defaultColors());
                setFontBody(DEFAULT_THEME_FONT);
                setFontHeading(DEFAULT_THEME_FONT);
                setCleared(true);
                setRevision((current) => current + 1);
                markEdited();
              }}
              className="studio-btn studio-btn-secundario"
            >
              Voltar à identidade da marca
            </button>
          )}
        </div>
      )}
    </CmsFormShell>
  );
}
