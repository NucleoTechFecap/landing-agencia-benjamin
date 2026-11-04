/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : checkbox-group.tsx
 Descrição    : Grupo de checkboxes do CMS para vínculos N:M (ex.: áreas do serviço).

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 26/10/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-06).
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import Image from "next/image";

export interface CheckboxOption {
  value: string;
  label: string;
  /** Observação curta ao lado do rótulo (ex.: "rascunho"). */
  note?: string;
  /** Miniatura da opção (galeria de imagens). */
  imageSrc?: string;
}

/** Vários valores com o mesmo `name`; o servidor lê com `form.getAll(name)`. */
export function CheckboxGroup({
  name,
  legend,
  options,
  selected,
  errors,
  hint,
}: {
  name: string;
  legend: string;
  options: CheckboxOption[];
  selected: readonly string[];
  errors?: string[];
  hint?: string;
}) {
  const errorId = `${name}-erro`;
  return (
    <fieldset aria-describedby={errors?.length ? errorId : undefined} className="min-w-0">
      <legend className="text-sm font-bold text-benja-noite">{legend}</legend>
      {hint ? <p className="mt-1 text-xs text-studio-suave">{hint}</p> : null}
      {options.length ? (
        <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <li key={option.value}>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-studio-md border border-studio-controle bg-white px-3 py-2 text-sm transition duration-150 ease-studio hover:border-benja-verde has-[:checked]:border-benja-verde has-[:checked]:bg-benja-sucesso-fundo">
                <input
                  type="checkbox"
                  name={name}
                  value={option.value}
                  defaultChecked={selected.includes(option.value)}
                  className="size-5 shrink-0 accent-benja-verde"
                />
                {option.imageSrc ? (
                  <Image
                    src={option.imageSrc}
                    alt=""
                    width={56}
                    height={40}
                    unoptimized
                    className="h-10 w-14 shrink-0 rounded-studio-sm bg-studio-realce object-cover"
                  />
                ) : null}
                <span className="min-w-0 wrap-anywhere">
                  {option.label}
                  {option.note ? <span className="text-studio-suave"> ({option.note})</span> : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-studio-suave">Nada cadastrado ainda.</p>
      )}
      {errors?.length ? (
        <p id={errorId} className="mt-1 text-sm font-semibold text-benja-erro">
          {errors[0]}
        </p>
      ) : null}
    </fieldset>
  );
}
