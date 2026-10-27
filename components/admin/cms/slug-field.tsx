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
 26/10/2026 Vinícius Nishimura Reis  Slug em branco gerado pelo servidor, sem preenchimento no navegador (TECH-12).
──────────────────────────────────────────────────────────────────────────────
*/

"use client";

import { TextField } from "@/components/forms/fields";

/**
 * Endereço (slug). Em branco, o servidor gera a partir do nome ou título (único entre os
 * itens). Não há preenchimento automático no navegador: ele se misturava com o que a pessoa
 * colava ou digitava no campo (achado do E2E do TECH-12). Depois da primeira publicação o
 * campo fica só leitura — os links já circulam.
 */
export function SlugField({
  locked,
  errors,
  defaultValue,
  source = "nome",
}: {
  locked: boolean;
  errors?: string[];
  defaultValue?: string;
  /** Como o campo de origem aparece na dica ("nome" ou "título"). */
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
    <TextField
      name="slug"
      label="Endereço (slug)"
      maxLength={80}
      hint={`Minúsculas, números e hífens (ex.: social-media). Em branco, é gerado a partir do ${source}.`}
      errors={errors}
      defaultValue={defaultValue}
    />
  );
}
