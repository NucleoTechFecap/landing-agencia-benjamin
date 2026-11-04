/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : team-members-field.tsx
 Descrição    : Campo repetível de pessoas do bloco Nosso time.

 Desenvolvedor: Vinícius Nishimura Reis

 Projeto      : Agência Benjamin Landing Page
 Versão       : 1.0.0
 Criado em    : 01/11/2026
 Modificado em: 04/11/2026
════════════════════════════════════════════════════════════════════════════════

 Histórico
 ──────────────────────────────────────────────────────────────────────────────
 Data        Autor                     Descrição
 ──────────────────────────────────────────────────────────────────────────────
 01/11/2026 Vinícius Nishimura Reis  Editor de páginas e blocos (ADM-05).
 04/11/2026 Vinícius Nishimura Reis  Responsividade, toque e teclado no painel (ADM-16).
 04/11/2026 Vinícius Nishimura Reis  Reestruturação visual do painel (Benjamin Studio).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { useState } from "react";
import { SelectField, TextField } from "@/components/forms/fields";
import type { TeamMemberInput } from "@/lib/domain/content/block-input";

export interface PhotoOption {
  id: string;
  label: string;
  src: string;
}

const button = "studio-btn studio-btn-secundario";

const BLANK: TeamMemberInput = { name: "", role: "", photoId: "" };

/** Pessoas do "Nosso time", uma linha por pessoa, na ordem em que aparecem no site (SOB-03). */
export function TeamMembersField({
  initial,
  photos,
  errors,
}: {
  initial: TeamMemberInput[];
  photos: PhotoOption[];
  errors?: string[];
}) {
  const [rows, setRows] = useState(() =>
    (initial.length ? initial : [BLANK]).map((member, index) => ({ ...member, key: index })),
  );
  const options = photos.map((photo) => ({ value: photo.id, label: photo.label }));
  const move = (index: number, target: number) =>
    setRows((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  return (
    <fieldset className="min-w-0 space-y-4">
      <legend className="text-sm font-bold text-benja-noite">Pessoas</legend>
      <p className="text-xs text-studio-suave">
        Publique só nomes, cargos e fotos que a pessoa autorizou. As fotos vêm da biblioteca de mídia e precisam de
        texto alternativo.
      </p>
      {errors?.length ? <p className="text-sm font-semibold text-benja-erro">{errors[0]}</p> : null}
      {rows.map((member, index) => (
        <div key={member.key} className="space-y-3 rounded-studio-md border border-studio-linha p-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField
              id={`member-${member.key}-name`}
              name="memberName"
              label="Nome"
              required
              maxLength={80}
              defaultValue={member.name}
            />
            <TextField
              id={`member-${member.key}-role`}
              name="memberRole"
              label="Cargo ou área"
              maxLength={80}
              defaultValue={member.role}
            />
          </div>
          <SelectField
            id={`member-${member.key}-photo`}
            name="memberPhoto"
            label="Foto"
            placeholder="Sem foto"
            options={options}
            defaultValue={member.photoId}
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={button} disabled={index === 0} onClick={() => move(index, index - 1)}>
              Subir<span className="sr-only"> a pessoa {index + 1}</span>
            </button>
            <button
              type="button"
              className={button}
              disabled={index === rows.length - 1}
              onClick={() => move(index, index + 1)}
            >
              Descer<span className="sr-only"> a pessoa {index + 1}</span>
            </button>
            <button
              type="button"
              className={button}
              onClick={() => setRows((current) => current.filter((item) => item.key !== member.key))}
            >
              Remover<span className="sr-only"> a pessoa {index + 1}</span>
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        className={button}
        onClick={() =>
          setRows((current) => [...current, { ...BLANK, key: Math.max(-1, ...current.map((item) => item.key)) + 1 }])
        }
      >
        Adicionar pessoa
      </button>
    </fieldset>
  );
}
