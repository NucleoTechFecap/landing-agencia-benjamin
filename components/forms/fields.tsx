/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : fields.tsx
 Descrição    : Campos acessíveis de formulário (rótulos, erros e dicas) e honeypot.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 13/10/2026
 Modificado em: 13/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 13/10/2026 Vinícius Nishimura Reis  Criação inicial (estrutura da landing).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import type { ReactNode } from "react";

const control =
  "mt-1.5 w-full rounded-2xl border-2 bg-white px-4 py-3 text-base text-benja-noite outline-none transition placeholder:text-benja-grafite/50 focus:border-benja-azul focus:ring-4 focus:ring-benja-azul/20";

function errorId(name: string) {
  return `${name}-erro`;
}

function Label({ name, label, required }: { name: string; label: string; required?: boolean }) {
  return (
    <label htmlFor={name} className="text-sm font-bold text-benja-noite">
      {label}
      {required ? (
        <>
          <span aria-hidden className="text-benja-laranja"> *</span>
          <span className="sr-only"> (obrigatório)</span>
        </>
      ) : (
        <span className="font-normal text-benja-grafite/70"> (opcional)</span>
      )}
    </label>
  );
}

function FieldError({ name, errors }: { name: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={errorId(name)} className="mt-1 text-sm font-semibold text-[#9a2e00]">
      {errors[0]}
    </p>
  );
}

interface BaseProps {
  name: string;
  label: string;
  required?: boolean;
  errors?: string[];
  defaultValue?: string;
  hint?: string;
}

const describedBy = (name: string, errors?: string[], hint?: string) =>
  [errors?.length ? errorId(name) : null, hint ? `${name}-dica` : null].filter(Boolean).join(" ") || undefined;

export function TextField({
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
  ...props
}: BaseProps & { type?: string; autoComplete?: string; inputMode?: "email" | "tel" | "text"; maxLength?: number }) {
  const invalid = Boolean(props.errors?.length);
  return (
    <div>
      <Label name={props.name} label={props.label} required={props.required} />
      <input
        id={props.name}
        name={props.name}
        type={type}
        required={props.required}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        defaultValue={props.defaultValue}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy(props.name, props.errors, props.hint)}
        className={`${control} ${invalid ? "border-[#9a2e00]" : "border-benja-noite"}`}
      />
      {props.hint ? (
        <p id={`${props.name}-dica`} className="mt-1 text-xs text-benja-grafite/80">
          {props.hint}
        </p>
      ) : null}
      <FieldError name={props.name} errors={props.errors} />
    </div>
  );
}

export function TextArea({ rows = 5, maxLength, ...props }: BaseProps & { rows?: number; maxLength?: number }) {
  const invalid = Boolean(props.errors?.length);
  return (
    <div>
      <Label name={props.name} label={props.label} required={props.required} />
      <textarea
        id={props.name}
        name={props.name}
        rows={rows}
        required={props.required}
        maxLength={maxLength}
        defaultValue={props.defaultValue}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy(props.name, props.errors, props.hint)}
        className={`${control} ${invalid ? "border-[#9a2e00]" : "border-benja-noite"}`}
      />
      {props.hint ? (
        <p id={`${props.name}-dica`} className="mt-1 text-xs text-benja-grafite/80">
          {props.hint}
        </p>
      ) : null}
      <FieldError name={props.name} errors={props.errors} />
    </div>
  );
}

export function SelectField({
  options,
  placeholder,
  ...props
}: BaseProps & { options: { value: string; label: string }[]; placeholder?: string }) {
  const invalid = Boolean(props.errors?.length);
  return (
    <div>
      <Label name={props.name} label={props.label} required={props.required} />
      <select
        id={props.name}
        name={props.name}
        required={props.required}
        defaultValue={props.defaultValue ?? ""}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy(props.name, props.errors)}
        className={`${control} ${invalid ? "border-[#9a2e00]" : "border-benja-noite"}`}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError name={props.name} errors={props.errors} />
    </div>
  );
}

export function CheckboxField({
  name,
  children,
  required,
  errors,
  defaultChecked,
}: {
  name: string;
  children: ReactNode;
  required?: boolean;
  errors?: string[];
  defaultChecked?: boolean;
}) {
  const invalid = Boolean(errors?.length);
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          id={name}
          name={name}
          type="checkbox"
          required={required}
          defaultChecked={defaultChecked}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId(name) : undefined}
          className="mt-1 size-5 shrink-0 accent-benja-verde"
        />
        <label htmlFor={name} className="text-sm text-benja-noite">
          {children}
        </label>
      </div>
      <FieldError name={name} errors={errors} />
    </div>
  );
}

/** Campo-isca invisível para pessoas: robôs costumam preenchê-lo (antispam — TECH-07). */
export function HoneypotField() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label htmlFor="website">Não preencha este campo</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
