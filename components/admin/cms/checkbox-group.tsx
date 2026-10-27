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
 Modificado em: 26/10/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 26/10/2026 Vinícius Nishimura Reis  Criação inicial (ADM-06).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

export interface CheckboxOption {
  value: string;
  label: string;
  /** Observação curta ao lado do rótulo (ex.: "rascunho"). */
  note?: string;
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
    <fieldset aria-describedby={errors?.length ? errorId : undefined}>
      <legend className="text-sm font-bold text-benja-noite">{legend}</legend>
      {hint ? <p className="mt-1 text-xs text-benja-grafite/80">{hint}</p> : null}
      {options.length ? (
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <li key={option.value}>
              <label className="flex items-center gap-3 rounded-xl border-2 border-benja-noite/15 bg-white px-3 py-2 text-sm has-[:checked]:border-benja-verde has-[:checked]:bg-benja-claro/40">
                <input
                  type="checkbox"
                  name={name}
                  value={option.value}
                  defaultChecked={selected.includes(option.value)}
                  className="size-5 shrink-0 accent-benja-verde"
                />
                <span>
                  {option.label}
                  {option.note ? <span className="text-benja-grafite/70"> ({option.note})</span> : null}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-benja-grafite/80">Nada cadastrado ainda.</p>
      )}
      {errors?.length ? (
        <p id={errorId} className="mt-1 text-sm font-semibold text-benja-erro">
          {errors[0]}
        </p>
      ) : null}
    </fieldset>
  );
}
