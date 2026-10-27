/*
════════════════════════════════════════════════════════════════════════════════
 Sistema      : Agência Benjamin Landing Page
 Módulo       : Components
 Arquivo      : slug-field.tsx
 Descrição    : Campo de endereço (slug) com sugestão a partir do nome e trava após publicar.

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
 26/10/2026 Vinícius Nishimura Reis  Sugestão a partir do campo de origem (título do case) (ADM-08).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { TextField } from "@/components/forms/fields";
import { slugify } from "@/lib/domain/content/slug";

/**
 * Endereço (slug). Ao entrar no campo vazio, sugere um a partir do nome.
 * Depois da primeira publicação o campo fica só leitura: os links já circulam.
 */
export function SlugField({
  locked,
  errors,
  defaultValue,
  source = "name",
}: {
  locked: boolean;
  errors?: string[];
  defaultValue?: string;
  /** Campo de onde vem a sugestão (nome ou título). */
  source?: string;
}) {
  if (locked) {
    return (
      <div>
        <p className="text-sm font-bold text-benja-noite">Endereço (slug)</p>
        <input type="hidden" name="slug" value={defaultValue} />
        <p className="mt-1.5 rounded-2xl border-2 border-benja-noite/20 bg-benja-creme px-4 py-3 font-mono text-sm">
          {defaultValue}
        </p>
        <p className="mt-1 text-xs text-benja-grafite/80">Fixo depois da primeira publicação.</p>
      </div>
    );
  }
  return (
    <div
      onFocus={(event) => {
        // Ao entrar no campo vazio, sugere o endereço a partir do nome já digitado.
        const input = event.target;
        if (!(input instanceof HTMLInputElement) || input.name !== "slug" || input.value) return;
        const name = input.form?.elements.namedItem(source);
        if (name instanceof HTMLInputElement) input.value = slugify(name.value);
      }}
    >
      <TextField
        name="slug"
        label="Endereço (slug)"
        required
        maxLength={80}
        hint="Minúsculas, números e hífens. Ex.: social-media."
        errors={errors}
        defaultValue={defaultValue}
      />
    </div>
  );
}
