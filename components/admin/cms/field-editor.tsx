/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Componentes
 Arquivo      : field-editor.tsx
 Descrição    : Editor dos campos do catálogo: texto, link, imagem, ícone, cor e listas, com volta ao padrão.

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
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { SelectField, TextArea, TextField } from "@/components/forms/fields";
import type { EditorField } from "@/lib/domain/content/field-editor";
import {
  IMAGE_DEFAULT,
  IMAGE_KEEP,
  IMAGE_NONE,
  type FieldDef,
  type IconValue,
  type ImageValue,
  type LinkValue,
  type ListFieldDef,
  stableJson,
} from "@/lib/domain/content/fields";
import { BRAND_ICONS, BRAND_ICON_COLORS, BRAND_ICON_COLOR_LABELS, BRAND_ICON_LABELS } from "@/lib/domain/content/icons";
import { SECTION_TONE_LABELS, SECTION_TONE_NAMES } from "@/lib/domain/content/tones";
import { StudioIcon } from "../ui/icons";
import type { FieldHelpers } from "./form-shell";

export interface ImageOption {
  id: string;
  label: string;
  src: string;
}

interface ControlProps {
  name: string;
  def: FieldDef;
  value: unknown;
  /** Padrão do campo; `undefined` quando não há para onde voltar (blocos). */
  base?: unknown;
  images: readonly ImageOption[];
  helpers: FieldHelpers;
}

const same = (a: unknown, b: unknown) => stableJson(a ?? null) === stableJson(b ?? null);

const asLines = (value: unknown) => (Array.isArray(value) ? value.join("\n") : "");

const TONE_OPTIONS = SECTION_TONE_NAMES.map((tone) => ({ value: tone, label: SECTION_TONE_LABELS[tone] }));
const COLOR_OPTIONS = BRAND_ICON_COLORS.map((color) => ({ value: color, label: BRAND_ICON_COLOR_LABELS[color] }));
const ICON_OPTIONS = BRAND_ICONS.map((icon) => ({ value: icon, label: BRAND_ICON_LABELS[icon] }));

/** Bloco com o rótulo de um grupo de controles (link e ícone). */
function Group({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="min-w-0 rounded-studio-md border border-studio-linha p-4">
      <legend className="px-1 text-sm font-bold text-benja-noite">{label}</legend>
      {hint ? <p className="mb-3 text-xs text-studio-suave">{hint}</p> : null}
      {children}
    </fieldset>
  );
}

function LinkControl({ name, def, value, helpers }: ControlProps) {
  const link = value as LinkValue | null;
  const optional = "optional" in def && def.optional === true;
  return (
    <Group label={def.label} hint={def.hint}>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          name={`${name}.label`}
          label="Texto"
          required={!optional}
          maxLength={60}
          errors={helpers.errors(`${name}.label`)}
          defaultValue={helpers.value(`${name}.label`, link?.label ?? "")}
        />
        <TextField
          name={`${name}.href`}
          label="Destino"
          required={!optional}
          maxLength={500}
          hint="Uma página do site (/contato), um link https, mailto: ou tel:."
          errors={helpers.errors(`${name}.href`)}
          defaultValue={helpers.value(`${name}.href`, link?.href ?? "")}
        />
      </div>
    </Group>
  );
}

function IconControl({ name, def, value, helpers }: ControlProps) {
  const icon = value as IconValue | null;
  const optional = "optional" in def && def.optional === true;
  const [selected, setSelected] = useState(helpers.value(`${name}.name`, icon?.name ?? "") ?? "");
  const [color, setColor] = useState(helpers.value(`${name}.color`, icon?.color ?? "verde") ?? "verde");
  return (
    <Group label={def.label} hint={def.hint}>
      <div className="grid gap-4 sm:grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1fr)] sm:items-end">
        <div className="flex size-14 items-center justify-center rounded-studio-md border border-studio-linha bg-studio-realce">
          {selected ? (
            <Image src={`/brand/icons/${selected}-${color}.svg`} alt="" width={40} height={40} unoptimized />
          ) : null}
        </div>
        <SelectField
          name={`${name}.name`}
          label="Ícone"
          required={!optional}
          placeholder={optional ? "Sem ícone" : undefined}
          options={ICON_OPTIONS}
          errors={helpers.errors(`${name}.name`)}
          defaultValue={selected}
          onValueChange={setSelected}
        />
        <SelectField
          name={`${name}.color`}
          label="Cor do ícone"
          required
          options={COLOR_OPTIONS}
          errors={helpers.errors(`${name}.color`)}
          defaultValue={color}
          onValueChange={setColor}
        />
      </div>
    </Group>
  );
}

/** O que o seletor marca hoje: padrão, nenhuma, um arquivo da biblioteca ou a imagem atual, fora da lista. */
function selectedImage(value: ImageValue | null, base: unknown, images: readonly ImageOption[]): string {
  if (value === null) return base === undefined || base === null ? IMAGE_DEFAULT : IMAGE_NONE;
  if (same((base as ImageValue | null)?.src, value.src)) return IMAGE_DEFAULT;
  return images.find((option) => option.src === value.src)?.id ?? IMAGE_KEEP;
}

function ImageControl({ name, def, value, base, images, helpers }: ControlProps) {
  const image = value as ImageValue | null;
  const optional = "optional" in def && def.optional === true;
  const baseImage = (base ?? def.default ?? null) as ImageValue | null;
  const initial = helpers.value(name, selectedImage(image, baseImage, images)) ?? IMAGE_DEFAULT;
  const [selected, setSelected] = useState(initial);
  const shown =
    selected === IMAGE_DEFAULT
      ? baseImage?.src
      : selected === IMAGE_KEEP
        ? image?.src
        : images.find((option) => option.id === selected)?.src;
  const keepable = image && selectedImage(image, baseImage, images) === IMAGE_KEEP;
  const options = [
    ...(keepable ? [{ value: IMAGE_KEEP, label: "Imagem atual (fora da biblioteca)" }] : []),
    ...(optional ? [{ value: IMAGE_NONE, label: "Sem imagem" }] : []),
    ...images.map((option) => ({ value: option.id, label: option.label })),
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-studio-md border border-studio-linha bg-studio-realce">
        {shown ? (
          <Image src={shown} alt="" fill unoptimized sizes="10rem" className="object-contain p-2" />
        ) : (
          <p className="studio-reticula flex h-full items-center justify-center px-3 text-center text-xs font-bold text-studio-suave">
            Sem imagem
          </p>
        )}
      </div>
      <div className="min-w-0">
        <SelectField
          name={name}
          label={def.label}
          required={!optional}
          placeholder={baseImage ? "Imagem padrão" : "Escolha uma imagem"}
          options={options}
          hint={def.hint ?? "Texto alternativo e arquivo vêm da biblioteca."}
          errors={helpers.errors(name)}
          defaultValue={initial}
          onValueChange={setSelected}
        />
        <Link href="/admin/midia" target="_blank" prefetch={false} className="studio-link mt-2 inline-block text-sm">
          Enviar imagem nova<span className="sr-only"> (abre em nova aba)</span>
        </Link>
      </div>
    </div>
  );
}

function ListControl({ name, def, value, images, helpers }: ControlProps & { def: ListFieldDef }) {
  const uid = useId();
  const typedCount = helpers.count(name);
  const saved = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
  const startingRows = typedCount ?? saved.length;
  const [rows, setRows] = useState(() =>
    Array.from({ length: startingRows }, (_, index) => ({ key: `${uid}-${index}`, value: saved[index] ?? {} })),
  );
  const [nextKey, setNextKey] = useState(startingRows);
  const move = (index: number, delta: number) =>
    setRows((current) => {
      const next = [...current];
      const [row] = next.splice(index, 1);
      next.splice(index + delta, 0, row);
      return next;
    });
  const edit = () => helpers.markEdited();
  return (
    <fieldset className="min-w-0 space-y-3">
      <legend className="text-sm font-bold text-benja-noite">{def.label}</legend>
      {def.hint ? <p className="text-xs text-studio-suave">{def.hint}</p> : null}
      {helpers.errors(name)?.length ? (
        <p className="text-sm font-semibold text-benja-erro">{helpers.errors(name)?.[0]}</p>
      ) : null}
      <ol className="space-y-3">
        {rows.map((row, index) => (
          <li key={row.key} className="rounded-studio-md border border-studio-linha bg-studio-papel p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold">
                {def.itemLabel} {index + 1}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => {
                    move(index, -1);
                    edit();
                  }}
                  className="studio-btn studio-btn-sutil"
                >
                  Subir
                  <span className="sr-only">
                    {" "}
                    {def.itemLabel.toLowerCase()} {index + 1}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={index === rows.length - 1}
                  onClick={() => {
                    move(index, 1);
                    edit();
                  }}
                  className="studio-btn studio-btn-sutil"
                >
                  Descer
                  <span className="sr-only">
                    {" "}
                    {def.itemLabel.toLowerCase()} {index + 1}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={rows.length <= def.minItems}
                  onClick={() => {
                    setRows((current) => current.filter((item) => item.key !== row.key));
                    edit();
                  }}
                  className="studio-btn studio-btn-sutil"
                >
                  Remover
                  <span className="sr-only">
                    {" "}
                    {def.itemLabel.toLowerCase()} {index + 1}
                  </span>
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {Object.entries(def.item).map(([key, item]) => (
                <FieldControl
                  key={key}
                  name={`${name}.${index}.${key}`}
                  def={item}
                  value={row.value[key] ?? item.default}
                  images={images}
                  helpers={helpers}
                />
              ))}
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        disabled={rows.length >= def.maxItems}
        onClick={() => {
          setRows((current) => [...current, { key: `${uid}-${nextKey}`, value: {} }]);
          setNextKey((key) => key + 1);
          edit();
        }}
        className="studio-btn studio-btn-secundario"
      >
        <StudioIcon name="mais" size={18} />
        Adicionar {def.itemLabel.toLowerCase()}
      </button>
    </fieldset>
  );
}

function FieldControl(props: ControlProps) {
  const { name, def, value, helpers } = props;
  switch (def.kind) {
    case "text":
      return def.rows ? (
        <TextArea
          name={name}
          label={def.label}
          required={!def.optional}
          rows={def.rows}
          maxLength={def.max}
          hint={def.hint}
          errors={helpers.errors(name)}
          defaultValue={helpers.value(name, String(value ?? ""))}
        />
      ) : (
        <TextField
          name={name}
          label={def.label}
          required={!def.optional}
          maxLength={def.max}
          hint={def.hint}
          errors={helpers.errors(name)}
          defaultValue={helpers.value(name, String(value ?? ""))}
        />
      );
    case "lines":
      return (
        <TextArea
          name={name}
          label={def.label}
          required={!def.optional}
          rows={def.rows ?? 6}
          hint={def.hint ?? `Um item por linha, até ${def.maxItems}.`}
          errors={helpers.errors(name)}
          defaultValue={helpers.value(name, asLines(value))}
        />
      );
    case "link":
      return <LinkControl {...props} />;
    case "image":
      return <ImageControl {...props} />;
    case "icon":
      return <IconControl {...props} />;
    case "tone":
      return (
        <SelectField
          name={name}
          label={def.label}
          required
          options={TONE_OPTIONS}
          hint={def.hint}
          errors={helpers.errors(name)}
          defaultValue={helpers.value(name, String(value ?? def.default))}
        />
      );
    case "choice":
      return (
        <SelectField
          name={name}
          label={def.label}
          required
          options={def.options.map((option) => ({ value: option.value, label: option.label }))}
          hint={def.hint}
          errors={helpers.errors(name)}
          defaultValue={helpers.value(name, String(value ?? def.default))}
        />
      );
    case "list":
      return <ListControl {...props} def={def} />;
  }
}

/**
 * Um campo com a volta ao padrão. Os controles não são controlados: remontar com o valor original é o
 * jeito mais simples de trocar o conteúdo sem reescrever cada um, e a alteração conta como não salva.
 */
function FieldWithReset({
  field,
  images,
  helpers,
}: {
  field: EditorField;
  images: readonly ImageOption[];
  helpers: FieldHelpers;
}) {
  const [state, setState] = useState({ value: field.value, revision: 0, reset: false });
  const changed = field.base !== undefined && !same(state.value, field.base);
  const scoped: FieldHelpers = state.reset
    ? { ...helpers, value: (_name, saved) => saved, count: () => undefined, errors: () => undefined }
    : helpers;
  return (
    <div>
      <FieldControl
        key={state.revision}
        name={field.name}
        def={field.def}
        value={state.value}
        base={field.base}
        images={images}
        helpers={scoped}
      />
      {changed ? (
        <button
          type="button"
          onClick={() => {
            setState((current) => ({ value: field.base, revision: current.revision + 1, reset: true }));
            helpers.markEdited();
          }}
          className="mt-1 text-xs font-bold text-benja-azul underline underline-offset-2"
        >
          Voltar ao texto original<span className="sr-only">: {field.def.label}</span>
        </button>
      ) : null}
    </div>
  );
}

/** Lista de campos de uma seção ou de um bloco. */
export function FieldEditor({
  fields,
  images,
  helpers,
}: {
  fields: readonly EditorField[];
  images: readonly ImageOption[];
  helpers: FieldHelpers;
}) {
  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <FieldWithReset key={field.name} field={field} images={images} helpers={helpers} />
      ))}
    </div>
  );
}
